import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { Toaster, toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * This function handles the login process for the user.
   * It checks if the email and password fields are filled out,
   * and if so, it attempts to sign in the user using Supabase's
   * authentication method. If the login is successful, it resets
   * the user profile query and redirects the user to the home page.
   * If there is an error, it alerts the user with the error message.
   *
   * @returns - void
   */
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
      <Toaster position="bottom-center" />
      <div className="flex min-h-[calc(100svh-164px)] flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2">
                <a
                  href="#"
                  className="flex flex-col items-center gap-2 font-medium"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md">
                    <Leaf className="size-6" />
                  </div>
                </a>
                <h1 className="text-xl font-bold">Log in to Meadow</h1>
                <p className="text-sm text-center">
                  Welcome back! Log in to your account to continue.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m@example.com"
                    required
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") logIn();
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pr-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") logIn();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center p-1 text-muted-foreground hover:text-primary"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <Button className="w-full" onClick={logIn} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    "Login"
                  )}
                </Button>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="underline underline-offset-4">
                    Sign up here!
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
