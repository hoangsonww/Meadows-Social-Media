/**
 * This page shows individual posts to the user based on its ID.
 *
 * This page is protected to only show to logged in users. If the user is not
 * logged in, they are redirected to the login page.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { useRouter } from "next/router";
import { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { getPost } from "@/utils/supabase/queries/post";
import PostCard from "@/components/post";
import { Card } from "@/components/ui/card";

type PostPageProps = { user: User };

export default function PostPage({ user }: PostPageProps) {
  // Create necessary hooks for clients and providers.
  const router = useRouter();
  const supabase = createSupabaseComponentClient();

  // Get the post ID to work with from the dynamic URL.
  const postId = router.query.id as string;

  // Fetch the data for the single post using the post ID.
  const { data: post } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      return await getPost(supabase, user, postId);
    },
  });

  return (
    <div className="flex flex-row justify-center w-full h-full">
      <div className="w-[600px] h-screen">
        <div className="pb-3">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft /> Back to Feed
          </Button>
        </div>
        {post && (
          <Card>
            <PostCard user={user} post={post} />
          </Card>
        )}
      </div>
    </div>
  );
}

// The `getServerSideProps` function is used to fetch the user data and on
// the server side before rendering the page to both pre-load the Supabase
// user data. If the user is not logged in, we can catch this here and
// redirect the user to the login page.
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  // Create the supabase context that works specifically on the server and
  // pass in the context.
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // If the user is not logged in, redirect them to the login page.
  if (userError || !userData) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  // Return the user as props.
  return {
    props: {
      user: userData.user,
    },
  };
}
