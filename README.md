# RC Construction website

Static website for RC Construction (Oshawa, Durham Region). No framework and no dependencies: `build.js` turns the content into plain HTML in `site/`.

- 19 pages: home, 4 service pages, projects, reviews, service areas, Oshawa, about, process, 3 homeowner guides, contact, photo credits, 404
- SEO: unique titles and descriptions, canonical URLs, Open Graph, `sitemap.xml`
- Structured data (JSON-LD): GeneralContractor, WebSite, BreadcrumbList, Service, FAQPage, Article
- AEO/GEO: short answers at the top of guides, FAQ sections, a facts block on About, `llms.txt`, and `robots.txt` that welcomes AI search crawlers
- Phone-first: sticky Call / Text / Estimate bar, 48px+ tap targets

## Edit and preview

1. Business facts (phone, towns, review counts, form key): `config.js`
2. Page text, projects and FAQs: `build.js`
3. Styles: `assets/css/site.css`

```bash
node build.js
npx serve site
```

## Before launch: confirm with Sam

- [ ] Towns served (`areas` in `config.js`)
- [ ] Warranty terms (the site only says a warranty is offered)
- [ ] Review counts still match Google and HomeStars
- [ ] Replace stock photos with real project photos (`assets/img/`, same file names, 800 and 1600 px wide WebP)
- [ ] Form key: sign up free at https://web3forms.com with RC's email, then set `WEB3FORMS_KEY` in Cloudflare (Settings > Variables) or paste it into `config.js`. Until then the form asks people to call or text.
- [ ] Domain: when a custom domain is connected, set `SITE_URL` in Cloudflare to it (for example `https://rcconstruction.ca`)

## Deploy free on Cloudflare Pages

Option A, connected to GitHub (rebuilds on every push):

1. Push this folder to a GitHub repository.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git, and pick the repository.
3. Build command: `node build.js`. Build output directory: `site`.
4. Optional environment variables: `SITE_URL`, `WEB3FORMS_KEY`.

Option B, direct upload from this computer:

```bash
node build.js
npx wrangler pages deploy site --project-name rc-construction
```

## After launch

- Add the site to Google Search Console and submit `/sitemap.xml`
- Add the website link to the Google Business Profile and HomeStars profile
- Add Facebook or Instagram links to `sameAs` in `config.js` when known

Photos: illustrative images from Unsplash (free licence), credited on `/photo-credits/`. They must never be presented as RC's own work.
