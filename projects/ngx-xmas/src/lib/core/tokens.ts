import { InjectionToken } from '@angular/core';

/**
 * Returns the current date. Override `XMAS_CLOCK` to fake the date in tests or demos.
 *
 * The clock is read inside a signal computation, so a clock that reads a signal
 * (e.g. `() => myDateSignal()`) makes the season re-evaluate whenever that signal changes.
 */
export type XmasClock = () => Date;

export const XMAS_CLOCK = new InjectionToken<XmasClock>('XMAS_CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date(),
});

/** Returns a number in `[0, 1)`, like `Math.random`. */
export type XmasRandom = () => number;

export const XMAS_RANDOM = new InjectionToken<XmasRandom>('XMAS_RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});
