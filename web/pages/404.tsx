import Head from "next/head";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Compass, Sparkles } from "lucide-react";

export default function NotFoundPage() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <Head>
        <title>404 Not Found – Meadow App</title>
        <meta
          name="description"
          content="Page not found – Meadow Social Media App"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex min-h-screen flex-col overflow-x-hidden overflow-y-auto">
        <main className="page-shell flex flex-1 items-center justify-center">
          <section className="surface w-full max-w-xl px-8 py-12 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Lost in the feed
            </div>
            <h1 className="text-7xl font-bold tracking-tight gradient-text">
              404
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              This page is gone or moved. Jump back into your social stream.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground shadow-soft-xl"
            >
              <Compass className="h-4 w-4" />
              Back to Home
            </Link>
          </section>
        </main>
      </div>
    </ThemeProvider>
  );
}
