# Sunset Edge Villa

The events website for Sunset Edge Villa, a private estate in Mgarr, Malta, managed by Christiano Property Management.

## What is here

- `index.html` holds the whole page: hero, estate, spaces, ideas, packages, technical specifications, the interactive 3D floor plans, how it works, location and the enquiry form.
- `runtime.js` is a small script (no dependencies) that renders the page and runs the floor plan model, room markers, bedroom cards and the quiet and social areas.
- `images/` holds the photographs and the three floor plan layers, already sized for the web.

There is no build step. Any static host serves it as it is.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish

- **Vercel:** import this repository, choose "Other" as the framework, leave the build command empty.
- **GitHub Pages:** Settings, then Pages, then deploy from the `main` branch, root folder.

## Before going live

- The enquiry form is not connected yet. Point it at your form handler or booking system.
- Items marked TBC in the technical specifications are still being confirmed.
- Fonts load from Google Fonts (Cormorant Garamond and DM Sans).
