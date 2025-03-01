/**
 * This is the signup page of the application, allowing users to register.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useQueryClient } from "@tanstack/react-query";
import { AtSign, Bird } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function SignUpPage() {
  // Create necessary hooks for clients and providers.
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();
  // Create states for each field in the form.
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");

  // TODO: (DONE) Handle the sign up request, alerting the user if there is
  // an error. If the signup is successful, the user must be
  // redirected to the home page. When signing up your user, you
  // should also include the `name` and `handle` fields in as extra
  // data that is processed when signing up. This allows Supabase
  // to create a row in the `profile` table with this data using the
  // *function* and *trigger* setup we had earlier. To do this, in the
  // object passed to the `signUp` method, you can add an `options` field
  // that contains `data` like so:
  //
  // ```ts
  // options: { data: { name, handle } }
  // ```
  //
  // Also, the `user_profile` query in React Query should hard refreshed
  // so that the header can correctly display newly logged-in user. Since
  // this is a bit hard to figure out, I will give you the line of code
  // that does this:
  //
  // ```ts
  // queryClient.resetQueries({ queryKey: ["user_profile"] });
  // ```
  //
  // This code calls on the global React Query client to reset the specific
  // query with the key `user_profile` that is found in the `header` component.

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
                  <Bird className="size-6" />
                </div>
              </a>
              <h1 className="text-xl font-bold">Welcome to Oriole!</h1>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Log in here!
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sample Name"
                  required
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
                />
              </div>
              <Button className="w-full" onClick={signUp}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
