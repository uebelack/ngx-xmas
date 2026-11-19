import {
  EnvironmentProviders,
  InjectionToken,
  Signal,
  isSignal,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';

/** A calendar day without a year. `month` is 1-based (1 = January, 12 = December). */
export interface XmasMonthDay {
  month: number;
  day: number;
}

export interface XmasConfig {
  /** First day of the season (inclusive). Default: 1 December. */
  start?: XmasMonthDay;
  /** Last day of the season (inclusive). Default: 26 December. May lie before `start` to span New Year. */
  end?: XmasMonthDay;
  /** Activate regardless of the date. Default: `false`. */
  forceActive?: boolean | Signal<boolean>;
  /** Global kill switch. When `false`, nothing is ever active. Default: `true`. */
  enabled?: boolean | Signal<boolean>;
}

/** Normalized config with defaults applied. */
export interface XmasResolvedConfig {
  start: XmasMonthDay;
  end: XmasMonthDay;
  forceActive: Signal<boolean>;
  enabled: Signal<boolean>;
}

export const XMAS_DEFAULT_START: XmasMonthDay = { month: 12, day: 1 };
export const XMAS_DEFAULT_END: XmasMonthDay = { month: 12, day: 26 };

export function resolveXmasConfig(config: XmasConfig = {}): XmasResolvedConfig {
  return {
    start: config.start ?? XMAS_DEFAULT_START,
    end: config.end ?? XMAS_DEFAULT_END,
    forceActive: toSignal(config.forceActive, false),
    enabled: toSignal(config.enabled, true),
  };
}

function toSignal(
  value: boolean | Signal<boolean> | undefined,
  fallback: boolean,
): Signal<boolean> {
  if (isSignal(value)) {
    return value;
  }
  return signal(value ?? fallback).asReadonly();
}

export const XMAS_CONFIG = new InjectionToken<XmasResolvedConfig>('XMAS_CONFIG', {
  providedIn: 'root',
  factory: () => resolveXmasConfig(),
});

/** Configures ngx-xmas. Without it, the default season (1–26 December) applies. */
export function provideXmas(config: XmasConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: XMAS_CONFIG, useValue: resolveXmasConfig(config) }]);
}
