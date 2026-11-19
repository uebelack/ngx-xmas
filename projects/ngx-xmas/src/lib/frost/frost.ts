import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

import { XmasIdle } from '../core/idle';
import { injectXmasRender, toCssLength, uniqueXmasId } from '../core/render';
import { XmasLength } from '../overlay/overlay';
import { FrostArt, drawFrostArt } from './frost-art';

export type XmasFrostCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type XmasFrostMode = 'static' | 'idle';

const ALL_CORNERS: readonly XmasFrostCorner[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

const ART: Record<XmasFrostCorner, FrostArt> = {
  'top-left': drawFrostArt(1224),
  'top-right': drawFrostArt(2512),
  'bottom-left': drawFrostArt(3112),
  'bottom-right': drawFrostArt(601),
};

/**
 * Frost growing in from the corners of the viewport.
 *
 * ```html
 * <xmas-frost mode="idle" [idleTimeout]="60000" maxSize="30vmin" />
 * ```
 */
@Component({
  selector: 'xmas-frost',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (render()) {
      @for (corner of cornerList(); track corner) {
        <div
          [class]="'corner corner--' + corner"
          [class.frosted]="frosted()"
          data-xmas-frost-corner
        >
          <div class="blur"></div>
          <svg
            viewBox="0 0 200 200"
            preserveAspectRatio="none"
            focusable="false"
            aria-hidden="true"
          >
            <defs>
              <radialGradient [attr.id]="id + '-ice'" cx="0" cy="0" r="1" fx="0" fy="0">
                <stop offset="0" class="stop-core" />
                <stop offset="0.4" class="stop-tint" stop-opacity="0.75" />
                <stop offset="0.75" class="stop-tint" stop-opacity="0.35" />
                <stop offset="1" class="stop-tint" stop-opacity="0" />
              </radialGradient>
              <filter [attr.id]="id + '-edge'" x="-10%" y="-10%" width="130%" height="130%">
                <feTurbulence type="turbulence" baseFrequency="0.035" numOctaves="4" seed="7" />
                <feDisplacementMap
                  in="SourceGraphic"
                  scale="34"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              <filter [attr.id]="id + '-grain'" x="0" y="0" width="100%" height="100%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.85"
                  numOctaves="2"
                  seed="3"
                  result="noise"
                />
                <feColorMatrix
                  in="noise"
                  type="matrix"
                  values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.4 1.55"
                  result="speckle"
                />
                <feComposite in="speckle" in2="SourceGraphic" operator="in" />
              </filter>
              <filter [attr.id]="id + '-glow'" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.6" />
              </filter>
            </defs>
            <path
              class="sheet"
              d="M0 0H188C176 58 132 128 70 160C44 174 20 182 0 186Z"
              [attr.fill]="'url(#' + id + '-ice)'"
              [attr.filter]="'url(#' + id + '-edge)'"
            />
            <path
              class="grain"
              d="M0 0H160C150 60 110 115 55 140C36 150 18 156 0 158Z"
              [attr.filter]="'url(#' + id + '-grain)'"
            />
            <path
              class="crystals-glow"
              [attr.d]="art[corner].dendrites"
              [attr.filter]="'url(#' + id + '-glow)'"
            />
            <path class="crystals" [attr.d]="art[corner].dendrites" />
            <path class="stars" [attr.d]="art[corner].stars" />
          </svg>
        </div>
      }
    }
  `,
  styleUrl: './frost.css',
  host: {
    'aria-hidden': 'true',
    '[class.xmas-on]': 'render()',
    '[style.--xmas-frost-size]': 'size()',
  },
})
export class XmasFrost {
  private readonly idle = inject(XmasIdle);

  /** Which corners are frosted. Default: all four. */
  readonly corners = input<readonly XmasFrostCorner[]>(ALL_CORNERS);
  /** `static`: always visible. `idle`: creeps in after `idleTimeout`, melts on activity. */
  readonly mode = input<XmasFrostMode>('idle');
  /** Milliseconds of inactivity before frost appears in `idle` mode. */
  readonly idleTimeout = input(60_000);
  /** How far the frost grows into the screen (any CSS length, or px). */
  readonly maxSize = input<XmasLength>('32vmin');

  protected readonly render = injectXmasRender();
  protected readonly id = uniqueXmasId('frost');
  protected readonly art = ART;
  protected readonly size = computed(() => toCssLength(this.maxSize()));
  protected readonly cornerList = computed(() => [...new Set(this.corners())]);

  private readonly idleNow = signal(false);
  /** Whether the frost is (growing) visible right now. */
  readonly frosted = computed(() => this.render() && (this.mode() === 'static' || this.idleNow()));

  constructor() {
    effect((onCleanup) => {
      if (!this.render() || this.mode() !== 'idle') {
        return;
      }
      const timeout = this.idleTimeout();
      const stop = untracked(() => this.idle.watch(timeout, (idle) => this.idleNow.set(idle)));
      onCleanup(() => {
        stop();
        this.idleNow.set(false);
      });
    });
  }
}
