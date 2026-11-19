import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { injectXmasRender, toCssLength } from '../core/render';

export type XmasOverlayAnchor = 'viewport' | 'parent';

/** A CSS length, or a number of pixels. */
export type XmasLength = string | number;

/**
 * Positions projected content (e.g. a Santa hat) absolutely on screen. Never blocks clicks.
 *
 * ```html
 * <div class="logo" style="position: relative">
 *   <img src="logo.svg" alt="ACME" />
 *   <xmas-overlay top="-18px" left="-12px" width="48px" rotate="-20">
 *     <xmas-santa-hat />
 *   </xmas-overlay>
 * </div>
 * ```
 */
@Component({
  selector: 'xmas-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (render()) {
      <ng-content />
    }
  `,
  styles: `
    :host(.xmas-on) {
      display: block;
      pointer-events: none;
      user-select: none;
      line-height: 0;
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[class.xmas-on]': 'render()',
    '[style]': 'hostStyle()',
  },
})
export class XmasOverlay {
  /** `viewport`: `position: fixed`. `parent`: `position: absolute` in the nearest positioned ancestor. */
  readonly anchor = input<XmasOverlayAnchor>('parent');
  readonly top = input<XmasLength | null>(null);
  readonly left = input<XmasLength | null>(null);
  readonly right = input<XmasLength | null>(null);
  readonly bottom = input<XmasLength | null>(null);
  readonly width = input<XmasLength | null>(null);
  /** Rotation; a number means degrees, a string is any CSS angle (e.g. `'0.1turn'`). */
  readonly rotate = input<string | number | null>(null);
  readonly zIndex = input<string | number | null>(null);

  protected readonly render = injectXmasRender();

  protected readonly hostStyle = computed((): Record<string, string | null> => {
    if (!this.render()) {
      return {};
    }
    const rotate = this.rotate();
    return {
      position: this.anchor() === 'viewport' ? 'fixed' : 'absolute',
      top: toCssLength(this.top()),
      left: toCssLength(this.left()),
      right: toCssLength(this.right()),
      bottom: toCssLength(this.bottom()),
      width: toCssLength(this.width()),
      transform:
        rotate === null || rotate === ''
          ? null
          : `rotate(${typeof rotate === 'number' ? `${rotate}deg` : rotate})`,
      'z-index': this.zIndex() === null ? null : String(this.zIndex()),
    };
  });
}
