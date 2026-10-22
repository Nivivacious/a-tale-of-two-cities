# A Tale of Two Cities

52 playing cards about Bangalore and New York, and two Jokers about the people who live in both.
*For anyone whose phone shows two clocks.*

A static site with three small Vercel functions. No build step.

## Put it live

1. On [vercel.com](https://vercel.com), choose **Add New → Project** and import this repo.
2. Set **Framework Preset** to **Other**. Leave the build command empty and the root as `./`. Click **Deploy**.
3. In the project, open **Storage → Upstash for Redis**, create a free database and connect it to the project. Then **redeploy**. The visitor count and the "Your turn" board start working.

## Optional settings (Project → Settings → Environment Variables)

| Name | What it does |
|---|---|
| `ADMIN_KEY` | Any long secret. Lets you read local-check notes and remove pairings (see below). |
| `RESEND_API_KEY` | From [resend.com](https://resend.com). Emails you each local-check note. |
| `FEEDBACK_TO` | The address those emails go to. It stays in Vercel's settings, never in this repo or the site. |
| `FEEDBACK_FROM` | Optional sender, once you've verified a domain in Resend. |

Read the latest notes:

```
curl -H "x-admin-key: YOUR_ADMIN_KEY" https://YOUR-SITE.vercel.app/api/feedback
```

See who wants the printed deck (the waitlist appears on the site once Redis is connected):

```
curl -H "x-admin-key: YOUR_ADMIN_KEY" https://YOUR-SITE.vercel.app/api/waitlist
```

Remove a pairing (the `key` is in the `/api/pairings` list):

```
curl -X DELETE -H "x-admin-key: YOUR_ADMIN_KEY" "https://YOUR-SITE.vercel.app/api/pairings?key=THE_KEY"
```

## What's where

- `source/`: everything the site is built from (cards, copy, sound, build scripts, design docs). Edit there, then run `node source/build-site.js`. Vercel skips this folder (see `.vercelignore`).

- `index.html`: the page
- `cards.js`, `deck/*.js`: every card, drawn in SVG
- `copy.js`: titles, lines and descriptions for every card
- `sound.js`: each card's soundtrack, made live in the browser
- `print/`: print-ready PDFs
- `api/`: visitor count, pairings and votes, local-check notes, the printed-deck waitlist
- `card/<id>.html`: one page per card. Shared links point here so each card gets its own preview, then the page opens the deck on that card
- `og/<id>.jpg`: those previews, one per card (made by `prototype/og-cards.js`)
- `404.html`: the wrong-turn page

## Kannada audio (Sarvam)

The speaker button by "Read in ಕನ್ನಡ" and the Kannada street voices in a few soundtracks play files made with Sarvam. With a key from dashboard.sarvam.ai:

```
SARVAM_API_KEY=your_key node source/sarvam.js
```

It writes `audio/` (54 line readings, 5 street voices) and `source/docs/kannada-check.md` (each Kannada line translated back to English, plus Sarvam's spoken-Kannada version, for the native-speaker check). The key is only used on your machine; it never goes in the site. Until the files exist, the button stays hidden and the soundtracks play as before.

## Link previews and your domain

Previews need full addresses, so the build writes them for `https://a-tale-of-two-cities-nine.vercel.app`. If the site moves to its own domain, rebuild with that address:

```
SITE_URL=https://your-domain.com node prototype/build-site.js
```
