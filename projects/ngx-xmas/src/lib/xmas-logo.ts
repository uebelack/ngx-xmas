import { ChangeDetectionStrategy, Component, afterNextRender, input, signal } from '@angular/core';

/**
 * A Santa hat for your logo. Only visible in December.
 * Place it inside a positioned element (e.g. `position: relative`) and adjust the inputs.
 *
 * ```html
 * <a class="logo" style="position: relative">
 *   <img src="logo.svg" alt="ACME" />
 *   <xmas-logo top="-17px" left="-11px" width="36px" rotate="-22deg" />
 * </a>
 * ```
 */
@Component({
  selector: 'xmas-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <svg viewBox="0 0 128 104" focusable="false" aria-hidden="true">
        <!-- cone -->
        <path
          class="red"
          d="M14 80 C18 50 34 22 62 13 C84 6 104 12 113 30 C117 38 117 46 114 52
             C108 42 100 36 92 38 C98 52 104 66 110 80 Z"
        />
        <!-- shading on the fold and the right flank -->
        <path
          class="red-shade"
          d="M92 38 C100 36 108 42 114 52 C111 46 104 40 96 42 C100 54 104 66 110 80 L100 80
             C96 64 92 50 86 40 Z"
        />
        <path class="highlight" d="M28 70 C30 50 42 30 60 21 C46 32 37 50 34 70 Z" />
        <!-- pompom -->
        <circle class="fur" cx="113" cy="56" r="12" />
        <circle class="fur-shade" cx="116" cy="60" r="7" />
        <circle class="fur" cx="110" cy="52" r="7" />
        <!-- fur brim -->
        <rect class="fur-shade" x="6" y="76" width="112" height="22" rx="11" />
        <rect class="fur" x="6" y="74" width="112" height="20" rx="10" />
        <circle class="fur" cx="16" cy="78" r="7" />
        <circle class="fur" cx="34" cy="75" r="8" />
        <circle class="fur" cx="54" cy="77" r="7" />
        <circle class="fur" cx="73" cy="74" r="8" />
        <circle class="fur" cx="92" cy="77" r="7" />
        <circle class="fur" cx="108" cy="75" r="8" />
        <circle class="fur-shade" cx="26" cy="90" r="4" />
        <circle class="fur-shade" cx="62" cy="91" r="4" />
        <circle class="fur-shade" cx="98" cy="90" r="4" />
      </svg>
    }
  `,
  styles: `
    :host {
      position: absolute;
      z-index: 2;
      display: block;
      pointer-events: none;
      user-select: none;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
      filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.25));
    }
    .red {
      fill: #d62828;
    }
    .red-shade {
      fill: #9d1720;
    }
    .highlight {
      fill: #fff;
      opacity: 0.18;
    }
    .fur {
      fill: #ffffff;
    }
    .fur-shade {
      fill: #dfe6ee;
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[style.top]': 'top()',
    '[style.left]': 'left()',
    '[style.width]': 'width()',
    '[style.transform]': '"rotate(" + rotate() + ")"',
  },
})
export class XmasLogo {
  readonly top = input('-18px');
  readonly left = input('-12px');
  readonly width = input('40px');
  readonly rotate = input('-20deg');

  /** December only; set after the first render so nothing is rendered on the server. */
  protected readonly visible = signal(false);

  constructor() {
    afterNextRender(() => this.visible.set(new Date().getMonth() === 11));
  }
}
