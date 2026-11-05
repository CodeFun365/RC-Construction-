// Builds the RC Construction website into ./site (static HTML, no dependencies).
// Run: node build.js   (Cloudflare Pages: build command "node build.js", output directory "site")
//
// Content rules this file follows (from the website research brief):
// - Only facts verified from RC's public profiles; anything unconfirmed lives in config.js marked CONFIRM.
// - No "free estimate", "licensed and insured", "award-winning" or years-in-business claims.
// - Stock photos are illustrative only and never shown as RC's own projects (see /photo-credits/).
// - No thin city pages: only Oshawa gets a location page until real projects exist elsewhere.
// - Customer reviews are summarised in our own words with links to the full reviews.

const fs = require('fs');
const path = require('path');
const C = require('./config');

const OUT = path.join(__dirname, 'site');
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' }); // YYYY-MM-DD, Oshawa time
const URL = C.siteUrl.replace(/\/$/, '');
const abs = (p) => URL + p;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const tel = `tel:${C.phone}`;
const sms = `sms:${C.phone}`;

// ---------------------------------------------------------------------------
// Images (Unsplash, free licence; illustrative only). `unsplash` is the photo id on images.unsplash.com.
// ---------------------------------------------------------------------------
const IMG = {
  hero: { file: 'hero-basement-lounge', alt: 'Warm finished basement lounge with built-in bookshelves, wood floors and soft lighting', unsplash: '1765959617888-30837a158667' },
  recRoom: { file: 'basement-rec-room', alt: 'Finished basement games room with a pool table, wood ceiling and window light', unsplash: '1759173084016-08b0fffd377c' },
  suite: { file: 'basement-suite-living', alt: 'Bright, modern living room with neutral finishes, suited to a basement rental unit', unsplash: '1772563156886-9fcfb121e500' },
  basementStairs: { file: 'basement-finished-stairs', alt: 'Newly finished basement with vinyl plank floors, pot lights and an open staircase', unsplash: '1646592491741-e79ae5953486' },
  basementOpen: { file: 'basement-finished-open', alt: 'Open finished basement with bright white walls, pot lights and wood-look flooring', unsplash: '1646592474103-cfd22d1d9e34' },
  shower: { file: 'bathroom-walk-in-shower', alt: 'Modern bathroom with a glass walk-in shower, tiled walls and a long vanity', unsplash: '1584622650111-993a426fbf0a' },
  tub: { file: 'bathroom-tub-shower', alt: 'Bright bathroom with a freestanding tub, marble-look tile and walk-in shower', unsplash: '1638799869566-b17fa794c4de' },
  vanity: { file: 'bathroom-vanity', alt: 'Bathroom with a wood vanity, blue mosaic feature tile and modern fixtures', unsplash: '1782805153002-96e099970a9d' },
  kitchen: { file: 'kitchen-renovation', alt: 'Renovated kitchen with white shaker cabinets, a dark island and quartz counters', unsplash: '1565183928294-7063f23ce0f8' },
  stairs: { file: 'wood-stairs', alt: 'Modern hardwood staircase with clean white risers', unsplash: '1591638212063-c2f69701a931' },
  saw: { file: 'craft-mitre-saw', alt: 'Carpenter cutting trim on a mitre saw inside a home under renovation', unsplash: '1505798577917-a65157d3320a' },
  measure: { file: 'craft-measure', alt: 'Close-up of a carpenter marking a wood board with a pencil', unsplash: '1659930087003-2d64e33181f7' },
  tile: { file: 'tile-install', alt: 'Installer setting a white wall tile with spacers', unsplash: '1523413307857-ef24c53571ae' },
  home: { file: 'durham-home', alt: 'Two-storey family home with a two-car garage and a green lawn in a quiet suburb', unsplash: '1752119607845-ade31340d49e' },
};

function img(key, { sizes = '(min-width: 1000px) 50vw, 100vw', eager = false, cls = '' } = {}) {
  const i = IMG[key];
  return `<img src="/assets/img/${i.file}-800.webp" srcset="/assets/img/${i.file}-800.webp 800w, /assets/img/${i.file}-1600.webp 1600w" sizes="${sizes}" width="1600" height="1067" alt="${esc(i.alt)}"${eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"'}${cls ? ` class="${cls}"` : ''}>`;
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------
const SERVICES = [
  { slug: 'basement-renovations', name: 'Basement Renovations', short: 'Finished basements, rec rooms, offices and bedrooms, built to feel like the rest of your home.', img: 'basementStairs' },
  { slug: 'basement-rental-units', name: 'Basement Rental Units', short: 'Planning a basement apartment the right way, from layout to the City of Oshawa permit.', img: 'suite' },
  { slug: 'bathroom-renovations', name: 'Bathroom Renovations', short: 'Full bathroom remodels: tile, showers, tubs, vanities, lighting and plumbing, done in one go.', img: 'shower' },
  { slug: 'home-renovations', name: 'Home Renovations', short: 'Kitchens, flooring, stairs, trim, wainscoting and paint, for one room or the whole house.', img: 'kitchen' },
];

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/services/', label: 'Services', sub: SERVICES.map((s) => ({ href: `/services/${s.slug}/`, label: s.name })) },
  { href: '/projects/', label: 'Our Projects' },
  { href: '/service-areas/', label: 'Service Areas' },
  { href: '/about/', label: 'About Us', sub: [{ href: '/about/', label: 'About RC Construction' }, { href: '/our-process/', label: 'Our Process' }, { href: '/reviews/', label: 'Reviews' }, { href: '/resources/', label: 'Homeowner Guides' }] },
  { href: '/contact/', label: 'Contact' },
];

const brandMark = `<img class="brand-mark" src="/assets/logo.svg" width="56" height="56" alt="">`;
const brand = `<a class="brand" href="/" aria-label="${esc(C.name)} home">${brandMark}<span class="brand-name">${esc(C.name)}<small>Your Home Renovation Experts</small></span></a>`;

function nav(current) {
  const item = (n) => {
    const active = current === n.href || (n.sub || []).some((s) => s.href === current);
    const link = `<a href="${n.href}"${active ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`;
    if (!n.sub) return `<li>${link}</li>`;
    return `<li class="has-sub">${link}<ul class="sub-nav">${n.sub.map((s) => `<li><a href="${s.href}"${current === s.href ? ' aria-current="page"' : ''}>${esc(s.label)}</a></li>`).join('')}</ul></li>`;
  };
  return `<header class="site-header">
  <div class="wrap nav-bar">
    ${brand}
    <nav class="primary-nav" aria-label="Main"><ul>${NAV.map(item).join('')}</ul></nav>
    <div class="nav-cta"><a class="nav-phone" href="${tel}">${esc(C.phoneDisplay)}</a><a class="btn btn-primary" href="/get-an-estimate/">Get an Estimate</a></div>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-label="Open menu"><span></span></button>
  </div>
</header>`;
}

const footer = () => `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        ${brand}
        <p style="margin-top:18px">Basement, Bathroom, Kitchen and Home renovations across ${esc(C.region)} and Toronto.</p>
        <p><a href="${tel}">${esc(C.phoneDisplay)}</a> · call or text</p>
      </div>
      <div><h2>Services</h2><ul>${SERVICES.map((s) => `<li><a href="/services/${s.slug}/">${s.name}</a></li>`).join('')}</ul></div>
      <div><h2>Company</h2><ul><li><a href="/about/">About Us</a></li><li><a href="/our-process/">Our Process</a></li><li><a href="/projects/">Our Projects</a></li><li><a href="/reviews/">Reviews</a></li><li><a href="/contact/">Contact</a></li></ul></div>
      <div><h2>Homeowner guides</h2><ul>${GUIDES.map((g) => `<li><a href="/resources/${g.slug}/">${g.short}</a></li>`).join('')}<li><a href="/service-areas/">Service areas</a></li></ul></div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} ${esc(C.name)}. Serving ${esc(C.areas.join(', '))}.</span>
      <span>Photos are illustrative until our project photos are added. <a href="/photo-credits/">Photo credits</a></span>
    </div>
  </div>
</footer>
<nav class="mobile-bar" aria-label="Quick contact"><a href="${tel}">Call</a><a href="${sms}">Text</a><a class="go" href="/get-an-estimate/">Get an estimate</a></nav>`;

const cta = (title = 'Ready to talk about your renovation?', text = `Tell us what you have in mind. We'll talk it through, look at the space and give you a clear quote before any work starts.`) => `<section class="section"><div class="wrap"><div class="cta-band">
  <div><h2>${title}</h2><p>${text}</p></div>
  <div class="cta-actions"><a class="btn btn-primary" href="/get-an-estimate/">Get an Estimate</a><a class="btn btn-light" href="${tel}">Call ${esc(C.phoneDisplay)}</a></div>
</div></div></section>`;

const faqBlock = (items, heading = 'Questions homeowners ask') => `<div class="faq"><h2>${heading}</h2>${items.map((f) => `<details><summary>${esc(f.q)}</summary><div>${f.a}</div></details>`).join('')}</div>`;

const crumbsHtml = (crumbs) => `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => (i < crumbs.length - 1 ? `<a href="${c.url}">${esc(c.name)}</a><span aria-hidden="true">/</span>` : `<span aria-current="page">${esc(c.name)}</span>`)).join('')}</nav>`;

function pageHero({ crumbs, eyebrow, h1, lead, image, actions = true }) {
  return `<section class="page-hero${image ? '' : ' plain'}">${image ? img(image, { sizes: '100vw', eager: true }) : ''}
  <div class="wrap">${crumbsHtml(crumbs)}${eyebrow ? `<span class="eyebrow" style="color:#e9cfaf">${esc(eyebrow)}</span>` : ''}<h1>${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}
  ${actions ? `<div class="hero-actions"><a class="btn btn-primary" href="/get-an-estimate/">Get an Estimate</a><a class="btn btn-light" href="${tel}">Call ${esc(C.phoneDisplay)}</a></div>` : ''}</div></section>`;
}

const sideCard = (title = 'Talk to RC Construction') => `<div class="side-card"><h2>${title}</h2><p>Call or text Sam's team, or send a few details and photos of the space. We'll get back to you quickly.</p>
  <a class="btn btn-primary" href="/get-an-estimate/">Get an Estimate</a><a class="btn btn-light" href="${tel}">Call ${esc(C.phoneDisplay)}</a><a class="btn btn-light" href="${sms}">Text us</a></div>`;

// Real projects, summarised in our own words from RC's public HomeStars reviews (no customer names).
const PROJECTS = [
  { cat: 'Basements', year: 2023, title: 'Walkout basement with a two-bedroom rental unit, plus a whole-home refresh', scope: ['Three-bedroom walkout basement: one bedroom for the owners and a two-bedroom rental unit', 'Demolition, supplies and garbage removal coordinated from start to finish', 'Oak stairs rebuilt as modern open stairs with metal pickets', 'New kitchen with a quartz waterfall island; carpet replaced with hardwood; new tile', 'Wainscoting, waffle ceilings, new baseboards and trim, and the whole house painted', 'Electricians and plumbers coordinated for pot lights, chandeliers and appliances'], services: ['basement-rental-units', 'basement-renovations', 'home-renovations'] },
  { cat: 'Basements', year: 2024, title: 'Basement restoration: drywall, floors and baseboards', scope: ['New drywall, flooring and baseboards after damage', 'Unexpected issues found and fixed along the way', 'Finished on schedule, with updates throughout'], services: ['basement-renovations'] },
  { cat: 'Basements', year: 2024, title: 'Basement finished from the studs', scope: ['Complete basement finishing', 'Customer describes very good work from start to end'], services: ['basement-renovations'] },
  { cat: 'Kitchens & floors', year: 2024, title: 'New kitchen tile and hardwood flooring', scope: ['Kitchen tile and new hardwood floors', 'Supplier recommendations for tile and flooring', 'Completed on the timeline given at the start'], services: ['home-renovations'] },
  { cat: 'Basements', year: 2022, title: 'Basement finishing: trim, doors and paint', scope: ['Trim, baseboards and interior doors installed', 'Walls and ceiling primed and painted', 'Basement now matches the main floor'], services: ['basement-renovations'] },
  { cat: 'Kitchens & floors', year: 2022, title: 'Fireplace removal and new flooring', scope: ['Old fireplace removed', 'New flooring installed quickly and cleanly'], services: ['home-renovations'] },
  { cat: 'Bathrooms', year: 2020, title: 'Complete master bathroom renovation', scope: ['Full master bath remodel', 'Clear quote given up front'], services: ['bathroom-renovations'] },
  { cat: 'Bathrooms', year: 2019, title: 'Washroom gutted and rebuilt', scope: ['Washroom fully gutted', 'Rebuilt with new tile and fixtures'], services: ['bathroom-renovations'] },
  { cat: 'Whole-home & more', year: 2019, title: 'Open-concept main floor renovation', scope: ['Main floor opened up into an open-concept layout', 'Handled start to finish by Sam and the crew'], services: ['home-renovations'] },
  { cat: 'Whole-home & more', year: 2019, title: 'Custom doors, baseboards and trim for a full second floor', scope: ['Custom interior doors', 'Baseboards and door and window trim through the whole second floor'], services: ['home-renovations'] },
  { cat: 'Whole-home & more', year: 2020, title: 'New deck for a returning customer', scope: ['Deck built for a homeowner who had RC frame their basement earlier'], services: ['home-renovations'] },
  { cat: 'Basements', year: 2018, title: 'Basement and new side-entry door', scope: ['Basement finished', 'New side-entry door added'], services: ['basement-renovations'] },
];

const projectCard = (p) => `<article class="project"><span class="meta">${esc(p.cat)} · ${p.year}</span><h3>${esc(p.title)}</h3><ul>${p.scope.map((s) => `<li>${esc(s)}</li>`).join('')}</ul><p class="note">Summarised from a <a href="${C.homestars.url}">HomeStars review</a>. Project photos coming soon.</p></article>`;

const GUIDES = [
  { slug: 'basement-permits-oshawa', short: 'Basement permits in Oshawa', title: 'Do You Need a Permit to Finish a Basement in Oshawa?', img: 'basementOpen' },
  { slug: 'basement-renovation-cost-factors', short: 'What drives basement costs', title: 'What Affects the Cost of a Basement Renovation in Oshawa?', img: 'measure' },
  { slug: 'basement-finishing-vs-rental-unit', short: 'Finishing vs a rental unit', title: 'Basement Finishing vs a Basement Rental Unit: What’s Different?', img: 'suite' },
];

const OSHAWA_BASEMENTS = 'https://www.oshawa.ca/living-here/building-and-renovating/basement-renovations/';
const OSHAWA_APARTMENTS = 'https://www.oshawa.ca/living-here/building-and-renovating/accessory-apartments/';

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------
const BUSINESS_ID = `${URL}/#business`;
const business = {
  '@type': 'GeneralContractor',
  '@id': BUSINESS_ID,
  name: C.name,
  url: `${URL}/`,
  telephone: C.phone,
  image: abs(`/assets/img/${IMG.hero.file}-1600.webp`),
  logo: abs('/assets/logo-512.png'),
  description: `${C.name} is a renovation contractor based in ${C.city}, Ontario, doing basement renovations, basement rental units, bathroom renovations and home renovations across ${C.region}.`,
  address: { '@type': 'PostalAddress', addressLocality: C.city, addressRegion: C.province, addressCountry: 'CA' },
  areaServed: C.areas.map((a) => ({ '@type': 'City', name: `${a}, Ontario` })),
  knowsAbout: ['Basement renovation', 'Basement finishing', 'Basement apartments', 'Bathroom renovation', 'Kitchen renovation', 'Hardwood flooring', 'Tile installation', 'Stair renovation', 'Trim and wainscoting'],
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Renovation services', itemListElement: SERVICES.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: abs(`/services/${s.slug}/`) } })) },
  sameAs: C.sameAs,
};
const website = { '@type': 'WebSite', '@id': `${URL}/#website`, url: `${URL}/`, name: C.name, publisher: { '@id': BUSINESS_ID } };
const breadcrumbLd = (crumbs) => ({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.url) })) });
const faqLd = (items) => ({ '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a) } })) });
const serviceLd = (s, desc) => ({ '@type': 'Service', name: `${s.name} in ${C.city} and ${C.region}`, serviceType: s.name, description: desc, provider: { '@id': BUSINESS_ID }, areaServed: C.areas.map((a) => ({ '@type': 'City', name: `${a}, Ontario` })), url: abs(`/services/${s.slug}/`) });
const articleLd = (g, desc) => ({ '@type': 'Article', headline: g.title, description: desc, datePublished: '2026-11-03', dateModified: TODAY, author: { '@id': BUSINESS_ID }, publisher: { '@id': BUSINESS_ID }, image: abs(`/assets/img/${IMG[g.img].file}-1600.webp`), mainEntityOfPage: abs(`/resources/${g.slug}/`) });

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------
function layout(p) {
  const canonical = abs(p.path);
  const ogImage = abs(`/assets/img/${IMG[p.ogImage || 'hero'].file}-1600.webp`);
  const graph = [business, website, ...(p.crumbs ? [breadcrumbLd(p.crumbs)] : []), ...(p.schema || [])];
  return `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${canonical}">
${p.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="#17242b">
<meta property="og:type" content="${p.ogType || 'website'}">
<meta property="og:site_name" content="${esc(C.name)}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:locale" content="en_CA">
<meta name="twitter:card" content="summary_large_image">
<meta name="geo.region" content="CA-ON">
<meta name="geo.placename" content="${esc(C.city)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<script>document.documentElement.className += ' js';</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/css/site.css">
${p.preload || ''}
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${nav(p.path)}
<main id="main">
${p.body}
</main>
${footer()}
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
const pages = [];
const add = (p) => pages.push(p);

const HOME_FAQ = [
  { q: 'What areas does RC Construction serve?', a: `<p>We're based in ${C.city} and work across ${C.region}, including ${C.areas.slice(1).join(', ')}. Not sure if you're in our area? <a href="/contact/">Ask us</a>.</p>` },
  { q: 'What kinds of renovations do you do?', a: `<p>Mostly basements, bathrooms and home renovations: basement finishing and rental units, full bathroom remodels, kitchens, hardwood and tile floors, stairs, trim, wainscoting and painting. See <a href="/services/">all services</a>.</p>` },
  { q: 'Do you coordinate electricians and plumbers?', a: '<p>Yes. We bring in and coordinate the electricians and plumbers your project needs, so you deal with one team from demolition to the final walkthrough.</p>' },
  { q: 'Do you offer a warranty?', a: '<p>Yes, we offer a warranty on our work. Ask us for the details that apply to your project when we quote.</p>' },
  { q: 'Do I need a permit to finish my basement in Oshawa?', a: `<p>Usually, yes. The City of Oshawa says renovations that change the inside of a home, like finishing a basement or adding a bathroom, usually need a building permit. Read our <a href="/resources/basement-permits-oshawa/">Oshawa basement permit guide</a>.</p>` },
  { q: 'How do I get an estimate?', a: `<p>Call or text <a href="${tel}">${esc(C.phoneDisplay)}</a>, or <a href="/get-an-estimate/">answer three quick questions</a> with a few photos. We'll talk it through, visit to see the space, and give you a clear quote before any work starts.</p>` },
];

// Home
add({
  path: '/',
  title: `${C.name} | Basement, Bathroom & Home Renovations in Oshawa`,
  description: `Basement, bathroom and home renovations in Oshawa and Durham Region. 5-star rated on Google. Call or text ${C.phoneDisplay}.`,
  preload: `<link rel="preload" as="image" href="/assets/img/${IMG.hero.file}-800.webp" media="(max-width: 700px)"><link rel="preload" as="image" href="/assets/img/${IMG.hero.file}-1600.webp" media="(min-width: 701px)">`,
  schema: [faqLd(HOME_FAQ)],
  body: `
<section class="hero">
  <picture>
    <source media="(max-width: 700px)" srcset="/assets/img/${IMG.hero.file}-800.webp">
    <source media="(min-width: 701px)" srcset="/assets/img/${IMG.hero.file}-1600.webp 1600w, /assets/img/${IMG.hero.file}-2000.webp 2000w" sizes="100vw">
    <img src="/assets/img/${IMG.hero.file}-1600.webp" width="1600" height="900" alt="${esc(IMG.hero.alt)}" fetchpriority="high">
  </picture>
  <div class="wrap">
    <span class="eyebrow">Durham Region &amp; East GTA</span>
    <h1>Beautiful renovations. Built to last.</h1>
    <p class="lead">Basement, Bathroom, Kitchen and Home renovations across ${esc(C.region)} and Toronto, by a team homeowners describe as honest, on time and clear about what to expect.</p>
    <div class="hero-actions"><a class="btn btn-primary" href="/get-an-estimate/">Get an Estimate</a><a class="btn btn-light" href="/projects/">See Our Projects</a></div>
    <p class="hero-note">Takes about a minute. We'll call or text you back.</p>
    <div class="rating-chip"><strong>★★★★★</strong> 5-star Google rating · <strong>${C.homestars.rating}</strong> on HomeStars</div>
  </div>
</section>

<section class="trust" aria-label="Why homeowners trust us">
  <ul class="wrap">
    <li><b>${C.google.rating} ★</b>5-star Google rating</li>
    <li><b>${C.homestars.rating} / 5</b>HomeStars, ${C.homestars.count} reviews</li>
    <li><b>Since ${C.homestars.since}</b>Reviewed by homeowners on HomeStars</li>
    <li><b>Warranty</b>Offered on our work</li>
  </ul>
</section>

<section class="section tight" aria-label="Where are you at?">
  <div class="wrap paths">
    <a class="path" href="/get-an-estimate/"><span class="path-k">Ready for a quote?</span><strong>Get an estimate</strong><span>Three quick questions, then we call or text you back.</span></a>
    <a class="path" href="${tel}"><span class="path-k">Rather talk?</span><strong>Call or text ${esc(C.phoneDisplay)}</strong><span>On a job site? We'll call you back.</span></a>
    <a class="path" href="/resources/"><span class="path-k">Just researching?</span><strong>Read our homeowner guides</strong><span>Permits, costs and rental units, explained.</span></a>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">What we do</span><h2>Renovation services tailored to your home</h2><p class="lead">From an unfinished basement to a tired bathroom or a dated main floor, we plan it properly and build it to last.</p></div>
    <div class="grid grid-4">${SERVICES.map((s) => `<a class="card" href="/services/${s.slug}/">${img(s.img, { sizes: '(min-width: 1000px) 25vw, (min-width: 720px) 50vw, 100vw' })}<div class="card-body"><h3>${s.name}</h3><p>${s.short}</p><span class="card-link">Learn more</span></div></a>`).join('')}</div>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Basement ideas</span><h2>What could your basement become?</h2><p class="lead">Basements are most of our work. These are the spaces Oshawa homeowners ask us for.</p></div>
    <div class="ideas">
      <a class="idea" href="/services/basement-rental-units/">${img('suite', { sizes: '(min-width: 1000px) 25vw, (min-width: 720px) 50vw, 100vw' })}<span class="idea-body"><strong>A rental unit</strong><span>A second unit for a tenant or family</span></span></a>
      <a class="idea" href="/services/basement-renovations/">${img('recRoom', { sizes: '(min-width: 1000px) 25vw, (min-width: 720px) 50vw, 100vw' })}<span class="idea-body"><strong>A games or rec room</strong><span>Room for the pool table and movie nights</span></span></a>
      <a class="idea" href="/services/basement-renovations/">${img('basementStairs', { sizes: '(min-width: 1000px) 25vw, (min-width: 720px) 50vw, 100vw' })}<span class="idea-body"><strong>A family room</strong><span>Space that feels like the rest of the house</span></span></a>
      <a class="idea" href="/services/basement-renovations/">${img('basementOpen', { sizes: '(min-width: 1000px) 25vw, (min-width: 720px) 50vw, 100vw' })}<span class="idea-body"><strong>A guest suite or office</strong><span>Bedroom, bathroom or a quiet place to work</span></span></a>
    </div>
    <p class="mt-lg"><a class="btn btn-primary" href="/get-an-estimate/">Get an estimate for your basement</a></p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Our projects</span><h2>Real homes. Real transformations.</h2><p class="lead">A few of the jobs our customers have written about. More project photos are on the way.</p></div>
    <div class="grid grid-3">${PROJECTS.slice(0, 3).map(projectCard).join('')}</div>
    <p class="mt-lg"><a class="btn btn-ghost" href="/projects/">See all projects</a></p>
  </div>
</section>

<section class="section dark">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow" style="color:#e1c19b">Why RC Construction</span><h2>Renovating shouldn't feel like a gamble</h2><p class="lead">The worries homeowners bring to us, and how our customers describe working with us instead.</p></div>
    <div class="compare">
      <div class="compare-col bad"><h3>The usual worries</h3><ul>
        <li>A quote that doesn't say what's included</li>
        <li>A job that drags on past the date you were given</li>
        <li>Chasing the plumber and electrician yourself</li>
        <li>Small problems left behind when the crew leaves</li>
        <li>A crew that doesn't respect your home</li>
      </ul></div>
      <div class="compare-col good"><h3>Working with RC Construction</h3><ul>
        <li>A clear quote and timeline before any work starts</li>
        <li>Finished on the timeline we give, with updates as we go</li>
        <li>Electricians and plumbers coordinated for you</li>
        <li>We come back to fix the small things</li>
        <li>A polite, punctual crew that keeps the site clean</li>
      </ul></div>
    </div>
    <div class="hero-actions mt-lg"><a class="btn btn-primary" href="/get-an-estimate/">Get an Estimate</a><a class="btn btn-light" href="/reviews/">Read our reviews</a></div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div>
      <span class="eyebrow">Meet the owner</span>
      <h2>You deal with Sam, start to finish</h2>
      <p class="lead">Sam leads every RC Construction project, from the first visit and the quote to the final walkthrough. One team does the work and handles the coordination.</p>
      <ul class="ticks">
        <li>Demolition, supplies and garbage removal taken care of</li>
        <li>Help choosing tile, flooring and finishes, with supplier recommendations</li>
        <li>Honest advice, even when it means a smaller job</li>
      </ul>
      <div class="hero-actions"><a class="btn btn-dark" href="/get-an-estimate/">Get an Estimate</a><a class="btn btn-ghost" href="/about/">About us</a></div>
    </div>
    ${img('saw')}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head center"><span class="eyebrow">How it works</span><h2>A simple, clear process</h2></div>
    <ol class="steps">
      <li><h3>Talk it through</h3><p>Call, text or send photos. Tell us what you want the space to do for you.</p></li>
      <li><h3>Plan and quote</h3><p>We visit, measure, talk through options and give you a clear written quote and timeline.</p></li>
      <li><h3>Renovate</h3><p>One team handles the work and the trades, with updates as we go.</p></li>
      <li><h3>Final walkthrough</h3><p>We walk the finished space with you and take care of anything that needs a touch-up.</p></li>
    </ol>
    <p class="mt-lg center"><a class="btn btn-primary" href="/get-an-estimate/">Start with step one</a></p>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Reviews</span><h2>Homeowners rate us 5.0 on Google</h2><p class="lead">Read what customers say in their own words on Google and HomeStars.</p></div>
    <div class="rating-row">
      <div class="rating-card"><div class="score">${C.google.rating}</div><div class="stars" aria-hidden="true">★★★★★</div><p>5-star Google rating</p></div>
      <div class="rating-card"><div class="score">${C.homestars.rating}</div><div class="stars" aria-hidden="true">★★★★★</div><p>HomeStars rating from ${C.homestars.count} reviews. <a href="${C.homestars.url}">Read them on HomeStars</a></p></div>
    </div>
    <p class="mt-lg"><a class="btn btn-ghost" href="/reviews/">What customers say</a></p>
  </div>
</section>

<section class="section">
  <div class="wrap split flip">
    <div>
      <span class="eyebrow">Service areas</span>
      <h2>Based in Oshawa, working across Durham Region</h2>
      <p class="lead">We renovate homes in ${esc(C.city)} and nearby communities.</p>
      <ul class="chips"><li><a href="/service-areas/oshawa/">Oshawa</a></li>${C.areas.slice(1).map((a) => `<li><span>${esc(a)}</span></li>`).join('')}</ul>
      <p class="mt-lg"><a href="/service-areas/">More about our service areas</a></p>
    </div>
    ${img('home')}
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Homeowner guides</span><h2>Plan your renovation with confidence</h2></div>
    <div class="grid grid-3">${GUIDES.map((g) => `<a class="card" href="/resources/${g.slug}/">${img(g.img, { sizes: '(min-width: 1000px) 33vw, 100vw' })}<div class="card-body"><h3>${esc(g.title)}</h3><span class="card-link">Read the guide</span></div></a>`).join('')}</div>
  </div>
</section>

<section class="section"><div class="wrap">${faqBlock(HOME_FAQ)}</div></section>
${cta('Ready to transform your home?')}`,
});

// Services hub
add({
  path: '/services/',
  title: `Renovation Services in Oshawa & Durham Region | ${C.name}`,
  description: `Basement renovations, basement rental units, bathroom renovations and home renovations in Oshawa and Durham Region by ${C.name}.`,
  crumbs: [{ name: 'Home', url: '/' }, { name: 'Services', url: '/services/' }],
  ogImage: 'basementStairs',
  body: `${pageHero({ crumbs: [{ name: 'Home', url: '/' }, { name: 'Services', url: '/services/' }], eyebrow: 'Services', h1: 'Renovation services for Oshawa homes', lead: `Basements, bathrooms and the rest of the house, planned properly and built by one accountable team.`, image: 'basementStairs' })}
<section class="section"><div class="wrap">
  <div class="grid grid-2">${SERVICES.map((s) => `<a class="card" href="/services/${s.slug}/">${img(s.img)}<div class="card-body"><h3>${s.name}</h3><p>${s.short}</p><span class="card-link">Explore ${s.name.toLowerCase()}</span></div></a>`).join('')}</div>
</div></section>
<section class="section alt"><div class="wrap split">
  <div><span class="eyebrow">Also on our list</span><h2>Other work we do</h2><p class="lead">Jobs our customers have hired us for, alongside bigger renovations.</p>
  <ul class="ticks"><li>Hardwood and tile flooring, including replacing carpet</li><li>Stairs rebuilt, such as oak stairs updated with metal pickets</li><li>Baseboards, door and window trim, and custom interior doors</li><li>Wainscoting, waffle ceilings and feature walls</li><li>Interior painting, from one room to the whole house</li><li>Fireplace removal, laundry room cabinets and decks</li></ul>
  <a class="btn btn-dark" href="/get-an-estimate/">Get an estimate</a></div>
  ${img('stairs')}
</div></section>
${cta()}`,
});

// Service pages
const SERVICE_PAGES = {
  'basement-renovations': {
    title: `Basement Renovations in Oshawa | Finished Basements | ${C.name}`,
    description: `Basement renovations and basement finishing in Oshawa and Durham Region: rec rooms, bedrooms, offices and basement bathrooms. See projects and request an estimate.`,
    h1: 'Basement renovations in Oshawa, built for the way you live',
    lead: 'Turn unused space into a family room, guest suite, office or games room that feels like the rest of your home.',
    hero: 'recRoom',
    body: `<p>Basements are the work our customers write about most. Whether you're finishing a bare basement from the studs or restoring one after damage, we plan the space with you and handle every stage, from framing to the last coat of paint.</p>
<h2>What we build</h2>
<ul><li>Family rooms, rec rooms and media rooms</li><li>Bedrooms and guest suites</li><li>Home offices</li><li>Basement bathrooms and laundry rooms</li><li>Storage and built-ins</li><li>Separate side entrances</li></ul>
<h2>What's included</h2>
<ul><li>Framing, drywall, insulation and ceilings</li><li>Flooring, baseboards, trim and interior doors</li><li>Lighting, including pot lights, through the electricians we coordinate</li><li>Plumbing for basement bathrooms and laundry, through the plumbers we coordinate</li><li>Priming and painting</li><li>Demolition, supplies and clean-up</li></ul>
<div class="callout"><p><strong>Planning a rental unit downstairs?</strong> That has extra rules in Oshawa. See <a href="/services/basement-rental-units/">basement rental units</a>.</p></div>
<h2>Things we'll talk through with you</h2>
<ul><li>How you'll use the space, now and in a few years</li><li>Moisture and any past water problems</li><li>Ceiling height, ducts and beams, and where lighting goes</li><li>Windows and safe ways out of the basement</li><li>Whether your plans need a <a href="/resources/basement-permits-oshawa/">building permit from the City of Oshawa</a></li></ul>
<h2>What affects the cost</h2>
<p>Size, the number of rooms, whether you add a bathroom, ceiling and flooring choices and the condition of the space all matter. Our guide explains <a href="/resources/basement-renovation-cost-factors/">what drives basement renovation costs</a>. We give you a clear quote after seeing the space.</p>`,
    faq: [
      { q: 'How long does a basement renovation take?', a: '<p>It depends on the size and what goes in, such as a bathroom. We give you a timeline with your quote, and customers tell us we keep to it.</p>' },
      { q: 'Do I need a permit to finish my basement in Oshawa?', a: `<p>Usually, yes. The City of Oshawa lists finishing a basement, moving plumbing and adding a bathroom as work that usually needs a building permit. See our <a href="/resources/basement-permits-oshawa/">basement permit guide</a>.</p>` },
      { q: 'Can you add a bathroom to my basement?', a: '<p>Yes. We coordinate the plumbing and build the bathroom as part of the basement project.</p>' },
      { q: 'Do you fix water-damaged basements?', a: '<p>Yes. We have restored basements with new drywall, floors and baseboards, and fixed unexpected problems found along the way.</p>' },
    ],
  },
  'basement-rental-units': {
    title: `Basement Rental Units in Oshawa | Basement Apartments | ${C.name}`,
    description: `Planning a basement apartment in Oshawa? We build basement rental units and walk you through the City of Oshawa permit, zoning and parking rules.`,
    h1: 'Basement rental units in Oshawa, planned the right way',
    lead: 'Add a second unit that works for tenants or family, with the City of Oshawa requirements in mind from day one.',
    hero: 'suite',
    body: `<p>We've built basement rental units, including a two-bedroom unit in a walkout basement where the owners kept a bedroom for themselves. A rental unit has more requirements than a regular basement finish, so we plan it with you before anything is built.</p>
<h2>What we build</h2>
<ul><li>One- and two-bedroom basement units</li><li>Kitchens, bathrooms and laundry for the unit</li><li>Separate entrances</li><li>Flooring, trim, doors and paint to a finish tenants will appreciate</li><li>Electrical and plumbing through the trades we coordinate</li></ul>
<h2>Oshawa rules to know before you start</h2>
<p>From the City of Oshawa's <a href="${OSHAWA_APARTMENTS}">accessory apartments</a> page:</p>
<ul><li>A building permit is required to legalize a second or third unit created after July 1994.</li><li>Accessory apartments are allowed in single detached and semi-detached homes, among other house types, in listed zones. A lot can have up to three residential units.</li><li>One extra parking space is required for each accessory unit; for two units, three spaces.</li><li>Permit plans show items like smoke and CO alarm locations, ways out (means of egress) and fire separations.</li><li>New units built with a permit get a two-unit house registration after the final inspection.</li></ul>
<div class="callout"><p>This is a summary, not legal advice. Rules change, so check the City's current requirements or call Service Oshawa at 905-436-3311 before you commit. Our guide compares <a href="/resources/basement-finishing-vs-rental-unit/">basement finishing and a rental unit</a>.</p></div>`,
    faq: [
      { q: 'Can I add a basement apartment to my house in Oshawa?', a: `<p>Often, yes. The City of Oshawa allows accessory apartments in single detached and semi-detached homes, among others, in listed zones, with up to three residential units on a lot. Check your property on the City's <a href="${OSHAWA_APARTMENTS}">accessory apartments page</a>.</p>` },
      { q: 'Do I need a permit for a basement apartment in Oshawa?', a: '<p>Yes. The City says a building permit is required to legalize a second or third unit created after July 1994.</p>' },
      { q: 'How much parking does a basement apartment need in Oshawa?', a: '<p>The City requires one extra parking space for each accessory unit. For two units, three parking spaces are required.</p>' },
    ],
  },
  'bathroom-renovations': {
    title: `Bathroom Renovations in Oshawa | Bathroom Remodels | ${C.name}`,
    description: `Bathroom renovations in Oshawa and Durham Region: full remodels, tile, walk-in showers, tubs, vanities and plumbing coordinated by one team.`,
    h1: 'Bathroom renovations in Oshawa',
    lead: 'From a quick refresh to a full gut and rebuild, a bathroom that looks great and holds up to daily use.',
    hero: 'shower',
    body: `<p>We've gutted and rebuilt washrooms and completed full master bathroom renovations, with a clear quote up front. One team handles the demolition, the tile and finishing work, and the plumbing and electrical trades.</p>
<h2>What we do</h2>
<ul><li>Complete bathroom remodels, including master bathrooms</li><li>Walk-in showers, tubs and tub-to-shower conversions</li><li>Wall and floor tile</li><li>Vanities, mirrors, lighting and fans</li><li>Plumbing and electrical through the trades we coordinate</li><li>Basement bathrooms as part of a basement renovation</li></ul>
<h2>What to expect</h2>
<ul><li>We talk through layout, fixtures and tile, and recommend suppliers if you'd like help choosing</li><li>You get a clear quote and timeline before we start</li><li>We keep the work area clean and let you know what's happening each day</li></ul>`,
    faq: [
      { q: 'How long does a bathroom renovation take?', a: '<p>It depends on the size of the room and what changes. We give you a timeline with your quote.</p>' },
      { q: 'Do I need a permit for a bathroom renovation in Oshawa?', a: `<p>Replacing finishes usually doesn't need one, but the City of Oshawa lists moving plumbing and adding a bathroom as work that usually needs a building permit. See the City's <a href="${OSHAWA_BASEMENTS}">renovation permit page</a>.</p>` },
      { q: 'Can you help me choose tile and fixtures?', a: '<p>Yes. We recommend suppliers and talk through options that fit your budget and the way you use the room.</p>' },
    ],
  },
  'home-renovations': {
    title: `Home Renovations in Oshawa & Durham Region | ${C.name}`,
    description: `Home renovations in Oshawa and Durham Region: kitchens, hardwood and tile floors, stairs, trim, wainscoting, paint and open-concept updates.`,
    h1: 'Home renovations in Oshawa and Durham Region',
    lead: 'Kitchens, floors, stairs, trim and paint: one room at a time or the whole house at once.',
    hero: 'kitchen',
    body: `<p>Some of our favourite projects change a whole floor: a new kitchen, carpet replaced with hardwood, oak stairs rebuilt with modern metal pickets, wainscoting and waffle ceilings, and the entire house painted. We also take on smaller jobs that make a big difference.</p>
<h2>What we do</h2>
<ul><li>Kitchen renovations, including islands and quartz counters</li><li>Hardwood, vinyl and tile floors</li><li>Stairs, railings and pickets</li><li>Baseboards, trim, custom interior doors and wainscoting</li><li>Waffle ceilings and feature walls</li><li>Open-concept layouts</li><li>Interior painting</li><li>Fireplace removal, laundry room cabinets and decks</li></ul>
<h2>One team for the whole job</h2>
<p>We coordinate the electricians and plumbers, for example for pot lights, chandeliers and new appliances, and handle supplies and clean-up, so you aren't managing trades yourself.</p>`,
    faq: [
      { q: 'Do you do whole-home renovations?', a: '<p>Yes. We have renovated entire homes: kitchens, floors, stairs, trim, ceilings, paint and finished basements, coordinated as one project.</p>' },
      { q: 'Do you take on smaller jobs?', a: '<p>Yes. We also do single-room updates, flooring, trim, doors, painting and similar jobs. Tell us what you need.</p>' },
      { q: 'Do I need a permit to remove a wall?', a: `<p>Removing or adding walls usually needs a building permit in Oshawa. The City lists changes to floor plans and walls among work that usually needs one. See the City's <a href="${OSHAWA_BASEMENTS}">renovation permit page</a>.</p>` },
    ],
  },
};

for (const s of SERVICES) {
  const d = SERVICE_PAGES[s.slug];
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Services', url: '/services/' }, { name: s.name, url: `/services/${s.slug}/` }];
  const related = PROJECTS.filter((p) => p.services.includes(s.slug)).slice(0, 4);
  add({
    path: `/services/${s.slug}/`, title: d.title, description: d.description, crumbs, ogImage: d.hero,
    schema: [serviceLd(s, d.description), faqLd(d.faq)],
    body: `${pageHero({ crumbs, eyebrow: s.name, h1: d.h1, lead: d.lead, image: d.hero })}
<section class="section"><div class="wrap sidebar-layout">
  <article class="prose">${d.body}</article>
  <aside>${sideCard()}</aside>
</div></section>
${related.length ? `<section class="section alt"><div class="wrap"><div class="section-head"><span class="eyebrow">Related projects</span><h2>Recent ${s.name.toLowerCase()} work</h2></div><div class="grid grid-2">${related.map(projectCard).join('')}</div><p class="mt-lg"><a class="btn btn-ghost" href="/projects/">See all projects</a></p></div></section>` : ''}
<section class="section"><div class="wrap">${faqBlock(d.faq)}</div></section>
<section class="section alt"><div class="wrap"><h2>Other services</h2><ul class="chips">${SERVICES.filter((o) => o.slug !== s.slug).map((o) => `<li><a href="/services/${o.slug}/">${o.name}</a></li>`).join('')}<li><a href="/service-areas/oshawa/">Renovations in Oshawa</a></li></ul></div></section>
${cta()}`,
  });
}

// Projects
{
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Our Projects', url: '/projects/' }];
  const cats = [...new Set(PROJECTS.map((p) => p.cat))];
  add({
    path: '/projects/', title: `Renovation Projects in Oshawa & Durham Region | ${C.name}`, crumbs, ogImage: 'recRoom',
    description: `Basement, bathroom, kitchen and whole-home renovation projects by ${C.name}, summarised from customer reviews.`,
    body: `${pageHero({ crumbs, eyebrow: 'Our projects', h1: 'Real homes. Real transformations.', lead: 'Projects our customers have written about, from basement suites to bathrooms and whole-home updates. Photos from these jobs are being added.', image: 'recRoom', actions: false })}
<section class="section"><div class="wrap">
  <ul class="chips" aria-label="Project types">${cats.map((c) => `<li><a href="#${c.toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(c)}</a></li>`).join('')}</ul>
  ${cats.map((c) => `<h2 class="mt-lg" id="${c.toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(c)}</h2><div class="grid grid-3">${PROJECTS.filter((p) => p.cat === c).map(projectCard).join('')}</div>`).join('')}
  <p class="notice mt-lg">Each project is summarised in our words from a customer's public review on HomeStars. We never use stock photos to represent our own work.</p>
</div></section>
${cta('Planning something similar?')}`,
  });
}

// Reviews
{
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Reviews', url: '/reviews/' }];
  add({
    path: '/reviews/', title: `Customer Reviews | ${C.name}, Oshawa`, crumbs,
    description: `${C.name} has a 5-star Google rating and is rated ${C.homestars.rating} on HomeStars from ${C.homestars.count} reviews. See what Oshawa homeowners say.`,
    body: `${pageHero({ crumbs, eyebrow: 'Reviews', h1: `Rated ${C.google.rating} by homeowners on Google`, lead: 'Read what customers say about working with Sam and the crew.', actions: false })}
<section class="section"><div class="wrap">
  <div class="rating-row">
    <div class="rating-card"><div class="score">${C.google.rating}</div><div class="stars" aria-hidden="true">★★★★★</div><p>5-star Google rating</p></div>
    <div class="rating-card"><div class="score">${C.homestars.rating}</div><div class="stars" aria-hidden="true">★★★★★</div><p>HomeStars rating from ${C.homestars.count} reviews, since ${C.homestars.since}. <a href="${C.homestars.url}">Read every review on HomeStars</a></p></div>
  </div>
  <div class="section-head mt-lg"><h2>What homeowners mention most</h2></div>
  <div class="grid grid-2">
    <div class="project"><h3>Honesty and clear expectations</h3><p>Customers say Sam is honest from the start, sets clear expectations and explains the process and timing as the job goes.</p></div>
    <div class="project"><h3>Finished on time</h3><p>Reviews mention work completed on the timeline given, and in some cases earlier than expected.</p></div>
    <div class="project"><h3>Quality workmanship</h3><p>From basements that now match the main floor to whole-home makeovers, customers describe results they're proud of.</p></div>
    <div class="project"><h3>A respectful, tidy crew</h3><p>Homeowners describe the crew as professional, polite and considerate, and say the team came back to fix small things afterwards.</p></div>
  </div>
  <p class="notice mt-lg">Ratings as shown on Google and HomeStars in October 2026. Summaries are in our own words; read the full reviews on each site.</p>
</div></section>
${cta('Become our next five-star project')}`,
  });
}

// Service areas
{
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Service Areas', url: '/service-areas/' }];
  add({
    path: '/service-areas/', title: `Service Areas: Oshawa & Durham Region | ${C.name}`, crumbs, ogImage: 'home',
    description: `${C.name} renovates homes in Oshawa and nearby Durham Region communities including ${C.areas.slice(1).join(', ')}.`,
    body: `${pageHero({ crumbs, eyebrow: 'Service areas', h1: 'Renovating homes across Durham Region', lead: `Based in ${C.city}, we take on basement, bathroom and home renovations in nearby communities.`, image: 'home' })}
<section class="section"><div class="wrap split">
  <div>
    <h2>Where we work</h2>
    <p class="lead">${esc(C.city)} is home base. We also work in:</p>
    <ul class="chips"><li><a href="/service-areas/oshawa/">Oshawa</a></li>${C.areas.slice(1).map((a) => `<li><span>${esc(a)}</span></li>`).join('')}</ul>
    <p class="mt-lg">Outside these areas? <a href="/contact/">Ask us</a>. If we can't take your project, we'll tell you straight away.</p>
  </div>
  <div class="facts"><dl><dt>Based in</dt><dd>${esc(C.city)}, Ontario</dd><dt>Region</dt><dd>${esc(C.region)}</dd><dt>Services</dt><dd>${SERVICES.map((s) => `<a href="/services/${s.slug}/">${s.name}</a>`).join(', ')}</dd><dt>Contact</dt><dd><a href="${tel}">${esc(C.phoneDisplay)}</a> (call or text)</dd></dl></div>
</div></section>
${cta()}`,
  });

  const oc = [...crumbs, { name: 'Oshawa', url: '/service-areas/oshawa/' }];
  const oshawaFaq = [
    { q: 'Do I need a building permit to renovate in Oshawa?', a: `<p>The City of Oshawa says renovations that alter the interior of a home usually require a building permit, for example finishing a basement, moving plumbing or adding a bathroom. Replacing flooring, installing cabinets without plumbing changes, or replacing a same-size window or door don't need one. Source: <a href="${OSHAWA_BASEMENTS}">City of Oshawa</a>.</p>` },
    { q: 'Who do I contact at the City about permits?', a: '<p>Service Oshawa at City Hall, 50 Centre St. S.: 905-436-3311 or service@oshawa.ca. Building Services can be reached at buildings@oshawa.ca.</p>' },
    { q: 'Can I add a basement apartment in Oshawa?', a: `<p>Often, yes, subject to zoning, a building permit, fire safety and parking rules. See our page on <a href="/services/basement-rental-units/">basement rental units</a>.</p>` },
  ];
  add({
    path: '/service-areas/oshawa/', title: `Renovation Contractor in Oshawa | Basements & Bathrooms | ${C.name}`, crumbs: oc, ogImage: 'basementOpen',
    description: `Oshawa renovation contractor for basements, basement rental units, bathrooms and home renovations. Local permit tips and a clear quote. Call ${C.phoneDisplay}.`,
    schema: [faqLd(oshawaFaq)],
    body: `${pageHero({ crumbs: oc, eyebrow: 'Oshawa, Ontario', h1: 'Your Oshawa renovation contractor', lead: 'Basement, bathroom and home renovations for Oshawa homeowners, from a team based right here.', image: 'basementOpen' })}
<section class="section"><div class="wrap sidebar-layout">
  <article class="prose">
    <p>${esc(C.name)} is based in Oshawa. Most of our work is in Oshawa homes: finished basements and basement rental units, bathroom remodels, kitchens, floors, stairs and full-floor makeovers.</p>
    <h2>Renovation services in Oshawa</h2>
    <ul>${SERVICES.map((s) => `<li><a href="/services/${s.slug}/">${s.name}</a>: ${s.short}</li>`).join('')}</ul>
    <h2>Permits in Oshawa: the short version</h2>
    <p>The City of Oshawa says renovations that change the inside of a home <strong>usually need a building permit</strong>: finishing a basement, moving plumbing or adding a bathroom, for example. Replacing flooring, adding cabinets without plumbing changes, or swapping a window or door for one the same size don't.</p>
    <p>A finished basement must meet the Ontario Building Code and Oshawa's Zoning By-law. Adding an apartment has its own rules; see <a href="/services/basement-rental-units/">basement rental units</a>.</p>
    <p>Read more in our <a href="/resources/basement-permits-oshawa/">Oshawa basement permit guide</a>.</p>
    <h2>Why Oshawa homeowners choose us</h2>
    <ul><li>A 5-star Google rating, and ${C.homestars.rating} on HomeStars</li><li>One team from demolition to the final walkthrough, with trades coordinated</li><li>Clear quotes and timelines that we keep to</li></ul>
  </article>
  <aside>${sideCard('Renovating in Oshawa?')}</aside>
</div></section>
<section class="section alt"><div class="wrap">${faqBlock(oshawaFaq, 'Oshawa renovation questions')}</div></section>
${cta()}`,
  });
}

// About
{
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'About Us', url: '/about/' }];
  add({
    path: '/about/', title: `About ${C.name} | Oshawa Renovation Contractor`, crumbs, ogImage: 'measure',
    description: `${C.name} is an Oshawa-based renovation team led by Sam, known for honest advice, clear timelines and quality basement, bathroom and home renovations.`,
    body: `${pageHero({ crumbs, eyebrow: 'About us', h1: 'A renovation team homeowners recommend', lead: `${esc(C.name)} is led by Sam and based in ${esc(C.city)}. We've been renovating Durham Region homes and earning five-star reviews since at least ${C.homestars.since}.`, image: 'measure' })}
<section class="section"><div class="wrap split">
  <div class="prose">
    <h2>Who we are</h2>
    <p>We're a hands-on renovation team. Sam leads every project, from the first visit to the final walkthrough, with a crew that customers describe as professional, punctual and respectful of their homes.</p>
    <p>We focus on the work we do best: basements, bathrooms and the kind of home renovations that change how a house feels, like kitchens, floors, stairs and trim. For electrical and plumbing, we bring in trades we trust and coordinate them for you.</p>
    <h2>How we like to work</h2>
    <ul><li>Honest advice, even when it means a smaller job</li><li>A clear quote and timeline before we start</li><li>Regular updates while we work</li><li>A clean, respectful job site</li><li>Coming back for the small things after we finish</li></ul>
  </div>
  <div class="facts" aria-label="Company facts"><h2 style="font-size:1.4rem">${esc(C.name)} at a glance</h2><dl>
    <dt>Business</dt><dd>Renovation contractor (general contractor)</dd>
    <dt>Based in</dt><dd>${esc(C.city)}, Ontario, Canada</dd>
    <dt>Serves</dt><dd>${esc(C.areas.join(', '))}</dd>
    <dt>Services</dt><dd>Basement renovations, basement rental units, bathroom renovations, home renovations</dd>
    <dt>Reviews</dt><dd>5-star rating on Google; ${C.homestars.rating} on HomeStars (${C.homestars.count})</dd>
    <dt>On HomeStars since</dt><dd>${C.homestars.since}</dd>
    <dt>Warranty</dt><dd>Offered on our work</dd>
    <dt>Phone</dt><dd><a href="${tel}">${esc(C.phoneDisplay)}</a></dd>
  </dl></div>
</div></section>
${cta()}`,
  });
}

// Our process
{
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'About Us', url: '/about/' }, { name: 'Our Process', url: '/our-process/' }];
  const processFaq = [
    { q: 'How quickly can you start?', a: '<p>It depends on our schedule and on permits, if your project needs one. We give you a realistic start date with your quote.</p>' },
    { q: 'Will I get a written quote?', a: '<p>Yes. You get a clear quote and timeline before any work starts.</p>' },
    { q: 'Who will I deal with during the job?', a: '<p>Sam and the RC Construction crew. We coordinate the electricians and plumbers, so you have one point of contact.</p>' },
  ];
  add({
    path: '/our-process/', title: `Our Renovation Process | ${C.name}`, crumbs, ogImage: 'saw', schema: [faqLd(processFaq)],
    description: `How ${C.name} runs a renovation: talk it through, plan and quote, renovate with coordinated trades, and a final walkthrough.`,
    body: `${pageHero({ crumbs, eyebrow: 'Our process', h1: 'What working with us looks like', lead: 'No surprises: you know what is happening, when, and why.', image: 'saw' })}
<section class="section"><div class="wrap">
  <ol class="steps">
    <li><h3>Talk it through</h3><p>Call, text or send photos and a few lines about your project. We'll ask the questions that matter and tell you honestly whether we're the right fit.</p></li>
    <li><h3>Visit, plan and quote</h3><p>We see the space, measure and talk through layouts, finishes and budget. You get a clear written quote and a realistic timeline.</p></li>
    <li><h3>Renovate</h3><p>We handle demolition, supplies, the build and the trades. You get regular updates and a tidy site.</p></li>
    <li><h3>Final walkthrough</h3><p>We walk through the finished space together and take care of anything that needs attention, including the small things that come up later.</p></li>
  </ol>
</div></section>
<section class="section alt"><div class="wrap">${faqBlock(processFaq, 'Process questions')}</div></section>
${cta()}`,
  });
}

// Resources hub + guides
{
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Homeowner Guides', url: '/resources/' }];
  add({
    path: '/resources/', title: `Renovation Guides for Oshawa Homeowners | ${C.name}`, crumbs, ogImage: 'basementOpen',
    description: 'Plain-English guides for Oshawa and Durham Region homeowners: basement permits, what drives renovation costs, and basement finishing vs a rental unit.',
    body: `${pageHero({ crumbs, eyebrow: 'Homeowner guides', h1: 'Plan your renovation with confidence', lead: 'Straight answers to the questions we hear most from Oshawa homeowners.', actions: false })}
<section class="section"><div class="wrap"><div class="grid grid-3">${GUIDES.map((g) => `<a class="card" href="/resources/${g.slug}/">${img(g.img, { sizes: '(min-width: 1000px) 33vw, 100vw' })}<div class="card-body"><h3>${esc(g.title)}</h3><span class="card-link">Read the guide</span></div></a>`).join('')}</div></div></section>
${cta()}`,
  });
}

const GUIDE_BODIES = {
  'basement-permits-oshawa': {
    description: 'Finishing a basement in Oshawa usually needs a building permit. What the City of Oshawa requires, what is exempt, and who to contact.',
    answer: 'Usually, yes. The City of Oshawa says renovations that alter the interior of a home usually require a building permit, and it lists finishing a basement as an example. Replacing flooring, installing cabinets without plumbing changes, or replacing a window or door with one of the same size do not need a permit.',
    body: `<h2>Work that usually needs a permit</h2>
<p>According to the City of Oshawa's <a href="${OSHAWA_BASEMENTS}">basement renovations page</a>, renovations that change the inside of your home usually require a building permit. Examples the City gives include:</p>
<ul><li>Finishing a basement</li><li>Moving plumbing</li><li>Adding a bathroom</li></ul>
<h2>Work that doesn't need a permit</h2>
<ul><li>Replacing flooring</li><li>Installing cabinets with no plumbing changes</li><li>Replacing a window or door with one of the same size</li></ul>
<h2>Other rules your basement must meet</h2>
<p>The City says a finished basement must comply with the Ontario Building Code and Oshawa's Zoning By-law, and the entire building must remain a single housekeeping unit with inside access throughout, unless you are legally adding an apartment.</p>
<h2>Adding an apartment is different</h2>
<p>If you want a rental unit in your basement, the City points to its separate <a href="${OSHAWA_APARTMENTS}">accessory apartments</a> rules, including permits, zoning and parking. See <a href="/resources/basement-finishing-vs-rental-unit/">basement finishing vs a rental unit</a>.</p>
<h2>Who to contact</h2>
<p>Service Oshawa, Oshawa City Hall, 50 Centre St. S., Oshawa, ON L1H 3Z7. Phone 905-436-3311 (toll free 1-800-667-4292), email service@oshawa.ca. The City also publishes a basement renovation guide and digital submission standards for permit drawings.</p>
<div class="callout"><p>This guide summarises the City of Oshawa's published information as of November 2026. It isn't legal advice, and rules change, so confirm with the City before you start.</p></div>`,
  },
  'basement-renovation-cost-factors': {
    description: 'What drives the cost of a basement renovation in Oshawa: size, layout, bathrooms, ceilings, flooring, condition, permits and finishes.',
    answer: 'The biggest cost drivers are the size of the basement, how many rooms you add, whether you add a bathroom or kitchen, the condition of the space (moisture, old finishes to remove), ceiling and lighting choices, flooring and finish levels, and whether the work needs a building permit.',
    body: `<p>Every basement is different, which is why we give a quote after seeing the space rather than a number over the phone. These are the things that move the price most.</p>
<h2>1. Size and layout</h2><p>More square footage means more framing, drywall, flooring and paint. Adding rooms, such as bedrooms or an office, adds walls, doors and trim.</p>
<h2>2. Bathrooms, kitchens and laundry</h2><p>Plumbing is one of the biggest variables. A new basement bathroom or kitchenette costs more than a single open room, and usually needs a permit.</p>
<h2>3. The condition of the space</h2><p>Old finishes to tear out, past water problems or uneven floors all add work before the new space can go in.</p>
<h2>4. Ceilings, lighting and electrical</h2><p>Drywall ceilings, pot lights and extra outlets cost more than a basic layout, but they make the biggest difference to how a basement feels.</p>
<h2>5. Flooring and finishes</h2><p>Vinyl plank, tile, carpet or hardwood; standard or custom doors and trim; feature walls and built-ins all change the total.</p>
<h2>6. Permits and rental units</h2><p>Most basement finishing in Oshawa needs a building permit. A rental unit adds requirements like fire separations, ways out and parking. See our <a href="/resources/basement-permits-oshawa/">permit guide</a>.</p>
<h2>How to get an accurate number</h2><p>Send us photos and a few details, then we'll visit and give you a clear written quote. <a href="/get-an-estimate/">Get an estimate</a>.</p>`,
  },
  'basement-finishing-vs-rental-unit': {
    description: 'The difference between finishing a basement and adding a basement rental unit in Oshawa: permits, zoning, fire safety, parking and registration.',
    answer: 'A finished basement is extra living space for your own household. A basement rental unit is a separate dwelling, so in Oshawa it needs a building permit to legalize it (for units created after July 1994), must meet zoning, needs one extra parking space per accessory unit, and has fire safety requirements such as alarms, means of egress and fire separations.',
    body: `<h2>Finished basement</h2>
<ul><li>Extra space for your household: family room, bedroom, office, bathroom</li><li>Usually needs a building permit in Oshawa when you finish the space, move plumbing or add a bathroom</li><li>Must meet the Ontario Building Code and Oshawa's Zoning By-law</li><li>The house stays one housekeeping unit with inside access throughout</li></ul>
<h2>Basement rental unit (accessory apartment)</h2>
<ul><li>A separate home for a tenant or family member</li><li>Allowed in single detached and semi-detached homes, among other house types, in listed zones; up to three residential units on a lot</li><li>A building permit is required to legalize a second or third unit created after July 1994</li><li>Permit plans show items like smoke and CO alarm locations, means of egress and fire separations</li><li>One extra parking space per accessory unit; for two units, three spaces of 2.75 m × 5.75 m</li><li>New units built with a permit receive a two-unit house registration after the final inspection</li></ul>
<p>Source: City of Oshawa <a href="${OSHAWA_APARTMENTS}">accessory apartments</a> and <a href="${OSHAWA_BASEMENTS}">basement renovations</a> pages, November 2026.</p>
<h2>Which is right for you?</h2>
<p>If you want rental income or a suite for family, plan the rental unit from the start; it's far easier than converting a finished basement later. We can talk through both options. See <a href="/services/basement-rental-units/">basement rental units</a> and <a href="/services/basement-renovations/">basement renovations</a>.</p>
<div class="callout"><p>This summary isn't legal advice. Confirm current requirements with the City of Oshawa (905-436-3311, buildings@oshawa.ca) before you begin.</p></div>`,
  },
};

for (const g of GUIDES) {
  const d = GUIDE_BODIES[g.slug];
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Homeowner Guides', url: '/resources/' }, { name: g.short, url: `/resources/${g.slug}/` }];
  const qa = [{ q: g.title, a: `<p>${d.answer}</p>` }];
  add({
    path: `/resources/${g.slug}/`, title: `${g.title} | ${C.name}`, description: d.description, crumbs, ogImage: g.img, ogType: 'article',
    schema: [articleLd(g, d.description), faqLd(qa)],
    body: `${pageHero({ crumbs, eyebrow: 'Homeowner guide', h1: esc(g.title), lead: '', image: g.img, actions: false })}
<section class="section"><div class="wrap sidebar-layout">
  <article class="prose">
    <p class="updated">Updated ${new Date(TODAY + 'T12:00:00Z').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} · by ${esc(C.name)}, ${esc(C.city)}</p>
    <div class="callout"><p><strong>Short answer:</strong> ${d.answer}</p></div>
    ${d.body}
  </article>
  <aside>${sideCard('Planning a basement?')}</aside>
</div></section>
<section class="section alt"><div class="wrap"><h2>More guides</h2><ul class="chips">${GUIDES.filter((o) => o.slug !== g.slug).map((o) => `<li><a href="/resources/${o.slug}/">${esc(o.title)}</a></li>`).join('')}</ul></div></section>
${cta()}`,
  });
}

// Get an estimate: a short three-step form that captures the person's name and contact details.
// Without JavaScript it shows as one form and still posts to Web3Forms, which redirects to /thank-you/.
const hiddenFormFields = (subject) => `<input type="hidden" name="access_key" value="${esc(C.web3formsKey)}">
    <input type="hidden" name="subject" value="${esc(subject)}">
    <input type="hidden" name="from_name" value="${esc(C.name)} website">
    <input type="hidden" name="redirect" value="${abs('/thank-you/')}">
    <input type="hidden" name="lead_source" value="">
    <input type="hidden" name="page" value="">
    <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">`;
const choice = (name, value, required = true) => `<label class="choice"><input type="radio" name="${name}" value="${esc(value)}"${required ? ' required' : ''}><span>${esc(value)}</span></label>`;
{
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Get an Estimate', url: '/get-an-estimate/' }];
  add({
    path: '/get-an-estimate/', title: `Get a Renovation Estimate in Oshawa | ${C.name}`, crumbs,
    description: `Get an estimate for your basement, bathroom or home renovation in Oshawa or Durham Region. Answer three quick questions and we'll call or text you back.`,
    body: `${pageHero({ crumbs, eyebrow: 'Get an estimate', h1: 'Tell us about your project', lead: `Three quick questions, about a minute. Prefer to talk? Call or text <a href="${tel}" style="color:#f1d9ba">${esc(C.phoneDisplay)}</a>.`, actions: false })}
<section class="section"><div class="wrap sidebar-layout">
  <form class="lead-form estimate-form" data-steps data-phone="${esc(C.phoneDisplay)}" action="https://api.web3forms.com/submit" method="POST">
    ${hiddenFormFields('New estimate request from the RC Construction website')}
    <div class="progress js-only" aria-hidden="true"><span class="progress-bar"></span></div>
    <fieldset class="step" data-step="1">
      <legend><span class="step-k">Step 1 of 3</span>What are you planning?</legend>
      <div class="choice-grid">${['Basement renovation', 'Basement rental unit', 'Bathroom renovation', 'Kitchen or home renovation', 'Flooring, stairs or trim', 'Not sure yet'].map((v) => choice('project_type', v)).join('')}</div>
      <div class="form-nav js-only"><button class="btn btn-dark" type="button" data-next>Next</button></div>
    </fieldset>
    <fieldset class="step" data-step="2">
      <legend><span class="step-k">Step 2 of 3</span>When would you like to start?</legend>
      <div class="choice-grid">${['As soon as possible', 'In 1 to 3 months', 'In 3 to 6 months', 'Just planning for now'].map((v) => choice('timing', v)).join('')}</div>
      <div class="field"><label for="est-city">Where is the home?</label><select id="est-city" name="city" required><option value="">Choose a town</option>${C.areas.map((a) => `<option>${esc(a)}</option>`).join('')}<option>Somewhere else in Durham Region</option><option>Outside Durham Region</option></select></div>
      <div class="form-nav js-only"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn btn-dark" type="button" data-next>Next</button></div>
    </fieldset>
    <fieldset class="step" data-step="3">
      <legend><span class="step-k">Step 3 of 3</span>How can we reach you?</legend>
      <div class="row">
        <div class="field"><label for="est-name">Your name</label><input id="est-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="est-phone">Phone</label><input id="est-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div>
      </div>
      <div class="field"><label for="est-email">Email (optional)</label><input id="est-email" name="email" type="email" autocomplete="email"></div>
      <div class="field"><span class="label">Best way to reach you</span><div class="choice-grid three">${['Call', 'Text', 'Email'].map((v) => choice('contact_by', v, false)).join('')}</div></div>
      <div class="field"><label for="est-notes">Anything else we should know? (optional)</label><textarea id="est-notes" name="message" placeholder="Size of the space, what you'd like done, timing"></textarea></div>
      <label class="consent"><input type="checkbox" name="consent" value="yes" required> <span>OK to contact me about this project by phone, text or email.</span></label>
      <div class="form-nav"><button class="btn btn-ghost js-only" type="button" data-back>Back</button><button class="btn btn-primary" type="submit">Send my request</button></div>
    </fieldset>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>
  <aside>
    <div class="side-card"><h2>What happens next</h2><ol class="next-steps"><li>We call or text to talk it through</li><li>We visit to see the space</li><li>You get a clear quote and timeline</li></ol><a class="btn btn-primary" href="${tel}">Call ${esc(C.phoneDisplay)}</a><a class="btn btn-light" href="${sms}">Text us</a></div>
    <div class="rating-card mt-lg"><div class="score">${C.google.rating}</div><div class="stars" aria-hidden="true">★★★★★</div><p>5-star Google rating</p></div>
  </aside>
</div></section>`,
  });
}

add({
  path: '/thank-you/', title: `Thank you | ${C.name}`, description: 'Your estimate request has been sent.', noindex: true,
  body: `<section class="page-hero plain"><div class="wrap"><span class="eyebrow" style="color:#e9cfaf">Request received</span><h1>Thanks! We'll be in touch soon.</h1><p class="lead">We'll call or text you to talk about your project. If it's urgent, call or text <a href="${tel}" style="color:#f1d9ba">${esc(C.phoneDisplay)}</a>.</p><div class="hero-actions"><a class="btn btn-primary" href="/projects/">See our projects</a><a class="btn btn-light" href="/resources/">Read our guides</a></div></div></section>`,
});

// Contact
{
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Contact', url: '/contact/' }];
  add({
    path: '/contact/', title: `Contact ${C.name} | Request a Renovation Estimate in Oshawa`, crumbs,
    description: `Request an estimate for your basement, bathroom or home renovation in Oshawa or Durham Region. Call or text ${C.phoneDisplay}, or send your project details.`,
    body: `${pageHero({ crumbs, eyebrow: 'Contact', h1: 'Tell us about your project', lead: `Call or text <a href="${tel}" style="color:#f1d9ba">${esc(C.phoneDisplay)}</a>, or send a few details below. We'll get back to you quickly.`, actions: false })}
<section class="section"><div class="wrap sidebar-layout">
  <form class="lead-form" data-phone="${esc(C.phoneDisplay)}" action="https://api.web3forms.com/submit" method="POST">
    ${hiddenFormFields('New message from the RC Construction contact page')}
    <div class="row">
      <div class="field"><label for="type">Project type</label><select id="type" name="project_type" required><option value="">Choose one</option><option>Basement renovation</option><option>Basement rental unit</option><option>Bathroom renovation</option><option>Kitchen or home renovation</option><option>Flooring, stairs or trim</option><option>Something else</option></select></div>
      <div class="field"><label for="city">City or neighbourhood</label><input id="city" name="city" autocomplete="address-level2" placeholder="e.g. Oshawa"></div>
    </div>
    <div class="row">
      <div class="field"><label for="budget">Budget range</label><select id="budget" name="budget"><option>Not sure yet</option><option>Under $15,000</option><option>$15,000 to $40,000</option><option>$40,000 to $80,000</option><option>Over $80,000</option></select></div>
      <div class="field"><label for="stage">Where are you at?</label><select id="stage" name="stage"><option>Just researching</option><option>Ready to talk</option><option>I have plans or drawings</option></select></div>
    </div>
    <div class="field"><label for="details">Tell us about the project</label><textarea id="details" name="message" placeholder="What would you like done? Any timing we should know about?"></textarea></div>
    <div class="row">
      <div class="field"><label for="name">Your name</label><input id="name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div>
    </div>
    <div class="field"><label for="email">Email (optional)</label><input id="email" name="email" type="email" autocomplete="email"></div>
    <label class="consent"><input type="checkbox" name="consent" value="yes" required> <span>OK to contact me about this project by phone, text or email.</span></label>
    <button class="btn btn-primary" type="submit">Send my request</button>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>
  <aside>
    <div class="side-card"><h2>Prefer to talk?</h2><p>Call or text us. If we're on a job site, we'll call you back.</p><a class="btn btn-primary" href="${tel}">Call ${esc(C.phoneDisplay)}</a><a class="btn btn-light" href="${sms}">Text us</a></div>
    <div class="facts mt-lg"><h2 style="font-size:1.3rem">What happens next</h2><ol style="padding-left:1.2em;margin:0;color:var(--ink-2)"><li>We call or text to talk it through</li><li>We visit to see the space</li><li>You get a clear quote and timeline</li></ol><p class="notice" style="margin-top:14px">Serving ${esc(C.areas.join(', '))}.</p></div>
  </aside>
</div></section>`,
  });
}

// Photo credits
add({
  path: '/photo-credits/', title: `Photo Credits | ${C.name}`, description: 'Credits for the illustrative photographs used on this website.',
  crumbs: [{ name: 'Home', url: '/' }, { name: 'Photo credits', url: '/photo-credits/' }],
  body: `${pageHero({ crumbs: [{ name: 'Home', url: '/' }, { name: 'Photo credits', url: '/photo-credits/' }], h1: 'Photo credits', lead: 'Until our own project photos are added, this site uses illustrative photographs from Unsplash, used under the free Unsplash License. They are not photos of our projects.', actions: false })}
<section class="section"><div class="wrap prose"><ul>${Object.values(IMG).map((i) => `<li>${esc(i.alt)}: <a href="https://images.unsplash.com/photo-${i.unsplash}">source image on Unsplash</a></li>`).join('')}</ul></div></section>`,
});

// ---------------------------------------------------------------------------
// Write everything
// ---------------------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(__dirname, 'assets'), path.join(OUT, 'assets'), { recursive: true });

for (const p of pages) {
  const dir = path.join(OUT, p.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), layout(p));
}

fs.writeFileSync(path.join(OUT, '404.html'), layout({
  path: '/404.html', title: `Page not found | ${C.name}`, description: 'This page could not be found.', noindex: true,
  body: `<section class="page-hero plain"><div class="wrap"><h1>Sorry, that page isn't here</h1><p class="lead">Try one of these instead.</p><div class="hero-actions"><a class="btn btn-primary" href="/">Home</a><a class="btn btn-light" href="/services/">Services</a><a class="btn btn-light" href="/contact/">Contact</a></div></div></section>`,
}));

const indexable = pages.filter((p) => !p.noindex);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>
`);

// Search engines and AI assistants are welcome: that's how homeowners find RC Construction.
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${abs('/sitemap.xml')}
`);

// llms.txt: a plain summary for AI assistants (GEO).
fs.writeFileSync(path.join(OUT, 'llms.txt'), `# ${C.name}

> ${C.name} is a renovation contractor based in ${C.city}, Ontario, Canada, serving ${C.region} (${C.areas.join(', ')}). It does basement renovations, basement rental units, bathroom renovations and home renovations (kitchens, flooring, stairs, trim, wainscoting, painting). It has a 5-star Google rating and is rated ${C.homestars.rating} on HomeStars from ${C.homestars.count} reviews. Phone: ${C.phoneDisplay} (call or text).

## Key facts
- Based in: ${C.city}, Ontario, Canada
- Serves: ${C.areas.join(', ')}
- Led by: Sam
- Reviews: 5-star rating on Google; ${C.homestars.rating} on HomeStars (${C.homestars.count} reviews), reviewed since ${C.homestars.since}
- Warranty: offered on its work
- Coordinates electricians and plumbers as part of its projects
- Contact: ${C.phoneDisplay} (call or text), estimate requests at ${abs('/get-an-estimate/')}

## Services
${SERVICES.map((s) => `- [${s.name}](${abs(`/services/${s.slug}/`)}): ${s.short}`).join('\n')}

## Guides
${GUIDES.map((g) => `- [${g.title}](${abs(`/resources/${g.slug}/`)})`).join('\n')}

## Other pages
- [Projects](${abs('/projects/')})
- [Reviews](${abs('/reviews/')})
- [Oshawa](${abs('/service-areas/oshawa/')})
- [About](${abs('/about/')})
- [Contact](${abs('/contact/')})
`);

// Cloudflare Pages headers: long cache for images and CSS/JS, security basics.
fs.writeFileSync(path.join(OUT, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN

/assets/img/*
  Cache-Control: public, max-age=31536000, immutable

/assets/css/*
  Cache-Control: public, max-age=86400

/assets/js/*
  Cache-Control: public, max-age=86400
`);

console.log(`Built ${pages.length + 1} pages into ${path.relative(process.cwd(), OUT) || 'site'} for ${URL}`);
