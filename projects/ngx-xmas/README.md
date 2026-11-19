# ngx-xmas

Christmas easter eggs for Angular business apps: a Santa hat on your logo, frost creeping
in from the screen corners while the user is idle, and Santa's sled occasionally flying
through your navigation bar.

Everything is active **only during the Christmas season** (1–26 December by default, local
time) and is a complete no-op otherwise: no DOM nodes, no listeners, no timers.

- Standalone components, signals, `OnPush`; works in zoneless apps
- SSR-safe: renders nothing on the server and only appears after hydration
- All artwork is inline SVG animated with CSS; no assets, no dependencies beyond Angular
- Respects `prefers-reduced-motion`, pauses while the tab is hidden, every element is
  `aria-hidden` and never focusable

## Installation

```sh
pnpm add ngx-xmas
```

Peer dependencies: `@angular/core` and `@angular/common` ^22.3.

## Setup

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideXmas } from 'ngx-xmas';

export const appConfig: ApplicationConfig = {
  providers: [provideXmas()],
};
```

### `provideXmas(config?)`

| Option        | Type                         | Default                  | Description                                                                         |
| ------------- | ---------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `start`       | `{ month, day }`             | `{ month: 12, day: 1 }`  | First day of the season, inclusive. `month` is 1-based.                             |
| `end`         | `{ month, day }`             | `{ month: 12, day: 26 }` | Last day, inclusive. May lie before `start` to span New Year (e.g. 15 Dec – 6 Jan). |
| `forceActive` | `boolean \| Signal<boolean>` | `false`                  | Activate regardless of the date (demos, testing).                                   |
| `enabled`     | `boolean \| Signal<boolean>` | `true`                   | Global kill switch; wins over `forceActive`.                                        |

Wire the kill switch to a user preference:

```ts
const settings = inject(UserSettings);
provideXmas({ enabled: settings.festiveEffects }); // a Signal<boolean>
```

### `XmasSeason`

Injectable service (`providedIn: 'root'`):

| Member      | Type              | Description                                                   |
| ----------- | ----------------- | ------------------------------------------------------------- |
| `active`    | `Signal<boolean>` | `enabled && (forceActive \|\| inSeason)`. Drives all effects. |
| `inSeason`  | `Signal<boolean>` | Whether today lies in the configured range.                   |
| `today`     | `Signal<Date>`    | The date reported by `XMAS_CLOCK`.                            |
| `refresh()` | `void`            | Re-reads the clock, e.g. for apps left open across midnight.  |

### Clock and random source

`XMAS_CLOCK` (`() => Date`) and `XMAS_RANDOM` (`() => number`, like `Math.random`) are
injection tokens you can override. The clock is read inside a signal computation, so a clock
that reads a signal makes the season update live:

```ts
const fakeToday = signal(new Date(2026, 11, 24));
providers: [{ provide: XMAS_CLOCK, useValue: () => fakeToday() }];
```

## Components

Import the standalone components you need:

```ts
import { XmasFrost, XmasOverlay, XmasSanta, XmasSantaHat } from 'ngx-xmas';
```

### `<xmas-overlay>` and `<xmas-santa-hat>`

A container that positions projected content (an `<img>`, an SVG, or the bundled
`<xmas-santa-hat>`) on top of your UI. `pointer-events: none`, so it never blocks clicks.

```html
<a class="logo" style="position: relative">
  <img src="logo.svg" alt="ACME" />
  <xmas-overlay top="-17px" left="-11px" width="36px" rotate="-22" zIndex="2">
    <xmas-santa-hat />
  </xmas-overlay>
</a>
```

| Input                            | Type                     | Default    | Description                                                                                       |
| -------------------------------- | ------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `anchor`                         | `'viewport' \| 'parent'` | `'parent'` | `viewport`: `position: fixed`. `parent`: `position: absolute` in the nearest positioned ancestor. |
| `top`, `left`, `right`, `bottom` | `string \| number`       | –          | Any CSS length; numbers are px.                                                                   |
| `width`                          | `string \| number`       | –          | Any CSS length; numbers are px. Content scales with it.                                           |
| `rotate`                         | `string \| number`       | –          | Numbers are degrees; strings are any CSS angle (`'0.1turn'`).                                     |
| `zIndex`                         | `string \| number`       | –          |                                                                                                   |

`<xmas-santa-hat>` has no inputs. It fills the width of its container, with the tip
drooping to the right.

### `<xmas-frost>`

A fixed full-viewport layer with ice crystals growing in from the corners. The crystals
are drawn procedurally as SVG, with a turbulence/displacement edge, a frost grain and
a backdrop blur where supported.

```html
<!-- creeps in after 60 s of inactivity, melts on mouse, key or touch -->
<xmas-frost />

<!-- always visible, top corners only -->
<xmas-frost mode="static" [corners]="['top-left', 'top-right']" maxSize="20vmin" />
```

| Input         | Type                                                               | Default    | Description                                                    |
| ------------- | ------------------------------------------------------------------ | ---------- | -------------------------------------------------------------- |
| `mode`        | `'static' \| 'idle'`                                               | `'idle'`   | `static`: always visible. `idle`: appears after `idleTimeout`. |
| `idleTimeout` | `number` (ms)                                                      | `60000`    | Inactivity before the frost creeps in (`idle` mode).           |
| `corners`     | `('top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right')[]` | all four   | Which corners are frosted.                                     |
| `maxSize`     | `string \| number`                                                 | `'32vmin'` | How far the frost grows into the screen. Numbers are px.       |

| Member    | Type              | Description                           |
| --------- | ----------------- | ------------------------------------- |
| `frosted` | `Signal<boolean>` | Whether the frost is currently shown. |

The idle listeners are passive, run outside Angular's change detection, and are shared
across instances. With reduced motion, frost appears and disappears without creeping.

### `<xmas-santa>`

Santa in his sled, pulled by three reindeer (Rudolph leads), crossing the host
horizontally every now and then. Put it in a positioned container such as your nav bar;
it fills that container (`position: absolute; inset: 0`) and clips to it. Only the sled
itself is clickable: clicking it drops a present that bounces at the bottom edge and
fades out.

The cargo depends on the date: a sack before Christmas Eve, a pile of presents on
24 December, and an empty sled on 25 and 26 December.

```html
<nav style="position: relative">
  …
  <xmas-santa
    #santa
    [minInterval]="120000"
    [maxInterval]="600000"
    [oncePerSession]="true"
    (presentDropped)="onPresent()"
  />
</nav>
<button (click)="santa.fly()">Ho ho ho</button>
```

| Input                | Type                         | Default    | Description                                                                                                             |
| -------------------- | ---------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `minInterval`        | `number` (ms)                | `90000`    | Shortest wait before the first flight and between flights.                                                              |
| `maxInterval`        | `number` (ms)                | `300000`   | Longest wait. Each wait is drawn uniformly between min and max.                                                         |
| `duration`           | `number` (ms)                | `9000`     | Time for one crossing.                                                                                                  |
| `direction`          | `'ltr' \| 'rtl' \| 'random'` | `'random'` |                                                                                                                         |
| `oncePerSession`     | `boolean`                    | `false`    | Fly automatically at most once per browser session (`sessionStorage`, with an in-memory fallback). `fly()` still works. |
| `variantProbability` | `number` (0–1)               | `1 / 50`   | Chance of a rare variant: Santa flying backwards, or a lone reindeer chasing the sled.                                  |

| Output           | Payload | Description                       |
| ---------------- | ------- | --------------------------------- |
| `flightEnd`      | `void`  | A flight has crossed the host.    |
| `presentDropped` | `void`  | Clicking Santa dropped a present. |

| Method  | Description                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------ |
| `fly()` | Start a flight now. Ignored during a flight, out of season, or when reduced motion is requested. |

With `prefers-reduced-motion: reduce` there are no flights at all. While the tab is hidden,
timers and animations are paused.

## Theming

All colours and sizes are CSS custom properties. Set them on the component or on any ancestor:

```css
xmas-frost {
  --xmas-frost-tint: #cde8ff;
  --xmas-frost-grow-duration: 20s;
}
```

| Variable                                                           | Default                         | Applies to       |
| ------------------------------------------------------------------ | ------------------------------- | ---------------- |
| `--xmas-hat-red` / `--xmas-hat-red-shade`                          | `#d62828` / `#9d1720`           | hat              |
| `--xmas-hat-fur` / `--xmas-hat-fur-shade`                          | `#ffffff` / `#dfe6ee`           | hat              |
| `--xmas-hat-shadow`                                                | `rgb(0 0 0 / 0.25)`             | hat              |
| `--xmas-frost-color`                                               | `#ffffff`                       | frost            |
| `--xmas-frost-tint`                                                | `#d4ebff`                       | frost            |
| `--xmas-frost-crystal`                                             | `#ffffff`                       | frost            |
| `--xmas-frost-opacity`                                             | `0.92`                          | frost            |
| `--xmas-frost-blur`                                                | `3px`                           | frost            |
| `--xmas-frost-grow-duration` / `--xmas-frost-melt-duration`        | `14s` / `0.8s`                  | frost            |
| `--xmas-frost-z-index`                                             | `2147483000`                    | frost            |
| `--xmas-santa-height` / `--xmas-santa-top`                         | `90%` / `5%`                    | santa            |
| `--xmas-santa-coat`, `--xmas-santa-fur`, `--xmas-santa-skin`       | `#d62828`, `#fff`, `#f6c9a8`    | santa            |
| `--xmas-santa-sled`, `--xmas-santa-trim`, `--xmas-santa-sack`      | `#b3121f`, `#f4c542`, `#9c6b3c` | santa            |
| `--xmas-santa-mitten`, `--xmas-santa-reins`                        | `#1f5f3a`, `#6b4220`            | santa            |
| `--xmas-reindeer`, `--xmas-reindeer-dark`, `--xmas-reindeer-belly` | `#8b5a2b`, `#5e3b1c`, `#e9d6bc` | santa            |
| `--xmas-antler`, `--xmas-rudolph-nose`                             | `#d8c29d`, `#ff2b2b`            | santa            |
| `--xmas-sparkle`                                                   | `#ffe8a3`                       | santa            |
| `--xmas-present-1` … `--xmas-present-5`, `--xmas-ribbon`           | assorted, `#ffffff`             | santa cargo      |
| `--xmas-present-size`                                              | `18px`                          | dropped presents |

## Testing your app

Override the clock and random source to make effects deterministic:

```ts
TestBed.configureTestingModule({
  providers: [
    provideXmas({ forceActive: true }),
    { provide: XMAS_CLOCK, useValue: () => new Date(2026, 11, 24) },
    { provide: XMAS_RANDOM, useValue: () => 0.5 },
  ],
});
```

## License

MIT
