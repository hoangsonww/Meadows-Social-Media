import { Fragment, useMemo, useRef, useState } from "react";
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
  ChevronsUp,
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

  const avatarUrl = useMemo(() => {
    const key = profile?.avatar_url ?? "";
    if (!key) return undefined;
    return supabase.storage.from("avatars").getPublicUrl(key).data.publicUrl;
  }, [profile?.avatar_url, supabase]);

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

  const refresh = () =>
    // more targeted than resetQueries()
    queryClient.invalidateQueries({ queryKey: ["posts"] });

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
      <Toaster position="bottom-center" theme="system" richColors />
      <main className="flex min-h-screen min-h-[100svh] min-h-dvh w-full items-start justify-center bg-background text-foreground">
        <div className="w-full max-w-3xl px-4 sm:px-6 py-4 sm:py-6">
          {/* Post draft card */}
          <Card className="rounded-3xl transition-all ease-in-out duration-300 hover:shadow-md mt-2 border-border bg-card text-card-foreground">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="transition-colors ease-in-out duration-300">
                  Write a Post
                </CardTitle>
                {expandPostDraft ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Collapse composer"
                    aria-expanded={expandPostDraft}
                    className="transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                    onClick={() => setExpandPostDraft(false)}
                  >
                    <ChevronsUp />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Expand composer"
                    aria-expanded={expandPostDraft}
                    className="transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                    onClick={() => setExpandPostDraft(true)}
                  >
                    <ChevronsDown />
                  </Button>
                )}
              </div>
            </CardHeader>

            {expandPostDraft && (
              <>
                <CardContent className="space-y-2 pb-3">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Avatar className="mt-1 flex-shrink-0 rounded-full">
                      <AvatarImage
                        src={avatarUrl}
                        alt={profile?.name ?? "User"}
                      />
                      <AvatarFallback className="bg-muted text-foreground/90">
                        {(profile?.name ?? "??").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <Textarea
                      value={postDraftText}
                      onChange={(e) => setPostDraftText(e.target.value)}
                      className="
                        flex-1 h-28 rounded-2xl
                        bg-background text-foreground placeholder:text-foreground/60
                        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                        focus-visible:ring-offset-background
                      "
                      placeholder="What's on your mind? Share your thoughts, ideas, or experiences with the world!"
                    />
                  </div>
                </CardContent>

                <CardFooter className="pb-3">
                  <div className="flex flex-wrap gap-3 justify-end w-full">
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
                        type="button"
                        variant="secondary"
                        className="rounded-3xl transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                        onClick={() => setSelectedFile(null)}
                      >
                        <ImagePlus className="mr-2" />
                        <span className="text-sm max-w-xs truncate">
                          {selectedFile.name}
                        </span>
                        <X className="ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="rounded-3xl transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach image"
                      >
                        <ImagePlus />
                      </Button>
                    )}

                    <Button
                      className="rounded-3xl transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                      onClick={publishPost}
                      disabled={!postDraftText.trim() || isPosting}
                      aria-busy={isPosting}
                    >
                      {isPosting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="animate-spin h-5 w-5" />
                          Posting…
                        </span>
                      ) : (
                        <>
                          <Send className="mr-2" /> Post
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
            className="w-full mt-6"
          >
            <div className="flex items-center justify-between gap-2">
              <TabsList
                className="
                  grid grid-cols-3 flex-1 rounded-lg border border-border
                  bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/25
                "
              >
                <TabsTrigger
                  value={HomePageTab.FEED}
                  className="
                    transition-colors duration-200
                    data-[state=active]:bg-card data-[state=active]:text-foreground
                    data-[state=active]:shadow-sm
                  "
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger
                  value={HomePageTab.FOLLOWING}
                  className="
                    transition-colors duration-200
                    data-[state=active]:bg-card data-[state=active]:text-foreground
                    data-[state=active]:shadow-sm
                  "
                >
                  Following
                </TabsTrigger>
                <TabsTrigger
                  value={HomePageTab.LIKED}
                  className="
                    transition-colors duration-200
                    data-[state=active]:bg-card data-[state=active]:text-foreground
                    data-[state=active]:shadow-sm
                  "
                >
                  Liked
                </TabsTrigger>
              </TabsList>

              <Button
                variant="secondary"
                size="icon"
                className="rounded-full transition-transform ease-in-out duration-300 hover:scale-[1.02]"
                onClick={refresh}
                aria-label="Refresh feed"
              >
                <RotateCcw />
              </Button>
            </div>
          </Tabs>

          {/* Posts list */}
          <div className="mt-4 space-y-6 w-full">
            {isInitialLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-foreground/70" />
              </div>
            ) : (
              posts?.pages.map((page, pi) =>
                page.map((post, idx) => (
                  <Fragment key={post.id}>
                    <div className="w-full rounded-3xl transition-all ease-in-out duration-300 hover:shadow-lg">
                      <PostCard user={user} post={post} />
                    </div>

                    <Separator className="bg-border" />

                    {pi === posts.pages.length - 1 &&
                      idx === page.length - 1 &&
                      hasNextPage && (
                        <InView
                          rootMargin="200px 0px"
                          onChange={(inView) => inView && fetchNextPage()}
                        />
                      )}
                  </Fragment>
                )),
              )
            )}

            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin h-6 w-6 text-foreground/70" />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

/**
 * getServerSideProps fetches user and profile before rendering.
 */
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
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
