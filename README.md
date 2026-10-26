# PlaceMellon

Placeholder images of Carnegie Mellon, in the spirit of placekitten.
Give it a width and height, and it returns a CMU photo cropped to that size.
It also provides grayscale images, random photos, and Scotty images and
profile pictures.

Photos come from University Communications & Marketing's CMU Selects
collection. Use them for Carnegie Mellon work; see the
[photo source and usage information](https://cmutli.github.io/cmu-placemellon/about.html).

## Use it

Put a PlaceMellon URL in an image tag:

```html
<img src="https://placemellon.andrew.cmu.edu/400/300" alt="Placeholder photo of Carnegie Mellon" />
```

This returns a photo 400 pixels wide and 300 pixels tall. The same size gets
the same photo unless you select the random option or the photo collection
changes.

The [image builder](https://cmutli.github.io/cmu-placemellon/builder.html)
lets you choose a size and options, preview the image, and copy its URL or
HTML. The [options reference](https://cmutli.github.io/cmu-placemellon/options.html)
covers categories, random photos, grayscale, and Scotty.

## Support

Report problems or suggest changes in
[GitHub issues](https://github.com/CMUTLI/cmu-placemellon/issues).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for issues, pull requests, commit
messages, and style conventions.

See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup, the devcontainer,
tests, compilation, and how the service works. See
[DEPLOYMENT.md](DEPLOYMENT.md) for running the container, configuration,
and health checks.

## License

The code is copyright Carnegie Mellon University and licensed under the
[BSD 3-Clause License](LICENSE). That license does not cover CMU's names
and marks, including the Scotty artwork, or the CMU Selects photos.

The [Bunsen Honeydew photo](docs/images/bunsen-honeydew.jpg) is by
[MuppetsStudio](https://commons.wikimedia.org/wiki/File:Dr._Bunsen_Honeydew.png),
licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/),
and cropped for the documentation site.
