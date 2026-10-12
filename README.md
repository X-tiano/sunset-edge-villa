# Sunset Edge Villa

The events website for Sunset Edge Villa, a private estate in Mgarr, Malta, managed by Christiano Property Management.

## What is here

- `index.html` holds the whole page: hero, estate, spaces, ideas, packages, technical specifications, the interactive 3D floor plans, how it works, location and the enquiry form.
- `runtime.js` is a small script (no dependencies) that renders the page and runs the floor plan model, room markers, bedroom cards and the quiet and social areas.
- `ideas/` holds one landing page per idea (offsites, wellness, celebrations, shoots, chef dinners, creative retreats). Their "Request a viewing" buttons open the home page form with the event type already chosen.
- `site.js` sends the viewing-request form and adds the WhatsApp button.
- `images/` holds the photographs (WebP, loaded as visitors scroll) and the three floor plan layers. `og.jpg` is the link-preview image.
- `favicon.svg` and `apple-touch-icon.png` are the browser and home-screen icons.

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

- The enquiry form posts to `api/enquiry.js`, a Vercel function that emails each request to info@christianopropertymanagement.com through Resend, with reply-to set to the enquirer. It needs `RESEND_API_KEY` in the Vercel project's environment variables. Until that is set, the form shows visitors the WhatsApp and email fallback.
- The link-preview image and page URL point at the Vercel address. Update `SITE` in the build if a custom domain is added.
- Items marked TBC in the technical specifications are still being confirmed.
- Fonts load from Google Fonts (Cormorant Garamond and DM Sans).
