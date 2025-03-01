/**
 * The _app component is the top-level component wrapping all pages
 * in the application.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { ThemeProvider } from "@/components/theme/theme-provider";
import Header from "@/components/header";
import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import Head from "next/head";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {/* Head component for setting metadata */}
        <Head>
          <title>Oriole - The Social Media App</title>
          <meta name="description" content="Welcome to Oriole, the ultimate social media app!" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        
        {/* Here i modified overflow properties as I noticed that sometimes, the post 
            feed overflow and was hidden from view */}
        <div className="flex h-screen flex-col px-4 overflow-y-auto overflow-x-hidden">
          <Header />
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
