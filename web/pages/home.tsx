import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { InView } from "react-intersection-observer";
import PostCard from "@/components/post";
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
  getMyPosts,
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
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import { GetServerSidePropsContext } from "next";
import Image from "next/image";
import { z } from "zod";
import { Toaster, toast } from "sonner";

enum HomePageTab {
  FEED = "Feed",
  FOLLOWING = "Following",
  LIKED = "Liked",
  MINE = "Mine",
}

type HomePageProps = { user: User; profile: z.infer<typeof PostAuthor> };

function useRotatingTypewriter(
  lines: string[],
  typingSpeed = 70,
  deletingSpeed = 42,
  pauseMs = 1400,
) {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (lines.length === 0) return;

    const fullText = lines[lineIndex];
    const reachedEnd = text === fullText;
    const reachedStart = text.length === 0;
    let timeoutMs = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && reachedEnd) {
      timeoutMs = pauseMs;
    }

    const timer = setTimeout(() => {
      if (!isDeleting && reachedEnd) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && reachedStart) {
        setIsDeleting(false);
        setLineIndex((prev) => (prev + 1) % lines.length);
        return;
      }

      const nextLength = text.length + (isDeleting ? -1 : 1);
      setText(fullText.slice(0, nextLength));
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [text, isDeleting, lineIndex, lines, typingSpeed, deletingSpeed, pauseMs]);

  return text;
}

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
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(
    null,
  );
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarUrl = useMemo(() => {
    const key = profile?.avatar_url ?? "";
    if (!key) return undefined;
    return supabase.storage.from("avatars").getPublicUrl(key).data.publicUrl;
  }, [profile?.avatar_url, supabase]);
  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const rotatingHeadlines = useMemo(
    () => [
      "create your next moment.",
      "drop a take your crew feels.",
      "share a win that hits different.",
      "post something worth the scroll.",
    ],
    [],
  );
  const typedHeadline = useRotatingTypewriter(rotatingHeadlines);

  const fetchDataFn =
    activeTab === HomePageTab.FEED
      ? getFeed
      : activeTab === HomePageTab.FOLLOWING
        ? getFollowingFeed
        : activeTab === HomePageTab.LIKED
          ? getLikesFeed
          : getMyPosts;

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

  useEffect(() => {
    if (!selectedFile) {
      setSelectedFilePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setSelectedFilePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

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
      <main className="min-h-screen w-full text-foreground">
        <div className="page-shell max-w-4xl">
          <section className="surface mb-5 animate-fade-up p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Your Live Social Feed
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Hey {firstName},{" "}
                  <span className="gradient-text">{typedHeadline}</span>
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block text-primary/85 animate-pulse"
                  >
                    |
                  </span>
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Share ideas, drop updates, and keep your crew in the loop.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Curated for you
              </div>
            </div>
          </section>

          <Card
            id="create-post-section"
            className="animate-fade-up scroll-mt-24 border-border/70 bg-card/85"
          >
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">Create Post</CardTitle>
                {expandPostDraft ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Collapse composer"
                    aria-expanded={expandPostDraft}
                    className="rounded-full"
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
                    className="rounded-full"
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
                  <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <Avatar className="mt-1 flex-shrink-0">
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
                      className="h-28 flex-1"
                      placeholder="What's on your mind? Share your thoughts, ideas, or experiences with the world!"
                    />
                  </div>

                  {selectedFilePreview && (
                    <div className="pl-0 sm:pl-14">
                      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
                        <Image
                          src={selectedFilePreview}
                          alt="Selected image preview"
                          width={1200}
                          height={1200}
                          unoptimized
                          className="max-h-[360px] w-full object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Remove selected image"
                          className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5 text-foreground shadow"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pb-3">
                  <div className="flex w-full flex-wrap justify-end gap-3">
                    <Input
                      className="hidden"
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] ?? null);
                        e.currentTarget.value = "";
                      }}
                    />

                    {selectedFile ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-full"
                        onClick={() => setSelectedFile(null)}
                      >
                        <ImagePlus />
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
                        className="rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach image"
                      >
                        <ImagePlus />
                      </Button>
                    )}

                    <Button
                      className="rounded-full px-6"
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
                          <Send /> Post
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </>
            )}
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-6 w-full animate-fade-up"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
                <TabsTrigger value={HomePageTab.FEED}>Feed</TabsTrigger>
                <TabsTrigger value={HomePageTab.FOLLOWING}>
                  Following
                </TabsTrigger>
                <TabsTrigger value={HomePageTab.LIKED}>Liked</TabsTrigger>
                <TabsTrigger value={HomePageTab.MINE}>Mine</TabsTrigger>
              </TabsList>

              <Button
                variant="secondary"
                size="icon"
                className="self-end rounded-full sm:self-auto"
                onClick={refresh}
                aria-label="Refresh feed"
              >
                <RotateCcw />
              </Button>
            </div>
          </Tabs>

          <div className="mt-4 w-full space-y-4">
            {isInitialLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-foreground/70" />
              </div>
            ) : posts &&
              posts.pages.reduce((total, page) => total + page.length, 0) ===
                0 ? (
              <Card className="rounded-3xl p-8 text-center">
                <p className="text-lg font-semibold">No posts yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start the conversation by posting something first.
                </p>
              </Card>
            ) : (
              posts?.pages.map((page, pi) =>
                page.map((post, idx) => (
                  <Fragment key={post.id}>
                    <div className="w-full animate-fade-up">
                      <PostCard user={user} post={post} />
                    </div>

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
