import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { Leaf, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logIn = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password!");
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user) {
      queryClient.resetQueries({ queryKey: ["user_profile"] });
      toast.success("Logged in successfully!");
      router.push("/home");
    } else {
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <>
      {/* Use system theme and richer colors so toast stays readable in dark mode */}
      <Toaster position="bottom-center" theme="system" richColors />
      <main
        className="
          flex min-h-screen min-h-[100svh] min-h-dvh w-full items-center justify-center
          px-4 text-foreground
        "
      >
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute -left-10 -top-8 h-28 w-28 rounded-full bg-primary/25 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
          <section
            className="
              relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 p-7 shadow-soft-xl backdrop-blur
            "
          >
            <div className="pointer-events-none absolute right-5 top-4 inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Login
            </div>
            <header className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft-xl">
                <Leaf className="size-6" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Log in to Meadow
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Welcome back! Log in to your account to continue.
              </p>
            </header>

            <form
              className="grid gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                logIn();
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  className="bg-card/80"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    className="bg-card/80 pr-10"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="
                      absolute inset-y-0 right-2 inline-flex items-center rounded-md p-1
                      text-foreground/70 hover:text-foreground focus:outline-none
                      focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      focus-visible:ring-offset-background
                    "
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Logging in…
                  </span>
                ) : (
                  "Login"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Sign up here!
                </Link>
              </p>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
