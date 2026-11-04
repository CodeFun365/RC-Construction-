// Business facts used on every page. Edit here, then run `node build.js`.
// Everything below is verified from RC Construction's public HomeStars and Google profiles (Oct 2026),
// except the items marked CONFIRM, which must be checked with Sam before launch.

module.exports = {
  // The live address of the site. Change to the real domain once it's connected in Cloudflare.
  siteUrl: process.env.SITE_URL || 'https://rc-construction.pages.dev',

  name: 'RC Construction',
  tagline: 'Basement, bathroom and home renovations',
  phone: '+16478649281', // from RC's HomeStars replies and Google listing
  phoneDisplay: '(647) 864-9281',
  city: 'Oshawa',
  region: 'Durham Region',
  province: 'ON',
  // CONFIRM: the towns Sam actually serves. Only Oshawa gets its own page until real projects exist elsewhere.
  areas: ['Oshawa', 'Whitby', 'Courtice', 'Ajax', 'Bowmanville', 'Pickering'],

  // Review facts shown on the site (keep in sync with the live profiles).
  google: { rating: '5.0', count: 34 },
  homestars: { rating: '4.9', count: 29, url: 'https://www.homestars.com/profile/2920698-rc-construction', since: 2018 },
  warranty: true, // HomeStars profile: "Offers warranty". CONFIRM the terms before describing them.

  // Free form handling through https://web3forms.com: get an access key emailed to RC's inbox and paste it here.
  web3formsKey: process.env.WEB3FORMS_KEY || 'YOUR_WEB3FORMS_ACCESS_KEY',

  // Other public profiles (add Facebook / Instagram / Google listing link when known).
  sameAs: ['https://www.homestars.com/profile/2920698-rc-construction'],
};
