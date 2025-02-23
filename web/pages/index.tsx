/**
 * This is the home page of the application, showing the feed of posts and
 * the ability to create new posts.
 *
 * This page is protected to only show to logged in users. If the user is not
 * logged in, they are redirected to the login page.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import PostFeed from "@/components/feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { PostAuthor } from "@/utils/supabase/models/post";
import {
  createPost,
  getFeed,
  getFollowingFeed,
  getLikesFeed,
} from "@/utils/supabase/queries/post";
import { getProfileData } from "@/utils/supabase/queries/profile";
import { User } from "@supabase/supabase-js";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import {
  ChevronsDown,
  ChevronsLeft,
  ImagePlus,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { useRef, useState } from "react";
import { z } from "zod";

// Define the tabs for the home page as a enum for easy comparisons.
enum HomePageTab {
  FEED = "Feed",
  FOLLOWING = "Following",
  LIKED = "Liked",
}

type HomePageProps = { user: User; profile: z.infer<typeof PostAuthor> };
export default function HomePage({ user, profile }: HomePageProps) {
  // Create necessary hooks for clients and providers.
  const queryClient = useQueryClient();
  const supabase = createSupabaseComponentClient();

  // Create state for the selected tab.
  const [activeTab, setActiveTab] = useState<string>(HomePageTab.FEED);

  // Create states for posting.
  const [expandPostDraft, setExpandPostDraft] = useState<boolean>(true);
  const [postDraftText, setPostDraftText] = useState<string>("");

  // Create states to handle selecting and uploading files.

  // The input ref points to the hidden HTML file input element that
  // can be "clicked" to open the file picker.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // The selected file is the file that the user has selected to upload.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Determine which data fetching function should be used in the post loader
  // based on the actively selected tab.
  const fetchDataFn =
    activeTab === HomePageTab.FEED
      ? getFeed
      : activeTab === HomePageTab.FOLLOWING
      ? getFollowingFeed
      : getLikesFeed;

  // Infinite query to fetch the posts from the server.
  // TODO:
  // Use the `useInfiniteQuery` hook to fetch the posts from the server.
  // - Make sure that the query key array includes the active tab so that
  //   the query is refetched when the tab changes.
  // - Ensure that you use the `getNextPageParam` function to determine
  //   the next page to fetch.
  //   See: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

  // NOTE: Replace the code below with your implementation - this dummy code is just to
  //       show the structure of the data and prevent type errors down the road. The
  //       final result of your `useInfiniteQuery` implementation should be:
  //       const { data: posts, fetchNextPage } = useInfiniteQuery({...})
  // -----------------------------------------------------------------------------------
  type Fake = {
    data: InfiniteData<z.infer<typeof PostAuthor>[]> | undefined;
    fetchNextPage: () => Promise<void>;
  };
  const { data: posts, fetchNextPage }: Fake = {
    data: undefined,
    fetchNextPage: async () => {},
  };
  // -----------------------------------------------------------------------------------

  // Function to hard refresh all React Query queries to get the latest data.
  // NOTE: This is not best practice. Later, we will use a tool talled `tRPC`
  // whose APIs make this a bit easier to do and also to follow.
  const refresh = () => {
    queryClient.resetQueries();
  };

  // Function to publish a post.
  // Publishing a post also should clear any post draft text, remove any selected
  // file, and hard refresh the feed.
  const publishPost = async () => {
    await createPost(supabase, user, postDraftText, selectedFile);
    setPostDraftText("");
    setSelectedFile(null);
    refresh();
  };

  return (
    <div className="flex flex-row justify-center w-full h-full">
      <div className="w-[600px] h-screen">
        {/* Write a Post Card */}
        <Card>
          <CardHeader className="pb-3 pt-3">
            <div className="flex flex-row items-center justify-between">
              <CardTitle>Write a Post</CardTitle>
              {expandPostDraft ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandPostDraft(false)}
                >
                  <ChevronsDown />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandPostDraft(true)}
                >
                  <ChevronsLeft />
                </Button>
              )}
            </div>
          </CardHeader>
          {/* Only show the body of the card if the post draft is expanded. */}
          {expandPostDraft && (
            <>
              <CardContent className="space-y-2 pb-3">
                <div className="flex flex-row w-full gap-3">
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
                  <Textarea
                    value={postDraftText}
                    onChange={(e) => setPostDraftText(e.target.value)}
                    className="h-28"
                    placeholder="Post your thoughts here!"
                  ></Textarea>
                </div>
              </CardContent>
              <CardFooter className="pb-3">
                <div className="flex flex-row gap-3 ml-auto">
                  {/* File inputs are handled here. */}
                  {/* 
                  This hidden input provides us the functionality to handle selecting
                  new  pages. This input only accepts images, and when a file is selected,
                  the file is stored in the `selectedFile` state.
                  */}
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
                  {selectedFile ? (
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedFile(null)}
                    >
                      <ImagePlus />
                      <p className="text-sm max-w-[300px] overflow-hidden text-ellipsis">
                        {selectedFile.name}
                      </p>
                      <X />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => {
                        if (fileInputRef && fileInputRef.current)
                          fileInputRef.current.click();
                      }}
                    >
                      <ImagePlus />
                    </Button>
                  )}
                  {/* The button to publish the post is only enabled when tex
                   has been entered into the text area. */}
                  <Button
                    onClick={publishPost}
                    disabled={postDraftText.length === 0}
                  >
                    <Send /> Post
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>

        {/* Display all three tabs for each feed + the refresh button. */}
        {/* Update the `activeTab` state when the tab changes. */}
        <Tabs
          value={activeTab.toString()}
          onValueChange={(tab) => setActiveTab(tab)}
          className="w-full mt-8"
        >
          <div className="flex flex-row w-100 gap-2">
            <TabsList className="grid w-full grid-cols-3 grow">
              <TabsTrigger value={HomePageTab.FEED}>Feed</TabsTrigger>
              <TabsTrigger value={HomePageTab.FOLLOWING}>Following</TabsTrigger>
              <TabsTrigger value={HomePageTab.LIKED}>Liked</TabsTrigger>
            </TabsList>
            <Button
              className="rounded-lg"
              variant="secondary"
              size="icon"
              onClick={refresh}
            >
              <RotateCcw />
            </Button>
          </div>
        </Tabs>

        {/* Scroll area containing the feed. */}
        <ScrollArea className="mt-4 h-[70vh] w-full rounded-xl border bg-card text-card-foreground shadow">
          <PostFeed user={user} posts={posts} fetchNext={fetchNextPage} />
        </ScrollArea>
      </div>
    </div>
  );
}

// The `getServerSideProps` function is used to fetch the user data and on
// the server side before rendering the page to both pre-load the Supabase
// user and profile data. If the user is not logged in, we can catch this
// here and redirect the user to the login page.
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Create the supabase context that works specifically on the server and
  // pass in the context.
  const supabase = createSupabaseServerClient(context);

  // Attempt to load the user data
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // If the user is not logged in, redirect them to the login page.
  if (userError || !userData) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Load the profile data
  const profile = await getProfileData(
    supabase,
    userData.user,
    userData.user.id
  );

  // Return the user and profile as props.
  return {
    props: {
      user: userData.user,
      profile: profile,
    },
  };
}
