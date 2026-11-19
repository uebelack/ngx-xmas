# ng-christmas

pnpm workspace with the [`ngx-xmas`](projects/ngx-xmas/README.md) Angular library and a demo app.

| Path                | What                                        |
| ------------------- | ------------------------------------------- |
| `projects/ngx-xmas` | The publishable library                     |
| `projects/demo`     | Demo app consuming the library's public API |

## Scripts

| Command             | Does                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `pnpm start`        | Builds the library, then serves the demo at http://localhost:4200 |
| `pnpm build`        | Builds the library (partial compilation) and the demo             |
| `pnpm test`         | Runs the library's Vitest suite once                              |
| `pnpm lint`         | oxlint                                                            |
| `pnpm format`       | oxfmt (write)                                                     |
| `pnpm format:check` | oxfmt (check only)                                                |
| `pnpm watch`        | Rebuilds the library on change (pair with `ng serve demo`)        |

The demo resolves `ngx-xmas` from `dist/ngx-xmas`, so the library is built before serving.

## Publishing

```sh
pnpm build:lib
cd dist/ngx-xmas && pnpm publish
```
