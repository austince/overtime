
module.exports = {
  name: 'Overtime',
  version: '1.0.1',
  short_name: '',
  default_locale: 'en',
  description: "Don't let your emotions get away.",
  author: 'austin ce <austin.cawley@gmail.com>',
  manifest_version: 2,
  icons: {
    '16': 'icons/icon16.png',
    '32': 'icons/icon32.png',
    '64': 'icons/icon64.png',
    '128': 'icons/icon128.png' ,
    '512': 'icons/icon512.png',
  },
  permissions: [
    'background',
    'storage',
    'unlimitedStorage',
    'videoCapture',
  ],
  // browser_action: {
  //   default_title: 'title',
  //   default_popup: 'pages/popup.html'
  // },
  background: {
    persistent: false,
    page: 'pages/background.html',
  },
  "chrome_url_overrides": {
    "newtab": "pages/newtab.html",
  },
  "options_ui": {
    "chrome_style": true,
    // "open_in_tab": true,
    "page": "pages/options.html",
  },
  content_security_policy: "script-src 'unsafe-inline'"
}
