import { signal } from '@angular/core';

/**
 * Demo controls. Created before bootstrap so `provideXmas()` and the clock override
 * can read them as signals.
 */
export const demoState = {
  /** Overrides today's date when set. */
  date: signal<Date | null>(null),
  forceActive: signal(false),
  enabled: signal(true),
};
