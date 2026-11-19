# ngx-xmas

Two Christmas easter eggs for Angular apps: a Santa hat on your logo and Santa's sled
flying through your navigation bar now and then.

Both are visible **only in December** (local time) and render nothing otherwise. Each one is a
single self-contained standalone component without dependencies, so you can install the
package or just copy the file into your project:

- [`src/lib/xmas-logo.ts`](src/lib/xmas-logo.ts)
- [`src/lib/xmas-santa.ts`](src/lib/xmas-santa.ts)

## `<xmas-logo>`

A Santa hat positioned absolutely inside its nearest positioned ancestor.

```html
<a class="logo" style="position: relative">
  <img src="logo.svg" alt="ACME" />
  <xmas-logo top="-17px" left="-11px" width="36px" rotate="-22deg" />
</a>
```

| Input    | Default  |
| -------- | -------- |
| `top`    | `-18px`  |
| `left`   | `-12px`  |
| `width`  | `40px`   |
| `rotate` | `-20deg` |

## `<xmas-santa>`

Santa's sled with three reindeer (Rudolph in front) crossing the host now and then. It fills and
clips to its nearest positioned ancestor, e.g. a nav bar.

```html
<nav style="position: relative">
  <xmas-santa [minInterval]="120000" [maxInterval]="600000" />
</nav>
```

| Input         | Default  | Description                                     |
| ------------- | -------- | ----------------------------------------------- |
| `minInterval` | `90000`  | Shortest pause (ms) before and between flights. |
| `maxInterval` | `300000` | Longest pause (ms) before and between flights.  |
| `duration`    | `9000`   | How long (ms) one crossing takes.               |

`fly()` starts a flight immediately. Santa stays grounded when `prefers-reduced-motion` is set.

Both components render nothing on the server and never block clicks.
