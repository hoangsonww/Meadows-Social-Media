import { Fragment, useRef, useState } from "react";
import { InView } from "react-intersection-observer";
import PostCard from "@/components/post";
import { Separator } from "@/components/ui/separator";
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
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronsDown,
  ChevronsLeft,
  ImagePlus,
  RotateCcw,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { z } from "zod";
import { Toaster, toast } from "sonner";

enum HomePageTab {
  FEED = "Feed",
  FOLLOWING = "Following",
  LIKED = "Liked",
}

type HomePageProps = { user: User; profile: z.infer<typeof PostAuthor> };

/**
 * HomePage component renders the post creation UI and inline infinite-scrolling posts,
 * with smooth hover effects, animations, full-width layout, and enhanced border radius.
 */
export default function HomePage({ user, profile }: HomePageProps) {
  const queryClient = useQueryClient();
  const supabase = createSupabaseComponentClient();

  const [activeTab, setActiveTab] = useState<string>(HomePageTab.FEED);
  const [expandPostDraft, setExpandPostDraft] = useState<boolean>(true);
  const [postDraftText, setPostDraftText] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDataFn =
    activeTab === HomePageTab.FEED
      ? getFeed
      : activeTab === HomePageTab.FOLLOWING
        ? getFollowingFeed
        : getLikesFeed;

  const {
    data: posts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInitialLoading,
  } = useInfiniteQuery({
    queryKey: ["posts", activeTab],
    queryFn: async ({ pageParam = 0 }) =>
      fetchDataFn(supabase, user, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 25) return undefined;
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
    initialPageParam: 0,
  });

  const refresh = () => queryClient.resetQueries();

  const publishPost = async () => {
    if (!postDraftText.trim()) return;
    setIsPosting(true);
    try {
      await createPost(supabase, user, postDraftText, selectedFile);
      setPostDraftText("");
      setSelectedFile(null);
      refresh();
      toast.success("Post published!");
    } catch {
      toast.error("Failed to publish post.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <Toaster position="bottom-center" />
      <div className="scroll-smooth flex flex-col items-center w-full min-h-screen px-4">
        <div className="w-full mb-8">
          {/* Post draft card */}
          <Card className="rounded-3xl transition-all ease-in-out duration-300 hover:shadow-md hover:scale-[1.02] mt-4">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="transition-colors ease-in-out duration-300 hover:text-primary">
                  Write a Post
                </CardTitle>
                {expandPostDraft ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                    onClick={() => setExpandPostDraft(false)}
                  >
                    <ChevronsDown />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                    onClick={() => setExpandPostDraft(true)}
                  >
                    <ChevronsLeft />
                  </Button>
                )}
              </div>
            </CardHeader>
            {expandPostDraft && (
              <>
                <CardContent className="space-y-2 pb-3">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Avatar className="mt-1 flex-shrink-0 rounded-full transition-transform ease-in-out duration-300 hover:scale-[1.02]">
                      <AvatarImage
                        src={
                          supabase.storage
                            .from("avatars")
                            .getPublicUrl(profile.avatar_url ?? "").data
                            .publicUrl
                        }
                      />
                      <AvatarFallback>
                        {profile.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      value={postDraftText}
                      onChange={(e) => setPostDraftText(e.target.value)}
                      className="flex-1 h-28 rounded-2xl transition-shadow ease-in-out duration-300 focus:shadow-outline"
                      placeholder="What's on your mind? Share your thoughts, ideas, or experiences with the world!"
                    />
                  </div>
                </CardContent>
                <CardFooter className="pb-3">
                  <div className="flex flex-wrap gap-3 justify-end">
                    <Input
                      className="hidden"
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] ?? null)
                      }
                    />
                    {selectedFile ? (
                      <Button
                        variant="secondary"
                        className="rounded-3xl transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                        onClick={() => setSelectedFile(null)}
                      >
                        <ImagePlus />
                        <p className="text-sm max-w-xs truncate">
                          {selectedFile.name}
                        </p>
                        <X />
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-3xl transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus />
                      </Button>
                    )}
                    <Button
                      className="rounded-3xl transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                      onClick={publishPost}
                      disabled={!postDraftText.trim() || isPosting}
                    >
                      {isPosting ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                      ) : (
                        <>
                          <Send /> Post
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </>
            )}
          </Card>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mt-8"
          >
            <div className="flex items-center justify-between gap-2">
              <TabsList className="grid grid-cols-3 flex-1 rounded-lg">
                <TabsTrigger
                  value={HomePageTab.FEED}
                  className="transition-colors ease-in-out duration-300 hover:text-primary"
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger
                  value={HomePageTab.FOLLOWING}
                  className="transition-colors ease-in-out duration-300 hover:text-primary"
                >
                  Following
                </TabsTrigger>
                <TabsTrigger
                  value={HomePageTab.LIKED}
                  className="transition-colors ease-in-out duration-300 hover:text-primary"
                >
                  Liked
                </TabsTrigger>
              </TabsList>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                onClick={refresh}
              >
                <RotateCcw />
              </Button>
            </div>
          </Tabs>

          {/* Posts list */}
          <div className="mt-4 space-y-6 w-full">
            {isInitialLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              posts?.pages.map((page, pi) =>
                page.map((post, idx) => (
                  <Fragment key={post.id}>
                    <div className="w-full rounded-3xl transition-all ease-in-out duration-300 hover:shadow-md hover:scale-[1.02]">
                      <PostCard user={user} post={post} />
                    </div>
                    <Separator className="transition-colors ease-in-out duration-300 hover:bg-muted-foreground" />
                    {pi === posts.pages.length - 1 &&
                      idx === page.length - 1 &&
                      hasNextPage && (
                        <InView
                          onChange={(inView) => inView && fetchNextPage()}
                        />
                      )}
                  </Fragment>
                )),
              )
            )}

            {/* Spinner for infinite-fetch */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * getServerSideProps fetches user and profile before rendering.
 */
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const profile = await getProfileData(
    supabase,
    userData.user,
    userData.user.id,
  );

  return {
    props: { user: userData.user, profile },
  };
}
