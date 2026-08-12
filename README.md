# Saleslights

Next.js (App Router, JSX, no TypeScript) rebuild of the Saleslights single-screen
site — same layout, type, colours, motion and copy as the original HTML.

No server, no API routes, no data fetching: `next build` emits a fully static
site to `out/` that can be dropped on any static host (Vercel, Netlify, S3,
GitHub Pages, nginx).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # static export -> ./out
npm run start      # serve ./out locally
```

## Structure

```
public/
  logo.avif             brand mark (header)
  nick-krause.png       portrait (Studio)
  brand/*.png           10 client logos for the rotating strip
  fonts/*.woff2         Instrument Sans, self-hosted
src/app/
  layout.js             <html> shell + metadata
  globals.css           font faces, base reset, keyframes, all component styles
  page.js               renders <SalesLights />
src/components/
  SalesLights.js        the whole site: nav, four views, intro motion
  SplitHeadline.js      measures real line breaks and reveals them line by line
  data.js               copy, services, brand list, external links
```

## The four views

`home`, `services`, `studio`, `contact` live in one screen and swap in place —
no routing. State is mirrored to the URL hash (`#services`) so a link or a
refresh lands on the right view. Arrow Left / Right also move between them.

## Motion

Everything is CSS-driven except two pieces of measured motion:

- **Home intro.** The headline is measured against `<main>`, parked at its
  centre with transitions off, held 1.5s, then transitioned back to its column
  position over 1.05s while the header, footer and body copy fade in behind it.
  It runs **every time** Home is shown — on load, on refresh, and on every
  return from another view.

  Two details keep it from breaking. The pre-intro state (headline hidden,
  chrome at `opacity: 0`) ships in the server-rendered HTML, because rendering
  the headline visible and hiding it after hydration makes it paint in the left
  column and then jump to centre once JS arrives. And a 400ms timer settles the
  page outright if the `requestAnimationFrame` chain never runs — frames don't
  run in a background tab, and a blank hero is far worse than a missed
  overture.
- **Headline reveal.** Each rendered line rises out of its own mask, staggered
  90ms. The lines aren't hardcoded: a hidden word-by-word copy is measured by
  `offsetTop` and consecutive words sharing a top become a line, so the split
  stays correct at any width and re-splits on resize. It waits for
  `document.fonts.ready` — measuring against fallback metrics would break the
  lines at the wrong words — and stays paused until the intro has parked the
  headline, so it never rises from the wrong position.

Below the hero, a hairline and one line of copy close the composition — without
them the hero floats as a thin band with an unoccupied lower half. The copy is
verbatim from the Studio view, so it makes no claim the site doesn't already
make. A short 34px rule marks the client strip as its own band; it is
deliberately a rule and not a label or an icon, since the strip beneath it is
already a row of small drawn marks and the site contains no other illustration.

The client strip is a continuous right-to-left marquee. The brand list is
rendered twice and the track travels `-50%` on a 58s linear loop, so copy two
lands exactly where copy one began and the seam never shows. Spacing sits on
each slot as `margin-right` rather than flex `gap` — with `gap` the track
measures `20 slots + 19 gaps`, which leaves `-50%` half a gap short of a whole
copy and the loop visibly jumps. Both ends are feathered with a `mask-image`
gradient, and it pauses on hover.

Page changes fade `<main>` out over 560ms, swap the view, then fade back in.

`prefers-reduced-motion` is honoured in both places: a blanket CSS rule
collapses every duration and delay, and the intro and headline reveal are
skipped in JS so nothing sits parked waiting for a transition that won't run.
