import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useQueryClient } from "@tanstack/react-query";
import { AtSign, Leaf } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");

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
      alert("Please fill out all fields!");
      return;
    }

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

    // Handle the response from the server
    if (error) {
      alert(error.message);
      return;
    }

    // If the user is successfully signed up, reset the user profile query
    // and redirect the user to the home page
    if (data.user) {
      queryClient.resetQueries({ queryKey: ["user_profile"] });
      router.push("/");
    } else {
      alert("Sign-up failed. Please try again.");
    }
  };

  return (
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      signUp();
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Username"
                  required
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      signUp();
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Handle</Label>
                <div className="relative">
                  <AtSign className="absolute left-2 top-2.5 h-4 w-4" />
                  <Input
                    className="pl-8"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="ramses"
                    required
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        signUp();
                      }
                    }}
                  />
                </div>
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
                      signUp();
                    }
                  }}
                />
              </div>
              <Button className="w-full" onClick={signUp}>
                Sign Up
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
  );
}
