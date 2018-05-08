
module.exports = {
  name: 'Overtime',
  version: '1.0.0',
  description: '',
  author: 'austin ce <austin.cawley@gmail.com>',
  manifest_version: 2,
  icons: { '16': 'icons/16.png', '128': 'icons/128.png' },
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
    page: 'pages/background.html'
  },
  "chrome_url_overrides": {
    "newtab": "pages/newtab.html"
  },
  "options_ui": {
    "chrome_style": true,
    "page": "pages/options.html"
  },
  content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'"
}
