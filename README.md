# PlaceMellon

Placeholder images of Carnegie Mellon, in the spirit of placekitten.

    /{width}/{height}     a CMU photo, cropped to fit (JPEG)
    /{size}               the same, square

Options go in the query string, in any order:

| Option | What |
| --- | --- |
| `?category=NAME` | Only photos from `campus`, `classrooms`, `labs` or `life` |
| `?random` | A different photo each time, never cached. `?random=1`, `?random=2`... keep several on one page from being the same |
| `?scotty` | Scotty on a light gradient instead of a photo (PNG) |
| `?profile` | Scotty as a round profile picture, transparent corners (PNG; always square, so `/96/64?profile` redirects to `/64?profile`) |
| `?gray` | Grayscale; also `?grayscale`, or `/g/` in front, as on placekitten |

For example `/400/300?category=labs&gray`, `/600/200?scotty`, `/96?profile`.
Unknown options and ones that don't go together (`?scotty&category=labs`)
get a 400 that says why. `/healthz` gives photo counts and the last refresh.

Sizes run from 1 to 2048. Wide sizes get landscape photos and tall sizes
portrait ones; near-square sizes draw from all of them. The same size (and
category) always gets the same photo (rendezvous hashing, so photos coming
and going only move the sizes they won). The `X-Photo` header names the
photo.

## How it works

Photos come from UCM's "CMU Selects" Widen portals and pass through: the
server keeps only the photo list in memory, re-listing every
`REFRESH_HOURS` (default 6) and before Widen's signed preview links expire.
Each request fetches the smallest preview that covers the size, crops it
(attention-weighted) and returns it. Recent results are cached in memory
(`CACHE_ENTRIES`, default 256). Nothing is written to disk.

The portal endpoints are Widen's own, not a documented API, so they may change.

Scotty (`assets/scotty-*.svg`) is traced from CMU Human Resources' Scotty
avatar, https://www.cmu.edu/hr/images/scotty.png.

## Develop

    npm install
    npm run dev          # http://localhost:3000 (PORT to change)
    npm test
    npm run typecheck
    npm run build && npm start
