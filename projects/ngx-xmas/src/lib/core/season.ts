import { Injectable, computed, inject, signal } from '@angular/core';

import { XMAS_CONFIG, XmasMonthDay } from './config';
import { XMAS_CLOCK } from './tokens';

/** Whether `date` (in local time) falls within `start`..`end`, inclusive. Handles ranges spanning New Year. */
export function isWithinSeason(date: Date, start: XmasMonthDay, end: XmasMonthDay): boolean {
  const value = (date.getMonth() + 1) * 100 + date.getDate();
  const from = start.month * 100 + start.day;
  const to = end.month * 100 + end.day;
  return from <= to ? value >= from && value <= to : value >= from || value <= to;
}

@Injectable({ providedIn: 'root' })
export class XmasSeason {
  private readonly clock = inject(XMAS_CLOCK);
  private readonly config = inject(XMAS_CONFIG);
  private readonly revision = signal(0);

  /** The current date as reported by `XMAS_CLOCK`. Re-read on `refresh()` or when the clock's signals change. */
  readonly today = computed(() => {
    this.revision();
    return this.clock();
  });

  /** Whether today lies within the configured season, ignoring `forceActive` and `enabled`. */
  readonly inSeason = computed(() =>
    isWithinSeason(this.today(), this.config.start, this.config.end),
  );

  /** Whether Christmas effects should be shown. */
  readonly active = computed(
    () => this.config.enabled() && (this.config.forceActive() || this.inSeason()),
  );

  /** Re-reads the clock, e.g. after the app has been open across midnight. */
  refresh(): void {
    this.revision.update((n) => n + 1);
  }
}
