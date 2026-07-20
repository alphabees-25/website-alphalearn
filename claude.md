# AlphaLearn Domain Migration And SEO Handoff

Last updated: 2026-05-12

## Goal

AlphaLearn is being moved from the product subdomain to the apex domain:

- Old product host: `https://moodle-ai-tutor.alphalearn.ai/`
- New canonical host: `https://alphalearn.ai/`
- Target URL pattern: keep paths stable, for example:
  - Old: `https://moodle-ai-tutor.alphalearn.ai/de/demos.html`
  - New: `https://alphalearn.ai/de/demos.html`

The motivation is SEO/indexing recovery. Google Search Console had moved many pages to "Crawled - currently not indexed". A major suspected cause was the previous architecture where `alphalearn.ai` was only a small redirect/placeholder page while the real website lived on `moodle-ai-tutor.alphalearn.ai`.

## Current Domain Architecture

Canonical domain:

```txt
https://alphalearn.ai/
```

Language/page structure:

```txt
https://alphalearn.ai/de/...
https://alphalearn.ai/en/...
```

Examples:

```txt
https://alphalearn.ai/de/demos.html
https://alphalearn.ai/en/demos.html
https://alphalearn.ai/de/features.html
https://alphalearn.ai/de/preis.html
```

Legacy subdomain behavior:

```txt
https://moodle-ai-tutor.alphalearn.ai/* -> 301 -> https://alphalearn.ai/*
```

`www.alphalearn.ai` behavior:

```txt
https://www.alphalearn.ai/* -> 301 -> https://alphalearn.ai/*
```

This was live-tested after the changes.

## GitHub Pages Setup

Active GitHub Pages repo:

```txt
alphabees-25/website-alphalearn
```

Current Pages source:

```txt
branch: main
path: /
custom domain: alphalearn.ai
```

Important repo files updated:

```txt
CNAME
robots.txt
sitemap.xml
llms.txt
*.html
de/**/*.html
en/**/*.html
assets/js/layout.js
```

`CNAME` now contains:

```txt
alphalearn.ai
```

Previous blocker:

- `alphalearn.ai` was still assigned as a GitHub Pages custom domain to `beemarcello/alphalearn-root`.
- That old repo served a tiny root redirect page.
- The custom domain was removed from `beemarcello/alphalearn-root`.
- The custom domain was then set on `alphabees-25/website-alphalearn`.
- GitHub Pages certificate for `alphalearn.ai` is approved and HTTPS is enforced.

Relevant commits:

```txt
afb00bf Migrate SEO signals to alphalearn.ai
ae35b25 Keep explicit language URLs stable
795ae68 Restore stored language redirects
```

Final language behavior is from `795ae68`: stored language preference redirects are restored because Marcel explicitly wants them.

## Cloudflare Setup

Old Cloudflare redirect rules were deleted by Marcel:

- `Root Redirect to Moodle Tutor`
- `Moodle Tutor Redirect`

New Cloudflare redirect rule was created and deployed:

```txt
Rule name: Redirect moodle-ai-tutor to alphalearn
Match type: Wildcard pattern
Request URL: https://moodle-ai-tutor.alphalearn.ai/*
Target URL: https://alphalearn.ai/${1}
Status: 301 Permanent Redirect
Preserve query string: enabled
```

Important DNS state:

```txt
moodle-ai-tutor CNAME alphabees-25.github.io
```

This `moodle-ai-tutor` record must stay Cloudflare proxied/orange-clouded so the Cloudflare redirect rule can run.

Other DNS records should not be changed unless there is a specific reason:

- `alphalearn.ai -> alphabees-25.github.io` is working.
- `www -> alphalearn.ai` is working.
- Google verification TXT records should remain.
- `api`, `chat`, `portal`, `canvas-ui`, `lti`, and verification CNAMEs should remain untouched.

## Live Validation Results

Confirmed after deployment:

```txt
https://alphalearn.ai/de/demos.html -> 200
https://alphalearn.ai/robots.txt -> 200
https://alphalearn.ai/sitemap.xml -> 200
https://www.alphalearn.ai/ -> 301 -> https://alphalearn.ai/
https://www.alphalearn.ai/de/demos.html -> 301 -> https://alphalearn.ai/de/demos.html
```

Legacy subdomain redirects:

```txt
https://moodle-ai-tutor.alphalearn.ai/ -> 301 -> https://alphalearn.ai/ -> 200
https://moodle-ai-tutor.alphalearn.ai/de/demos.html -> 301 -> https://alphalearn.ai/de/demos.html -> 200
https://moodle-ai-tutor.alphalearn.ai/de/features.html -> 301 -> https://alphalearn.ai/de/features.html -> 200
https://moodle-ai-tutor.alphalearn.ai/de/demos.html?test=1 -> 301 -> https://alphalearn.ai/de/demos.html?test=1
```

English URL behavior:

```txt
https://moodle-ai-tutor.alphalearn.ai/en/demos.html
  -> server-side 301 to https://alphalearn.ai/en/demos.html
  -> final server-side status 200
```

If a browser then lands on `/de/demos.html`, that is caused by the site's stored language preference in `assets/js/layout.js`, not by Cloudflare. Marcel wants this behavior to remain.

Sitemap audit:

```txt
sitemap URLs: 414
bad host count: 0
HTTP status counts: {200: 414}
unexpected redirect/issues count: 0
```

Canonical/robots live audit:

```txt
checked HTML URLs: 414
issues count: 0
```

This checked:

- exactly one canonical per sitemap URL
- canonical equals sitemap URL
- robots meta exists
- no `noindex`
- no old `moodle-ai-tutor.alphalearn.ai` or `www.alphalearn.ai` host references in live sitemap HTML

Sitemap composition:

```txt
root URLs: 1
de URLs: 207
en URLs: 206
other: 0
```

The sitemap does not include root-level duplicate HTML pages such as `/demos.html`. Those root-level files still exist in the repo, but their canonicals point to the `/de/...` versions.

## Robots And Sitemap

`robots.txt` points to:

```txt
Sitemap: https://alphalearn.ai/sitemap.xml
```

`robots.txt` allows crawling and blocks only partial HTML fragments:

```txt
User-agent: *
Allow: /

Disallow: /partials/
Disallow: /de/partials/
Disallow: /en/partials/
```

## Language Preference Behavior

`assets/js/layout.js` stores language preference using:

```txt
localStorage preferredLang
cookie lang
sessionStorage ab_temp_lang
```

If a visitor has German stored, an explicit `/en/...` URL can be redirected client-side to the German alternate. This was briefly changed, then reverted at Marcel's request. Do not "fix" this unless Marcel explicitly changes the product decision.

Important distinction:

- Cloudflare/server redirects preserve `/en/...` correctly.
- Any `/en/...` to `/de/...` jump happens client-side because of stored language preference.

## Next Recommended Steps

1. Google Search Console:
   - Submit `https://alphalearn.ai/sitemap.xml`.
   - Use URL Inspection with Live Test for:
     - `https://alphalearn.ai/`
     - `https://alphalearn.ai/de/`
     - `https://alphalearn.ai/de/features.html`
     - `https://alphalearn.ai/de/preis.html`
     - `https://alphalearn.ai/de/demos.html`
   - If Live Test is clean, request indexing for these key URLs.

2. In URL Inspection, verify:
   - page fetch successful
   - crawling allowed
   - indexing allowed
   - user-declared canonical is the URL itself
   - Google-selected canonical should ideally match
   - rendered screenshot shows real page content

3. Observe GSC for 7-14 days:
   - watch "Crawled - currently not indexed"
   - watch canonical selection
   - watch sitemap discovered URLs
   - watch any crawl anomalies

4. If commercial pages still do not index:
   - strengthen internal links to `/de/features.html`, `/de/preis.html`, `/de/demos.html`
   - add more unique proof/trust/content to pricing/features/demos
   - prune, consolidate, or noindex weak blog content if needed
   - avoid producing more generic blog pages until the core index set recovers

## Do Not Accidentally Undo

Do not restore the old root redirect from `alphalearn.ai/*` to the Moodle subdomain.

Do not remove the current Cloudflare rule:

```txt
moodle-ai-tutor.alphalearn.ai/* -> 301 -> alphalearn.ai/*
```

Do not change the `moodle-ai-tutor` DNS record back to DNS-only; it must remain proxied for the redirect rule.

Do not remove Google verification TXT records.

Do not assume `/en/...` to `/de/...` in a browser means Cloudflare is wrong; check server headers first.
