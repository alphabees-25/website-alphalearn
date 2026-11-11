// Tailwind build for alphalearn.ai (replaces the Play CDN, see claude.md).
// Built by scripts/seo_build.py -> assets/css/tailwind.css. Same defaults as cdn.tailwindcss.com/3.4.17.
module.exports = {
  content: {
    relative: true,
    files: [
      '../../de/**/*.html',
      '../../en/**/*.html',
      '../../*.html',
      '../../partials/**/*.html',
      '../../assets/js/**/*.js',
      '../../assets/orbi/**/*.js',
      '../../*.js',
    ],
  },
  theme: { extend: {} },
  plugins: [],
};
