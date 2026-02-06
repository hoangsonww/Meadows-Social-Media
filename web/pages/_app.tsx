import { useEffect } from "react";
import { useRouter } from "next/router";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { useTheme } from "next-themes";
import Header from "@/components/header";
import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import BackToTopButton from "@/components/BackToTopButton";
import Footer from "@/components/footer";

const queryClient = new QueryClient();

function MetaUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      // use resolvedTheme to pick up system/light/dark changes immediately
      meta.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#0b1628" : "#f1f9ff",
      );
    }
  }, [resolvedTheme]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLanding = router.pathname === "/";

  return (
    <QueryClientProvider client={queryClient}>
      <Analytics />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <Head>
          {/* Primary Meta Tags */}
          <meta charSet="UTF-8" />
          <title>Meadows – The Social Media for Gen-Z</title>
          <meta
            name="description"
            content="Welcome to Meadows, the ultimate social media app for Gen-Z: share, connect, and discover with your peers."
          />
          <meta name="author" content="Meadows Team" />
          <meta
            name="keywords"
            content="meadows, social media, gen-z, connect, share"
          />
          <meta name="robots" content="index, follow" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          {/* Favicon & App Icons */}
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
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#4F46E5" />
          <meta name="msapplication-TileColor" content="#4F46E5" />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://meadows.vercel.app/" />
          <meta
            property="og:title"
            content="Meadows – The Social Media for Gen-Z"
          />
          <meta property="og:site_name" content="Meadows" />
          <meta
            property="og:description"
            content="Welcome to Meadows, the ultimate social media app for Gen-Z: share, connect, and discover with your peers."
          />
          <meta
            property="og:image"
            content="https://meadows.vercel.app/android-chrome-512x512.png"
          />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@MeadowsApp" />
          <meta name="twitter:creator" content="@MeadowsTeam" />
          <meta
            name="twitter:title"
            content="Meadows – The Social Media for Gen-Z"
          />
          <meta
            name="twitter:description"
            content="Welcome to Meadows, the ultimate social media app for Gen-Z: share, connect, and discover with your peers."
          />
          <meta
            name="twitter:image"
            content="https://meadows.vercel.app/android-chrome-512x512.png"
          />

          {/* Canonical */}
          <link rel="canonical" href="https://meadows.vercel.app/" />
        </Head>

        {/* dynamically update theme-color as soon as theme toggles */}
        <MetaUpdater />

        <div className="flex min-h-screen flex-col overflow-x-hidden">
          {/* only show on non-landing pages */}
          {!isLanding && <Header />}

          <main className="relative flex-1 overflow-y-auto">
            <Component {...pageProps} />
          </main>
          {!isLanding && <Footer />}
        </div>
        <BackToTopButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
