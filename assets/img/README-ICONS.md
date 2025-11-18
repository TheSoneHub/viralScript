# ViralScript Icon Notes

This folder contains vector logo SVGs. To use PNG favicons (recommended for broader compatibility), generate PNGs from the SVG using ImageMagick or another raster tool.

Recommended sizes:
- 512x512 -> `assets/img/viral_icon-512.png`
- 192x192 -> `assets/img/viral_icon-192.png`
- 128x128 -> `assets/img/viral_icon-128.png`

ImageMagick commands (PowerShell):

```powershell
# From repo root
magick convert assets/img/viral_icon.svg -resize 512x512 assets/img/viral_icon-512.png
magick convert assets/img/viral_icon.svg -resize 192x192 assets/img/viral_icon-192.png
magick convert assets/img/viral_icon.svg -resize 128x128 assets/img/viral_icon-128.png
```

If you don't have ImageMagick, you can use any online SVG->PNG exporter or a vector editor (Illustrator, Figma, Inkscape).

After creating PNG files, the `index.html` already includes links to these PNG paths. If you want me to generate placeholder PNGs in the repo, I can add simple PNGs encoded in base64, but it's better to produce crisp raster exports locally so they match your branding.