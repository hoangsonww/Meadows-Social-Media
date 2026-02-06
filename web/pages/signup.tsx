import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { AtSign, Leaf, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const signUp = async () => {
    if (!email || !password || !name || !handle) {
      toast.error("Please fill out all fields!");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, handle },
      },
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user) {
      queryClient.resetQueries({ queryKey: ["user_profile"] });
      toast.success("Sign-up successful!");
      router.push("/home");
    } else {
      toast.error("Sign-up failed. Please try again.");
    }
  };

  return (
    <>
      <Toaster position="bottom-center" theme="system" richColors />
      <main
        className="
          flex min-h-screen min-h-[100svh] min-h-dvh w-full items-center justify-center
          overflow-x-hidden px-4 text-foreground
        "
      >
        <div className="relative w-full max-w-md overflow-x-hidden">
          <section
            className="
              relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-transparent p-5 shadow-none sm:p-7
            "
          >
            <div className="pointer-events-none absolute right-5 top-4 inline-flex items-center gap-1 rounded-full border border-border/70 bg-transparent px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Sign Up
            </div>
            <header className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-transparent text-primary shadow-none">
                <Leaf className="size-6" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome to Meadow!
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign up for an account to get started.
              </p>
            </header>

            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                signUp();
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
                  placeholder="email@example.com"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  className="bg-transparent shadow-none"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name" className="text-foreground">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  disabled={isLoading}
                  className="bg-transparent shadow-none"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="handle" className="text-foreground">
                  Handle
                </Label>
                <div className="relative">
                  <AtSign
                    className="absolute left-2 top-2.5 h-4 w-4 text-foreground/70 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="handle"
                    className="bg-transparent pl-8 shadow-none"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="ramses"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={isLoading}
                  />
                </div>
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
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                    className="bg-transparent pr-10 shadow-none"
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

              <Button
                type="submit"
                className="w-full shadow-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  "Sign Up"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Log in here!
                </Link>
              </p>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
