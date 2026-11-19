import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  Injectable,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

import { XmasEnvironment } from '../core/environment';
import { injectXmasRender } from '../core/render';
import { XmasSeason } from '../core/season';
import { PausableTimeout } from '../core/timer';
import { XMAS_RANDOM } from '../core/tokens';
import { XmasReindeer } from './reindeer';

export type XmasSantaDirection = 'ltr' | 'rtl' | 'random';
export type XmasSantaVariant = 'backwards' | 'chaser';
export type XmasSantaCargo = 'sack' | 'presents' | 'empty';

interface Flight {
  id: number;
  direction: 'ltr' | 'rtl';
  variant: XmasSantaVariant | null;
}

interface DroppedPresent {
  id: number;
  x: number;
  y: number;
  hue: number;
}

const FLOWN_KEY = 'ngx-xmas:santa-flown';
const PRESENT_LIFETIME = 2600;

/** Remembers whether Santa flew this session; falls back to memory if sessionStorage is unavailable. */
@Injectable({ providedIn: 'root' })
export class XmasSantaSession {
  private readonly document = inject(DOCUMENT);
  private flownInMemory = false;

  hasFlown(): boolean {
    try {
      return (
        this.document.defaultView?.sessionStorage.getItem(FLOWN_KEY) === '1' || this.flownInMemory
      );
    } catch {
      return this.flownInMemory;
    }
  }

  markFlown(): void {
    this.flownInMemory = true;
    try {
      this.document.defaultView?.sessionStorage.setItem(FLOWN_KEY, '1');
    } catch {
      // Storage disabled (privacy mode, sandboxed iframe): memory fallback above.
    }
  }
}

/** Sled contents for a given date: piled high on Christmas Eve, empty after delivery. */
export function xmasSantaCargo(date: Date): XmasSantaCargo {
  if (date.getMonth() !== 11) {
    return 'sack';
  }
  const day = date.getDate();
  return day === 24 ? 'presents' : day === 25 || day === 26 ? 'empty' : 'sack';
}

/**
 * Santa's sled, pulled by reindeer, occasionally crossing the host element.
 * Place it in a positioned container such as a nav bar; it fills and clips to it.
 *
 * ```html
 * <nav style="position: relative">
 *   <xmas-santa #santa [minInterval]="120000" [maxInterval]="600000" />
 * </nav>
 * ```
 */
@Component({
  selector: 'xmas-santa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [XmasReindeer],
  templateUrl: './santa.html',
  styleUrl: './santa.css',
  host: {
    'aria-hidden': 'true',
    '[class.xmas-on]': 'render()',
    '[style.--xmas-play]': 'render() && !env.pageVisible() ? "paused" : null',
  },
})
export class XmasSanta {
  protected readonly env = inject(XmasEnvironment);
  private readonly season = inject(XmasSeason);
  private readonly random = inject(XMAS_RANDOM);
  private readonly session = inject(XmasSantaSession);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Shortest pause (ms) before the first flight and between flights. */
  readonly minInterval = input(90_000);
  /** Longest pause (ms) before the first flight and between flights. */
  readonly maxInterval = input(300_000);
  /** How long (ms) one crossing takes. */
  readonly duration = input(9_000);
  readonly direction = input<XmasSantaDirection>('random');
  /** Fly automatically at most once per browser session. Manual `fly()` still works. */
  readonly oncePerSession = input(false);
  /** Chance (0–1) that a flight uses a rare variant. */
  readonly variantProbability = input(1 / 50);

  /** Emitted when a flight has crossed the host. */
  readonly flightEnd = output<void>();
  /** Emitted when clicking Santa drops a present. */
  readonly presentDropped = output<void>();

  protected readonly render = injectXmasRender();
  protected readonly flight = signal<Flight | null>(null);
  protected readonly presents = signal<DroppedPresent[]>([]);
  protected readonly cargo = computed(() => xmasSantaCargo(this.season.today()));

  private readonly canFly = computed(() => this.render() && !this.env.reducedMotion());
  private readonly timers = new Set<PausableTimeout>();
  private nextTimer: PausableTimeout | null = null;
  private nextId = 0;

  constructor() {
    effect((onCleanup) => {
      if (this.render()) {
        onCleanup(untracked(() => this.env.connect()));
      }
    });

    effect((onCleanup) => {
      if (!this.canFly()) {
        return;
      }
      untracked(() => this.scheduleNext());
      onCleanup(() => this.reset());
    });

    effect(() => {
      const visible = this.env.pageVisible();
      untracked(() => this.timers.forEach((t) => (visible ? t.resume() : t.pause())));
    });
  }

  /** Starts a flight now, unless one is in progress, it's out of season, or reduced motion is on. */
  fly(): void {
    if (!this.canFly() || this.flight()) {
      return;
    }
    this.clearTimer(this.nextTimer);
    this.nextTimer = null;
    this.startFlight();
  }

  protected dropPresent(event: MouseEvent): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const present: DroppedPresent = {
      id: this.nextId++,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      hue: Math.floor(this.random() * 360),
    };
    this.presents.update((list) => [...list, present]);
    this.presentDropped.emit();
    this.startTimer(() => {
      this.presents.update((list) => list.filter((p) => p.id !== present.id));
    }, PRESENT_LIFETIME);
  }

  private scheduleNext(): void {
    if (this.oncePerSession() && this.session.hasFlown()) {
      return;
    }
    const min = Math.max(0, this.minInterval());
    const max = Math.max(min, this.maxInterval());
    const delay = min + this.random() * (max - min);
    this.nextTimer = this.startTimer(() => {
      this.nextTimer = null;
      this.startFlight();
    }, delay);
  }

  private startFlight(): void {
    const dir = this.direction();
    const direction = dir === 'random' ? (this.random() < 0.5 ? 'ltr' : 'rtl') : dir;
    const variant: XmasSantaVariant | null =
      this.random() < this.variantProbability()
        ? this.random() < 0.5
          ? 'backwards'
          : 'chaser'
        : null;

    this.flight.set({ id: this.nextId++, direction, variant });
    if (this.oncePerSession()) {
      this.session.markFlown();
    }
    this.startTimer(() => {
      this.flight.set(null);
      this.flightEnd.emit();
      this.scheduleNext();
    }, this.duration());
  }

  private startTimer(callback: () => void, delay: number): PausableTimeout {
    const timer: PausableTimeout = new PausableTimeout(
      () => {
        this.timers.delete(timer);
        callback();
      },
      delay,
      !this.env.pageVisible(),
    );
    this.timers.add(timer);
    return timer;
  }

  private clearTimer(timer: PausableTimeout | null): void {
    if (timer) {
      timer.clear();
      this.timers.delete(timer);
    }
  }

  private reset(): void {
    this.timers.forEach((t) => t.clear());
    this.timers.clear();
    this.nextTimer = null;
    this.flight.set(null);
    this.presents.set([]);
  }
}
