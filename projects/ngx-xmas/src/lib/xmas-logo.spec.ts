import { TestBed } from '@angular/core/testing';

import { XmasLogo } from './xmas-logo';

async function render(date: Date) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(date);
  const fixture = TestBed.createComponent(XmasLogo);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('XmasLogo', () => {
  afterEach(() => vi.useRealTimers());

  it('shows the hat in December', async () => {
    expect((await render(new Date(2026, 11, 24))).querySelector('svg')).not.toBeNull();
  });

  it('renders nothing outside December', async () => {
    expect((await render(new Date(2026, 10, 30))).querySelector('svg')).toBeNull();
    expect((await render(new Date(2027, 0, 1))).querySelector('svg')).toBeNull();
  });

  it('applies position, size and rotation', async () => {
    const el = await render(new Date(2026, 11, 1));
    expect(el.style.top).toBe('-18px');
    expect(el.style.left).toBe('-12px');
    expect(el.style.width).toBe('40px');
    expect(el.style.transform).toBe('rotate(-20deg)');
  });
});
