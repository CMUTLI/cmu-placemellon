# Deployment

This guide covers building, configuring, and running the PlaceMellon
container. The application needs outbound HTTPS access to CMU Selects and
its image CDN. It has no database, API keys, or persistent application data.

## Build the image

From the repository root, using Podman:

```bash
podman build --format docker -t localhost/placemellon:latest .
```

Or Docker:

```bash
docker build -t placemellon:latest .
```

The Dockerfile compiles TypeScript in a build stage. The production image
contains the compiled server, production dependencies, Scotty assets, and
documentation. It runs as the non-root `node` user. The Node base image is
pinned by digest, and npm is pinned to 12.2.1 in the shared base stage.
Update these pins deliberately when updating the tooling.

Podman's `--format docker` preserves the Dockerfile's `HEALTHCHECK`.
If building an OCI image instead, configure the health check in the runtime
or service definition; for a Quadlet, use `HealthCmd=`.

## Run the container

```bash
podman run -d --name placemellon \
  -p 127.0.0.1:3000:3000 \
  localhost/placemellon:latest
```

With Docker, use `docker run` and the `placemellon:latest` image name.
The binding exposes the service only on the host's loopback interface.
A reverse proxy on that host can forward public requests to it. To use a
different host port, change the first port number, for example
`-p 127.0.0.1:3001:3000`.

The default `/` response redirects to the documentation on GitHub Pages.
To serve the documentation bundled in the image, add `-e DOCS_URL=""` before
the image name. Image URLs and `/healthz` are served by the application in
either mode.

No volume is required. Restarting the container clears the image cache and
reloads the catalog from CMU Selects. Startup does not wait for that reload;
photo requests return 503 until the catalog is ready, while the
documentation (when served locally) and Scotty images remain available.

## Configuration

Pass environment variables with `-e NAME=value` or `--env-file PATH`.
These are all of the application's configuration variables:

| Variable        | Default                                     | Purpose                                                                                 |
| --------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `PORT`          | `3000`                                      | Port the application listens on inside the container                                    |
| `DOCS_URL`      | `https://cmutli.github.io/cmu-placemellon/` | Destination for the `/` redirect; set to an empty string to serve bundled documentation |
| `REFRESH_HOURS` | `6`                                         | Interval between catalog refreshes; preview-link expiry can trigger an earlier refresh  |
| `CACHE_ENTRIES` | `256`                                       | Maximum number of rendered images cached in memory; `0` disables storage in this cache  |

The production image also sets `NODE_ENV=production` for Express.
Use a valid TCP port and a positive number of refresh hours. If changing
`PORT`, update the container-side port in the published-port mapping too.

## Health checks

```bash
curl --fail --show-error http://127.0.0.1:3000/healthz
```

The response includes the photo count, counts by category, and the last
successful refresh time. Status is 200 when the catalog contains photos
and 503 when it is empty. This measures catalog availability; it does not
fetch a photo or verify that every category has photos.

The image's health check uses Node to request `/healthz` every 30 seconds,
with a five-second timeout and a 60-second startup grace period. It reads
`PORT`, so it follows changes to the application's listening port.

Run the check manually:

```bash
podman healthcheck run placemellon
```

A nonempty catalog can still contain expired preview links if CMU Selects
is unavailable. When investigating photo failures, check the refresh time,
logs, and an actual image response as well as `/healthz`.

## Logs and shutdown

```bash
podman logs --tail 100 placemellon
podman logs --follow placemellon
podman stop placemellon
```

Use the equivalent `docker` commands when running with Docker. The
application logs catalog refresh results and image-rendering errors to
standard output and standard error, which the container runtime captures.
