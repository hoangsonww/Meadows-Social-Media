import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    // Check if the email and password fields are filled out first
    // Validate on the client side before sending the request to the server
    if (!email || !password) {
      alert("Please enter both email and password!");
      return;
    }

    // Attempt to sign in with the provided email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle the response from the server
    if (error) {
      alert(error.message);
      return;
    }

    // If the user is successfully logged in, reset the user profile query
    // and redirect the user to the home page
    if (data.user) {
      queryClient.resetQueries({ queryKey: ["user_profile"] });
      router.push("/");
    } else {
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="flex  min-h-[calc(100svh-164px)] flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      logIn();
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      logIn();
                    }
                  }}
                />
              </div>
              <Button className="w-full" onClick={logIn}>
                Login
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
  );
}
