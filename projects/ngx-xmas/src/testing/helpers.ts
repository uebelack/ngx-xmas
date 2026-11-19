import { Provider, signal } from '@angular/core';

import { XMAS_CLOCK, XMAS_RANDOM } from '../lib/core/tokens';

/** Local-time date; `month` is 1-based. */
export function localDate(year: number, month: number, day: number, hour = 12): Date {
  return new Date(year, month - 1, day, hour);
}

/** A clock backed by a writable signal so tests can move the date. */
export function fakeClock(initial: Date) {
  const now = signal(initial);
  const provider: Provider = { provide: XMAS_CLOCK, useValue: () => now() };
  return { now, provider };
}

/** Returns queued values in order, then `fallback` once the queue is empty. */
export function fakeRandom(fallback = 0.5) {
  const queue: number[] = [];
  const random = vi.fn(() => queue.shift() ?? fallback);
  const provider: Provider = { provide: XMAS_RANDOM, useValue: random };
  return { queue, random, provider };
}

/**
 * Stubs `matchMedia` on the document's window so `(prefers-reduced-motion: reduce)` matches
 * `reduce`. Returns a restore function.
 */
export function stubReducedMotion(reduce: boolean): () => void {
  const win = document.defaultView!;
  const original = Object.getOwnPropertyDescriptor(win, 'matchMedia');
  const matchMedia = vi.fn((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Object.defineProperty(win, 'matchMedia', {
    value: matchMedia,
    configurable: true,
    writable: true,
  });
  return () => {
    if (original) {
      Object.defineProperty(win, 'matchMedia', original);
    } else {
      Reflect.deleteProperty(win, 'matchMedia');
    }
  };
}

/** Fakes `document.visibilityState` and fires `visibilitychange`. */
export function setPageVisible(visible: boolean): void {
  Object.defineProperty(document, 'visibilityState', {
    value: visible ? 'visible' : 'hidden',
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

/** Removes the `visibilityState` override installed by `setPageVisible`. */
export function resetPageVisible(): void {
  Reflect.deleteProperty(document, 'visibilityState');
}
