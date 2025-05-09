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
        <Head>
          <title>Meadow - The Social Media App</title>
          <meta
            name="description"
            content="Welcome to Meadow, the ultimate social media app!"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className="flex h-screen flex-col px-0 overflow-y-auto overflow-x-hidden">
          <Header />
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
