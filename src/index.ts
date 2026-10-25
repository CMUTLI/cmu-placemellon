import { createApp } from "./app";
import { Catalog } from "./catalog";

const port = Number(process.env.PORT || 3000);
const catalog = new Catalog();

void catalog.start().then(() => console.log(`catalog: ${catalog.photos.length} photos`));
createApp(catalog).listen(port, () => console.log(`PlaceMellon on http://localhost:${port}`));
