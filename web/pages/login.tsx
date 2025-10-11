import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { Leaf, Loader2, Eye, EyeOff } from "lucide-react";

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
          bg-background text-foreground
        "
      >
        <div className="w-full max-w-md px-4 sm:px-6">
          <section
            className="
              rounded-2xl border border-border bg-background/95 p-6 shadow-sm backdrop-blur
              supports-[backdrop-filter]:bg-background/80
            "
          >
            <header className="mb-6 flex flex-col items-center text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-foreground/10 text-foreground">
                <Leaf className="size-6" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Log in to Meadow
              </h1>
              <p className="mt-1 text-sm text-foreground/80">
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
                  className="
                    bg-background text-foreground placeholder:text-foreground/60
                    border-input ring-offset-background
                  "
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
                    className="
                      pr-10 bg-background text-foreground placeholder:text-foreground/60
                      border-input ring-offset-background
                    "
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

              <p className="text-center text-sm text-foreground/80">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="underline underline-offset-4 text-primary"
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
