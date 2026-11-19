import { PLATFORM_ID, Signal, afterNextRender, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { XmasSeason } from './season';

/**
 * Whether a component should render its effect: in the browser, after the first render
 * (so SSR output and hydration stay empty), and only while the season is active.
 * Must be called in an injection context.
 */
export function injectXmasRender(): Signal<boolean> {
  const season = inject(XmasSeason);
  const mounted = signal(false);
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    afterNextRender(() => mounted.set(true));
  }
  return computed(() => mounted() && season.active());
}

/** Converts a number to px; passes strings through as CSS lengths. */
export function toCssLength(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return typeof value === 'number' ? `${value}px` : value;
}

let nextId = 0;

/** Unique id for SVG `<defs>` so multiple instances don't clash. */
export function uniqueXmasId(prefix: string): string {
  return `xmas-${prefix}-${nextId++}`;
}
