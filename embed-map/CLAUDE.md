# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The embeddable RedSuburbs crime map: a static Leaflet page. On production it is served at `/embed-map/` and embedded in an iframe on redsuburbs.com.au. There is no build system, package manager, linter or test suite: plain ES classes loaded by `<script>` tags, plus vendored libraries in `vendor/` (Leaflet 1.9.4, tinycolor, normalize).

## Commands

- `./server.sh`: serve the repo root on http://localhost:3000 (`python3 -m http.server 3000`). Data is fetched from absolute `/data/...` paths, so the page has to be served from the repo root.
- `python3 tools/combine-css.py` (run from the repo root): inlines the `@import`s in `css/_all.css` into `css/_combined.css`. `index.html` currently loads `_all.css`, and the `_combined.css` link is commented out.
- `tools/combine-js.py` is a leftover from another project (it points at `src/scripts/`, which doesn't exist here) and does nothing useful.

## Data

`data/` is gitignored. `data/groups` and `data/lga-groups` are symlinks to `../../crime-map-exporter/result/...`, the output of the sibling Python exporter project. Each holds an `index.json` that maps group ID → bbox `[minLng, minLat, maxLng, maxLat]`, plus one `<id>.json` GeoJSON file per group. `data/states.geo.json` is a plain file. Each feature's `properties` includes `type` (`suburb`/`lga`/`state`), `name`, `key`, `population`, `crime` (a map of crime type → count, plus `total`), `crime_rank`, `violent_rank` and `property_rank`. Ranks run 0–100, except states, which run 0–6.

## Architecture

The scripts in `index.html` share globals, so their load order matters: `Util` → inline `PRO_URL` → `RRAccount` (also defines `PROPERTY_CRIME_TYPES`, `VIOLENT_CRIME_TYPES`, and the `rrAccount` singleton) → `MapLegend`, `LayerSwitch`, `MapView`, `QuickView` → `main.js`.

- **`js/main.js`**: an async IIFE that holds all the app state and data loading. It reads `lat`/`lng`/`zoom`/`layer`/`lens`/`suburb` from the URL. Premium users without a position in the URL get their saved start location from the PRO API. On each `moveend`/`zoomend` (debounced 500ms), it lazily fetches only the suburb or LGA groups whose bbox intersects the viewport and whose zoom range matches (suburbs at zoom ≥10, LGAs at 6–9, states always). It then rewrites the URL with `history.pushState` and posts a `map-url-change` message to `window.parent`.
- **Layer visibility is done with CSS, not Leaflet.** Every rendered layer stays on the map, and each path gets the class `rr__map-layer--{states|lgas|suburbs}`. `showMapLayer()` rewrites the `<style id="dynamic-css">` element so that only the active class is shown (`css/elements/map-view.css` hides `.rr__map-layer` by default).
- **`MapView`**: the Leaflet map, styling (red fill intensity from the rank of the active lens), hover/click handlers. Clicking a feature opens its profile at `{redsuburbs.com.au}/{suburbs|lgas|states}/{key}` in `_top`. On mobile widths, the first tap highlights the feature and the second tap opens the profile.
- **`LayerSwitch`**: changing the layer or lens sets `window.location.search`, which reloads the whole page. Lens and layer are fixed for the lifetime of the page.
- **`QuickView`**: fills in the hover panel, whose markup is already in `index.html`.
- **`RRAccount`** (`js/classes/RRAccount.js`): auth via JWT stored in `localStorage` against the WordPress PRO API (`PRO_URL + '/wp-json'`). Non-premium users who pick a lens other than `cr` get `requestUpgrade()`. This file used to be a symlink to `redsuburbs-blog/src/scripts/legacy-account.js` and is now a copy, so changes may need to be synced with the blog project.

## Conventions

- **Dev vs prod**: `Util.isDev` is true whenever the URL doesn't contain `redsuburbs.com.au`. It switches `PRO_URL` (dev: `http://192.168.1.7:8081`), the profile base URL (`http://redsuburbs.com.au.local`) and the URL base path (`/` vs `/embed-map/`).
- **Cache busting**: script tags in `index.html` carry `?v=X.Y.Z`. When you ship JS changes, bump the version on all of them together.
- **CSS**: BEM-style class names (`Block__element--modifier`), one file per UI element under `css/elements/`. New files must be registered in `css/_all.css`.
- **Data source credits**: the publisher list in the legend (`index.html`, `.Legend__sources`) is hand-copied from `getDataSources()` in the blog theme's `includes/data-sources.php`. Keep the two in sync, and update the data year in the legend text when the theme's `AC_DATA_YEAR` changes.
