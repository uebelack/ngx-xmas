import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  XmasFrost,
  XmasFrostMode,
  XmasOverlay,
  XmasSanta,
  XmasSantaDirection,
  XmasSantaHat,
  XmasSeason,
  xmasSantaCargo,
} from 'ngx-xmas';

import { demoState } from './demo-state';

const pad = (n: number) => String(n).padStart(2, '0');
const toInputValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [XmasOverlay, XmasSantaHat, XmasFrost, XmasSanta],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly season = inject(XmasSeason);
  protected readonly state = demoState;
  private readonly santa = viewChild.required(XmasSanta);

  protected readonly frostMode = signal<XmasFrostMode>('idle');
  protected readonly idleTimeout = signal(10_000);
  protected readonly direction = signal<XmasSantaDirection>('random');
  protected readonly alwaysVariant = signal(false);
  protected readonly flights = signal(0);
  protected readonly presents = signal(0);

  protected readonly dateValue = computed(() => toInputValue(this.season.today()));
  protected readonly todayLabel = computed(() =>
    this.season.today().toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );
  protected readonly cargo = computed(() => xmasSantaCargo(this.season.today()));
  protected readonly reducedMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected readonly quickDates = [
    { label: '30 Nov', month: 11, day: 30 },
    { label: '1 Dec', month: 12, day: 1 },
    { label: '24 Dec', month: 12, day: 24 },
    { label: '25 Dec', month: 12, day: 25 },
    { label: '27 Dec', month: 12, day: 27 },
  ];

  protected setDate(value: string): void {
    const [y, m, d] = value.split('-').map(Number);
    this.state.date.set(y && m && d ? new Date(y, m - 1, d, 12) : null);
  }

  protected setQuickDate(month: number, day: number): void {
    this.state.date.set(new Date(new Date().getFullYear(), month - 1, day, 12));
  }

  protected fly(): void {
    this.santa().fly();
  }
}
