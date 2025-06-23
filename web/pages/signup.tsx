import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useQueryClient } from "@tanstack/react-query";
import { AtSign, Leaf, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { Toaster, toast } from "sonner";

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

  /**
   * This function handles the sign-up process for the user.
   * It checks if the email, name, handle, and password fields are filled out,
   * and if so, it attempts to sign up the user using Supabase's
   * authentication method. If the sign-up is successful, it resets
   * the user profile query and redirects the user to the home page.
   * If there is an error, it alerts the user with the error message.
   *
   * @returns - void
   */
  const signUp = async () => {
    // Check if the email and password fields are filled out first
    // Validate on the client side before sending the request to the server
    if (!email || !password || !name || !handle) {
      toast.error("Please fill out all fields!");
      return;
    }

    setIsLoading(true);

    // Attempt to sign up with the provided email and password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          handle,
        },
      },
    });

    setIsLoading(false);

    // Handle the response from the server
    if (error) {
      toast.error(error.message);
      return;
    }

    // If the user is successfully signed up, reset the user profile query
    // and redirect the user to the home page
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
                <h1 className="text-xl font-bold">Welcome to Meadow!</h1>
                <p className="text-sm text-center">
                  Sign up for an account to get started.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") signUp();
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Username"
                    required
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") signUp();
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="handle">Handle</Label>
                  <div className="relative">
                    <AtSign className="absolute left-2 top-2.5 h-4 w-4" />
                    <Input
                      id="handle"
                      className="pl-8"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="ramses"
                      required
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") signUp();
                      }}
                    />
                  </div>
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
                        if (e.key === "Enter") signUp();
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
                <Button
                  className="w-full"
                  onClick={signUp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    "Sign Up"
                  )}
                </Button>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Log in here!
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
