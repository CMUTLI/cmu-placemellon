import express, { Request, Response } from "express";
import path from "path";
import { Catalog } from "./catalog";
import { avatarSvg, MAX, renderPhoto, renderSvg, scottySvg, StaleLinkError } from "./render";
import { PORTALS } from "./widen";

const OPTIONS = ["category", "random", "scotty", "profile", "gray", "grayscale"];

export interface Options {
  category?: string;
  random: boolean;
  scotty: boolean;
  profile: boolean;
  gray: boolean;
}

export class OptionError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Reads the query string; rejects unknown options and ones that don't go together.
export function parseOptions(query: Record<string, unknown>, w: number, h: number, gray = false): Options {
  const unknown = Object.keys(query).filter((k) => !OPTIONS.includes(k));
  if (unknown.length) throw new OptionError(400, `Unknown option ?${unknown[0]}. Options: ${OPTIONS.map((o) => "?" + o).join(", ")}.`);
  const category = query.category;
  if (category !== undefined && typeof category !== "string") throw new OptionError(400, "Give ?category once.");
  if (category !== undefined && !(category in PORTALS)) throw new OptionError(404, `No category "${category}". Try ${Object.keys(PORTALS).join(", ")}.`);
  const o: Options = {
    category,
    random: "random" in query,
    scotty: "scotty" in query,
    profile: "profile" in query,
    gray: gray || "gray" in query || "grayscale" in query,
  };
  if (o.scotty && o.profile) throw new OptionError(400, "Pick ?scotty or ?profile, not both.");
  if ((o.scotty || o.profile) && (o.category || o.random)) throw new OptionError(400, "?category and ?random choose photos, so they don't go with ?scotty or ?profile.");
  return o;
}

interface Rendered {
  type: string;
  body: Buffer;
  photo?: string;
}

// Rendered images, newest last; the oldest go first.
class Lru {
  private map = new Map<string, Rendered>();
  constructor(private max: number) {}
  get(k: string) {
    const v = this.map.get(k);
    if (v) { this.map.delete(k); this.map.set(k, v); }
    return v;
  }
  set(k: string, v: Rendered) {
    this.map.set(k, v);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value!);
  }
}

export function parseSize(s: string): number | null {
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= MAX ? n : null;
}

export function createApp(catalog: Catalog, get: typeof fetch = fetch) {
  const app = express();
  const cache = new Lru(Number(process.env.CACHE_ENTRIES || 256));

  // The information page lives elsewhere (GitHub Pages for now, maybe
  // cmu.edu later). With DOCS_URL="", as in npm run dev, it's served here.
  const docs = process.env.DOCS_URL ?? "https://cmutli.github.io/cmu-placemellon/";
  if (docs) app.get("/", (_req, res) => res.redirect(302, docs));
  else app.use(express.static(path.join(__dirname, "..", "docs"), { index: "index.html" }));

  app.get("/healthz", (_req, res) => {
    const categories = Object.fromEntries(Object.keys(PORTALS).map((c) => [c, catalog.count(c)]));
    res.status(catalog.photos.length ? 200 : 503).json({ photos: catalog.photos.length, categories, refreshedAt: catalog.refreshedAt });
  });

  // Random images skip the cache, ours and everyone else's.
  async function send(res: Response, key: string | null, make: () => Promise<Rendered>) {
    let out = key ? cache.get(key) : undefined;
    if (!out) {
      try {
        out = await make();
      } catch (e) {
        console.error(key ?? "random", (e as Error).message);
        res.status(502).type("text/plain").send("Couldn't get that image. Try again shortly.\n");
        return;
      }
      if (key) cache.set(key, out);
    }
    if (out.photo) res.set("X-Photo", out.photo);
    res.set("Cache-Control", key ? "public, max-age=86400" : "no-store").type(out.type).send(out.body);
  }

  const image = (gray: boolean) => (req: Request, res: Response) => {
    const w = parseSize(req.params.w), h = req.params.h === undefined ? w : parseSize(req.params.h);
    if (w === null || h === null) {
      res.status(400).type("text/plain").send(`Sizes must be whole numbers from 1 to ${MAX}.\n`);
      return;
    }
    let o: Options;
    try {
      o = parseOptions(req.query, w, h, gray);
    } catch (e) {
      if (!(e instanceof OptionError)) throw e;
      res.status(e.status).type("text/plain").send(e.message + "\n");
      return;
    }

    // Profile pictures are square: send /96/64?profile to /64?profile.
    if (o.profile && w !== h) {
      const qs = req.originalUrl.slice(req.originalUrl.indexOf("?"));
      res.redirect(302, `${gray ? "/g" : ""}/${Math.min(w, h)}${qs}`);
      return;
    }

    if (o.scotty || o.profile) {
      const svg = o.profile ? avatarSvg(w) : scottySvg(w, h);
      const key = `${o.profile ? "profile" : "scotty"} ${w}x${h}${o.gray ? " gray" : ""}`;
      void send(res, key, async () => ({ type: "png", body: await renderSvg(svg, o.gray) }));
      return;
    }

    if (!catalog.photos.length || (o.category && !catalog.count(o.category))) {
      res.status(503).type("text/plain").send("Photos are still loading. Try again shortly.\n");
      return;
    }
    const key = o.random ? null : `photo ${w}x${h} ${o.category ?? "all"}${o.gray ? " gray" : ""}`;
    void send(res, key, async () => {
      let p = catalog.pick(w, h, o.random, o.category)!;
      try {
        return { type: "jpeg", body: await renderPhoto(p, w, h, o.gray, get), photo: p.filename };
      } catch (e) {
        if (!(e instanceof StaleLinkError)) throw e;
        // Preview links expired early; re-list and try once more.
        await catalog.refresh();
        p = catalog.pick(w, h, o.random, o.category)!;
        return { type: "jpeg", body: await renderPhoto(p, w, h, o.gray, get), photo: p.filename };
      }
    });
  };

  // /g/ first, or /:w/:h would read /g/400 as a width of "g".
  app.get(["/g/:w", "/g/:w/:h"], image(true));
  app.get(["/:w", "/:w/:h"], image(false));

  return app;
}
