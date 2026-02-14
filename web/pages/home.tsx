import {
  ChangeEvent,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { TooltipHint } from "@/components/ui/tooltip-hint";
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
  AlertCircle,
  BarChart3,
  ChevronsDown,
  ChevronsUp,
  ImagePlus,
  Loader2,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  X,
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
const MAX_POST_IMAGES = 8;

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

export default function HomePage({ user, profile }: HomePageProps) {
  const queryClient = useQueryClient();
  const supabase = createSupabaseComponentClient();

  const [activeTab, setActiveTab] = useState<string>(HomePageTab.FEED);
  const [expandPostDraft, setExpandPostDraft] = useState<boolean>(true);
  const [postDraftText, setPostDraftText] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFilePreviews, setSelectedFilePreviews] = useState<string[]>(
    [],
  );
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
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

  const normalizedPollOptions = useMemo(
    () =>
      Array.from(
        new Set(
          pollOptions
            .map((option) => option.trim())
            .filter((option) => option.length > 0),
        ),
      ).slice(0, 4),
    [pollOptions],
  );
  const nonEmptyPollOptionCount = useMemo(
    () => pollOptions.filter((option) => option.trim().length > 0).length,
    [pollOptions],
  );
  const duplicatePollOptionCount = useMemo(
    () => Math.max(nonEmptyPollOptionCount - normalizedPollOptions.length, 0),
    [nonEmptyPollOptionCount, normalizedPollOptions.length],
  );
  const pollOptionsNeeded = useMemo(
    () => Math.max(0, 2 - normalizedPollOptions.length),
    [normalizedPollOptions.length],
  );

  const hasValidPoll = useMemo(
    () => !pollEnabled || normalizedPollOptions.length >= 2,
    [pollEnabled, normalizedPollOptions],
  );
  const pollStatusText = useMemo(() => {
    if (!pollEnabled) return null;
    if (normalizedPollOptions.length >= 2) {
      if (duplicatePollOptionCount > 0) {
        return `${normalizedPollOptions.length}/4 unique options ready. Duplicates count once.`;
      }
      return `${normalizedPollOptions.length}/4 unique options ready.`;
    }
    return `Add ${pollOptionsNeeded} more unique option${pollOptionsNeeded > 1 ? "s" : ""} to enable Post.`;
  }, [
    pollEnabled,
    normalizedPollOptions.length,
    duplicatePollOptionCount,
    pollOptionsNeeded,
  ]);
  const postDisabledReason = useMemo<string | null>(() => {
    if (isPosting) return "Posting in progress...";
    if (!postDraftText.trim()) return "Add a caption to unlock Post.";
    if (pollEnabled && !hasValidPoll) {
      return pollStatusText ?? "Fix poll options to enable Post.";
    }
    return null;
  }, [isPosting, postDraftText, pollEnabled, hasValidPoll, pollStatusText]);
  const showCaptionHint = !isPosting && !postDraftText.trim();
  const addImagesTooltip =
    selectedFiles.length >= MAX_POST_IMAGES
      ? `Maximum ${MAX_POST_IMAGES} images reached`
      : selectedFiles.length > 0
        ? `Add more images (${selectedFiles.length}/${MAX_POST_IMAGES})`
        : "Add images to your post";
  const addOptionTooltip =
    pollOptions.length >= 4
      ? "Maximum 4 poll options"
      : "Add another poll option";
  const postButtonTooltip = postDisabledReason ?? "Publish post";

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

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["posts"] });

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setSelectedFilePreviews([]);
      return;
    }

    const objectUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setSelectedFilePreviews(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const addPollOption = () => {
    setPollOptions((prev) => (prev.length >= 4 ? prev : [...prev, ""]));
  };

  const removePollOption = (index: number) => {
    setPollOptions((prev) =>
      prev.length <= 2 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) =>
      prev.map((option, i) => (i === index ? value : option)),
    );
  };

  const disablePollComposer = () => {
    setPollEnabled(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const handlePickImages = (event: ChangeEvent<HTMLInputElement>) => {
    const pickedFiles = Array.from(event.target.files ?? []);
    if (pickedFiles.length === 0) return;

    const availableSlots = Math.max(0, MAX_POST_IMAGES - selectedFiles.length);
    if (availableSlots === 0) {
      toast(`You can upload up to ${MAX_POST_IMAGES} images per post.`);
      event.currentTarget.value = "";
      return;
    }

    setSelectedFiles((prev) => [
      ...prev,
      ...pickedFiles.slice(0, availableSlots),
    ]);

    if (pickedFiles.length > availableSlots) {
      toast(`Only ${MAX_POST_IMAGES} images can be attached to one post.`);
    }

    event.currentTarget.value = "";
  };

  const publishPost = async () => {
    if (!postDraftText.trim()) return;

    if (pollEnabled && !hasValidPoll) {
      toast.error("Add at least two poll options.");
      return;
    }

    setIsPosting(true);

    try {
      await createPost(
        supabase,
        user,
        postDraftText,
        selectedFiles,
        pollEnabled
          ? {
              question: pollQuestion.trim() || null,
              options: normalizedPollOptions,
            }
          : null,
      );

      setPostDraftText("");
      setSelectedFiles([]);
      disablePollComposer();
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
                  <TooltipHint content="Collapse post composer">
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
                  </TooltipHint>
                ) : (
                  <TooltipHint content="Expand post composer">
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
                  </TooltipHint>
                )}
              </div>
            </CardHeader>

            {expandPostDraft && (
              <>
                <CardContent className="space-y-3 pb-3">
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

                  {selectedFilePreviews.length > 0 && (
                    <div className="pl-0 sm:pl-14">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {selectedFiles.length}/{MAX_POST_IMAGES} images selected
                      </p>
                      <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl border border-border/70 bg-muted/20 p-2 sm:grid-cols-3">
                        {selectedFilePreviews.map((previewUrl, index) => (
                          <div
                            key={`${previewUrl}-${index}`}
                            className="relative overflow-hidden rounded-xl"
                          >
                            <Image
                              src={previewUrl}
                              alt={`Selected image ${index + 1}`}
                              width={900}
                              height={900}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              aria-label={`Remove selected image ${index + 1}`}
                              title={`Remove image ${index + 1}`}
                              className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5 text-foreground shadow"
                              onClick={() => removeSelectedFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pollEnabled && (
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 sm:ml-14">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Quick Poll
                        </p>
                        <TooltipHint content="Remove poll from this post">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={disablePollComposer}
                            aria-label="Remove poll"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipHint>
                      </div>

                      <Input
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="Question (optional)"
                        className="mb-2"
                        maxLength={120}
                      />

                      <div className="space-y-2">
                        {pollOptions.map((option, index) => (
                          <div
                            key={`poll-option-${index}`}
                            className="flex gap-2"
                          >
                            <Input
                              value={option}
                              onChange={(e) =>
                                updatePollOption(index, e.target.value)
                              }
                              placeholder={`Option ${index + 1}`}
                              maxLength={60}
                            />
                            {pollOptions.length > 2 && (
                              <TooltipHint
                                content={`Remove option ${index + 1}`}
                              >
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="rounded-full"
                                  onClick={() => removePollOption(index)}
                                  aria-label={`Remove option ${index + 1}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipHint>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className={`text-xs ${
                            hasValidPoll
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {pollStatusText}
                        </span>
                        <TooltipHint content={addOptionTooltip}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                            onClick={addPollOption}
                            disabled={pollOptions.length >= 4}
                          >
                            <Plus className="h-4 w-4" /> Add option
                          </Button>
                        </TooltipHint>
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
                      multiple
                      onChange={handlePickImages}
                    />

                    <TooltipHint content={addImagesTooltip}>
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={selectedFiles.length >= MAX_POST_IMAGES}
                      >
                        <ImagePlus />
                        <span className="text-sm max-w-xs truncate">
                          {selectedFiles.length > 0
                            ? `Add more (${selectedFiles.length}/${MAX_POST_IMAGES})`
                            : "Add images"}
                        </span>
                      </Button>
                    </TooltipHint>
                    {selectedFiles.length > 0 && (
                      <TooltipHint content="Remove all selected images">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="rounded-full"
                          onClick={() => setSelectedFiles([])}
                          aria-label="Remove all selected images"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipHint>
                    )}

                    <TooltipHint
                      content={
                        pollEnabled
                          ? "Remove poll from this post"
                          : "Add a quick poll to this post"
                      }
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-full"
                        onClick={() => {
                          if (pollEnabled) {
                            disablePollComposer();
                          } else {
                            setPollEnabled(true);
                          }
                        }}
                      >
                        <BarChart3 />
                        {pollEnabled ? "Remove poll" : "Add poll"}
                      </Button>
                    </TooltipHint>

                    <TooltipHint content={postButtonTooltip}>
                      <Button
                        className="rounded-full px-6"
                        onClick={publishPost}
                        disabled={Boolean(postDisabledReason)}
                        aria-busy={isPosting}
                      >
                        {isPosting ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="animate-spin h-5 w-5" />
                            Posting...
                          </span>
                        ) : (
                          <>
                            <Send /> Post
                          </>
                        )}
                      </Button>
                    </TooltipHint>
                    {postDisabledReason && (
                      <div className="w-full">
                        {showCaptionHint && (
                          <p className="ml-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Add a caption to unlock Post
                          </p>
                        )}
                      </div>
                    )}
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
