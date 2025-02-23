/**
 * This page shows profiles to the user based on its ID. If the profile page
 * is the user's own page, they can change their profile picture.
 *
 * This page is protected to only show to logged in users. If the user is not
 * logged in, they are redirected to the login page.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Bell, BellOff, ImageOff, ImageUp } from "lucide-react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import {
  getFollowing,
  getProfileData,
  getProfilePosts,
  toggleFollowing,
  updateProfilePicture,
} from "@/utils/supabase/queries/profile";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { useRouter } from "next/router";
import { User } from "@supabase/supabase-js";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import PostFeed from "@/components/feed";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type PublicProfilePageProps = { user: User };

export default function PublicProfilePage({ user }: PublicProfilePageProps) {
  // Create necessary hooks for clients and providers.
  const router = useRouter();
  const profileId = router.query.id as string;
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();

  // Load the profile data using the profile ID.
  const { data: profile } = useQuery({
    queryKey: ["profile", profileId],
    queryFn: async () => {
      return await getProfileData(supabase, user, profileId);
    },
  });

  // Create a state to determine if the user is following the profile.
  // This will be updated optimistically when the user clicks the follow button,
  // meaning that the user will not have to wait for the server to respond to
  // see the change on the UI.
  const [isFollowing, setIsFollowing] = useState<boolean | undefined>(
    undefined
  );

  // Set up a useEffect that sets the initial value of the `isFollowing` state
  // when the component loads for the first time.
  useEffect(() => {
    getFollowing(supabase, user).then((following) => {
      const isFollowing = following.some((follow) => follow.id === profileId);
      setIsFollowing(isFollowing);
    });
  }, [supabase, user, profileId]);

  // Infinite query to fetch the user's posts from the server.
  const { data: posts, fetchNextPage: fetchNextPage } = useInfiniteQuery({
    queryKey: ["profile_posts", profileId],
    queryFn: async ({ pageParam = 0 }) => {
      return await getProfilePosts(supabase, user, profileId, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => pages.length * lastPage.length,
  });

  // Handle the follow button press. This will both call to update the
  // database as well as optimistically update the UI to reflect the new state.
  const followButtonPressed = async () => {
    await toggleFollowing(supabase, user, profileId);
    setIsFollowing(!isFollowing);
  };

  // Check if the profile is the user's own profile.
  const isPersonalPage = user.id === profileId;

  // The input ref points to the hidden HTML file input element that
  // can be "clicked" to open the file picker.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // The selected file is the file that the user has selected to upload.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // When the user selects a file, we will upload it to Supabase and update
  // the profile picture. This will also optimistically update the UI
  // to reflect the new profile picture.
  // The `queryClient.resetQueries()` call will refresh the profile data
  // so that the new profile picture is displayed.
  useEffect(() => {
    if (selectedFile) {
      updateProfilePicture(supabase, user, selectedFile).then(() => {
        setSelectedFile(null);
        queryClient.resetQueries();
      });
    }
  }, [queryClient, selectedFile, supabase, user]);

  return (
    <div className="flex flex-row justify-center w-full h-full">
      <div className="w-[600px] h-screen">
        <div className="pb-3">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft /> Back to Feed
          </Button>
        </div>
        {profile && (
          <Card>
            <CardContent className="space-y-2 py-6">
              <div className="flex flex-row w-full gap-3 items-center justify-between">
                <div className="flex flex-row gap-3 items-center">
                  <Avatar className="mt-1">
                    <AvatarImage
                      src={
                        supabase.storage
                          .from("avatars")
                          .getPublicUrl(profile.avatar_url ?? "").data.publicUrl
                      }
                    />
                    <AvatarFallback>
                      {profile.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <p className="text-primary font-bold">{profile.name}</p>

                  <p className="ml-3 text-muted-foreground">
                    @{profile.handle}
                  </p>
                </div>
                {!isPersonalPage && isFollowing !== undefined && (
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={followButtonPressed}
                  >
                    {isFollowing ? <BellOff /> : <Bell />}{" "}
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
                {isPersonalPage &&
                  (profile.avatar_url ? (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => {
                        updateProfilePicture(supabase, user, null);
                      }}
                    >
                      <ImageOff />
                    </Button>
                  ) : (
                    <>
                      <Input
                        className="hidden"
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) =>
                          setSelectedFile(
                            (e.target.files ?? []).length > 0
                              ? e.target.files![0]
                              : null
                          )
                        }
                      />
                      <Button
                        onClick={() => {
                          if (fileInputRef && fileInputRef.current)
                            fileInputRef.current.click();
                        }}
                      >
                        <ImageUp /> Change Avatar
                      </Button>
                    </>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
        <ScrollArea className="mt-4 h-[80vh] w-full rounded-xl border bg-card text-card-foreground shadow">
          <div className="flex flex-row items-center justify-between px-3 py-4">
            <p className="text-lg font-bold">
              {isPersonalPage ? "Your" : `${profile?.name}'s`} Recent Posts
            </p>
          </div>
          <Separator />
          <PostFeed user={user} posts={posts} fetchNext={fetchNextPage} />
        </ScrollArea>
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
