import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { fakeClock, localDate } from '../../testing/helpers';
import { XmasConfig, provideXmas } from './config';
import { XmasSeason, isWithinSeason } from './season';
import { XMAS_CLOCK } from './tokens';

function setup(date: Date, config?: XmasConfig) {
  const clock = fakeClock(date);
  TestBed.configureTestingModule({
    providers: [clock.provider, ...(config ? [provideXmas(config)] : [])],
  });
  return { season: TestBed.inject(XmasSeason), clock };
}

describe('XmasSeason', () => {
  describe('default season (1–26 December)', () => {
    it.each([
      ['30 Nov', localDate(2026, 11, 30), false],
      ['1 Dec, just after midnight', localDate(2026, 12, 1, 0), true],
      ['24 Dec', localDate(2026, 12, 24), true],
      ['26 Dec, late evening', localDate(2026, 12, 26, 23), true],
      ['27 Dec', localDate(2026, 12, 27, 0), false],
      ['1 Jan', localDate(2027, 1, 1), false],
      ['mid-summer', localDate(2026, 7, 15), false],
    ])('%s → active: %s', (_label, date, expected) => {
      expect(setup(date).season.active()).toBe(expected);
    });

    it('applies every year', () => {
      expect(setup(localDate(2031, 12, 10)).season.active()).toBe(true);
    });

    it('works without provideXmas()', () => {
      const { season } = setup(localDate(2026, 12, 5));
      expect(season.inSeason()).toBe(true);
    });
  });

  describe('custom range', () => {
    it('honours a range within one year', () => {
      const config: XmasConfig = { start: { month: 11, day: 20 }, end: { month: 12, day: 31 } };
      expect(setup(localDate(2026, 11, 19), config).season.active()).toBe(false);
      TestBed.resetTestingModule();
      expect(setup(localDate(2026, 11, 20), config).season.active()).toBe(true);
      TestBed.resetTestingModule();
      expect(setup(localDate(2026, 12, 31), config).season.active()).toBe(true);
    });

    it.each([
      ['15 Dec', localDate(2026, 12, 15), true],
      ['31 Dec', localDate(2026, 12, 31), true],
      ['1 Jan', localDate(2027, 1, 1), true],
      ['6 Jan', localDate(2027, 1, 6), true],
      ['7 Jan', localDate(2027, 1, 7), false],
      ['14 Dec', localDate(2026, 12, 14), false],
      ['mid-summer', localDate(2026, 7, 1), false],
    ])('spans New Year (15 Dec–6 Jan): %s → %s', (_label, date, expected) => {
      const config: XmasConfig = { start: { month: 12, day: 15 }, end: { month: 1, day: 6 } };
      expect(setup(date, config).season.active()).toBe(expected);
    });
  });

  describe('forceActive', () => {
    it('activates out of season', () => {
      const { season } = setup(localDate(2026, 6, 1), { forceActive: true });
      expect(season.inSeason()).toBe(false);
      expect(season.active()).toBe(true);
    });

    it('accepts a signal', () => {
      const force = signal(false);
      const { season } = setup(localDate(2026, 6, 1), { forceActive: force });
      expect(season.active()).toBe(false);
      force.set(true);
      expect(season.active()).toBe(true);
    });
  });

  describe('enabled', () => {
    it('false disables everything, even forceActive', () => {
      expect(setup(localDate(2026, 12, 24), { enabled: false }).season.active()).toBe(false);
      TestBed.resetTestingModule();
      expect(
        setup(localDate(2026, 12, 24), { enabled: false, forceActive: true }).season.active(),
      ).toBe(false);
    });

    it('accepts a signal so the host can wire it to a preference', () => {
      const enabled = signal(true);
      const { season } = setup(localDate(2026, 12, 24), { enabled });
      expect(season.active()).toBe(true);
      enabled.set(false);
      expect(season.active()).toBe(false);
    });
  });

  it('re-evaluates when a signal-based clock changes', () => {
    const { season, clock } = setup(localDate(2026, 11, 30));
    expect(season.active()).toBe(false);
    clock.now.set(localDate(2026, 12, 1));
    expect(season.active()).toBe(true);
    expect(season.today().getDate()).toBe(1);
  });

  it('refresh() re-reads a plain clock', () => {
    let now = localDate(2026, 11, 30, 23);
    TestBed.configureTestingModule({
      providers: [{ provide: XMAS_CLOCK, useValue: () => now }],
    });
    const season = TestBed.inject(XmasSeason);
    expect(season.active()).toBe(false);
    now = localDate(2026, 12, 1, 0);
    expect(season.active()).toBe(false);
    season.refresh();
    expect(season.active()).toBe(true);
  });
});

describe('isWithinSeason', () => {
  it('evaluates in local time', () => {
    // 1 Dec 00:30 local time is in season regardless of the UTC date.
    expect(
      isWithinSeason(localDate(2026, 12, 1, 0), { month: 12, day: 1 }, { month: 12, day: 1 }),
    ).toBe(true);
  });
});
