import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Primary Meta Tags */}
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta
            name="description"
            content="Meadows – share, connect, and discover with your peers in a stylish Gen‑Z social feed built with Next.js and Supabase."
          />
          <meta name="author" content="Meadows Team" />
          <meta
            name="keywords"
            content="Meadows, social media, Gen-Z, Next.js, Supabase, React Query"
          />

          {/* PWA Manifest & Theme Colors */}
          <link rel="manifest" href="/manifest.json" />

          {/* Icons */}
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="192x192"
            href="/android-chrome-192x192.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="512x512"
            href="/android-chrome-512x512.png"
          />
          <link rel="shortcut icon" href="/favicon.ico" />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta
            property="og:title"
            content="Meadows – The Social Media for Gen‑Z"
          />
          <meta
            property="og:description"
            content="Share, connect, and discover with your peers in a stylish Gen‑Z social feed built with Next.js and Supabase."
          />
          <meta property="og:url" content="https://meadows.vercel.app/" />
          <meta
            property="og:image"
            content="https://meadows.vercel.app/android-chrome-512x512.png"
          />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="Meadows – The Social Media for Gen‑Z"
          />
          <meta
            name="twitter:description"
            content="Share, connect, and discover with your peers in a stylish Gen‑Z social feed built with Next.js and Supabase."
          />
          <meta
            name="twitter:image"
            content="https://meadows.vercel.app/android-chrome-512x512.png"
          />

          {/* Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body className="antialiased bg-white text-gray-900">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
