import './globals.css';

export const metadata = {
  title: 'Saleslights',
  description:
    'Saleslights is a New York based growth consultancy for teams that need pipeline, not advice. We build the go to market machine, run it, and report on it every week.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* The latin cut serves both weights the site uses. Preloading it means
            the 56px headline never paints in the fallback face and reflows. */}
        <link
          rel="preload"
          href="/fonts/instrument-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* The headline ships hidden so it can't paint in the wrong place before
            the intro runs. Without JS that intro never comes, so give it back. */}
        <noscript>
          <style>{`[data-reveal='on'] .sl-h1-plain{visibility:visible}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
