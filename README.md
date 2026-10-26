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

`/` redirects (302) to the information page, `DOCS_URL` (default
https://cmutli.github.io/cmu-placemellon/, published from `docs/`). With
`DOCS_URL=` (empty), as in `npm run dev`, the server serves `docs/` itself,
and the page's examples load from that server.

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

### Containers

Build and run with Podman (the same Dockerfile also works with Docker):

    podman build -t placemellon .
    podman run --rm -p 3000:3000 placemellon

The production image runs as the non-root `node` user and includes the
Scotty assets and documentation. It uses the normal `DOCS_URL` redirect;
add `-e DOCS_URL=` to serve the bundled documentation instead.

### Devcontainer

With Docker, open this folder in VS Code and run
**Dev Containers: Reopen in Container**.
Run `npm run dev` in the container terminal; port 3000 is forwarded and
the documentation is served locally. The usual test and build commands
work in that terminal too.

The devcontainer uses the Dockerfile's `development` target, with Git and
curl installed. Dependencies live in a separate named volume, refreshed
with `npm ci` when the container is created.

For rootless Podman, set `"dev.containers.dockerPath": "podman"` in
VS Code's user settings and add these properties to
`.devcontainer/devcontainer.json` before reopening:

```json
"updateRemoteUserUID": false,
"runArgs": [
  "--userns=keep-id:uid=1000,gid=1000",
  "--security-opt=label=disable"
]
```

Replace the existing `updateRemoteUserUID` property. The user namespace
maps your host user to the container's `node` user (UID/GID 1000), preserving
host ownership when editing the checkout. Disabling SELinux container
labels allows access to the mounted checkout. These arguments are for
Podman; Docker does not support `--userns=keep-id`.

## License

The code is under the BSD 3-Clause License (see `LICENSE`), copyright
Carnegie Mellon University. It doesn't cover:

* **Carnegie Mellon's names and marks**, including the Scotty images in
  `assets/scotty-*.svg` (traced from the Office of Human Resources' Scotty
  avatar). The license grants no rights to them, and its third clause
  bars using the university's name to endorse or promote work derived from
  this code.
* **The photos.** They aren't in this repository; the service fetches them
  from University Communications & Marketing's CMU Selects, under its terms.
* **`docs/images/bunsen-honeydew.jpg`**, by MuppetsStudio, under
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), cropped.
