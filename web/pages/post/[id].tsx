import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Clock3,
  Mail,
  Maximize2,
  Copy,
  Heart,
  Bookmark,
  Loader2,
  Printer,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import {
  getPost,
  setPostVibe,
  toggleLike,
  PostVibe,
  voteOnPostPoll,
} from "@/utils/supabase/queries/post";
import { PostVibeValue } from "@/utils/supabase/models/post";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { User } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { TooltipHint } from "@/components/ui/tooltip-hint";
import { z } from "zod";

type PostPageProps = { user: User };

const vibeOptions: {
  value: z.infer<typeof PostVibeValue>;
  label: string;
  emoji: string;
}[] = [
  { value: "aura_up", label: "Aura Up", emoji: "A+" },
  { value: "real", label: "Real", emoji: "100" },
  { value: "mood", label: "Mood", emoji: "MOOD" },
  { value: "chaotic", label: "Chaotic", emoji: "CHAOS" },
];

function PostImageGallery({
  imageUrls,
  onImageClick,
}: {
  imageUrls: string[];
  onImageClick: (index: number) => void;
}) {
  if (imageUrls.length === 0) {
    return null;
  }

  if (imageUrls.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
        <button
          type="button"
          className="group relative block w-full cursor-zoom-in overflow-hidden"
          aria-label="View image in fullscreen"
          onClick={() => onImageClick(0)}
        >
          <Image
            src={imageUrls[0]}
            alt="Post image"
            width={1200}
            height={1200}
            className="max-h-[760px] w-full object-cover transition duration-300 group-hover:scale-[1.02] group-hover:brightness-[0.93]"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition duration-200 group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </span>
        </button>
      </div>
    );
  }

  const visibleImages = imageUrls.slice(0, 6);
  const extraCount = imageUrls.length - visibleImages.length;

  return (
    <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl border border-border/70 bg-muted/20 p-2 sm:grid-cols-3">
      {visibleImages.map((imageUrl, index) => (
        <button
          type="button"
          key={`${imageUrl}-${index}`}
          aria-label={`View image ${index + 1} in fullscreen`}
          onClick={() => onImageClick(index)}
          className={`group relative overflow-hidden rounded-xl border border-transparent transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 hover:border-white/35 ${
            imageUrls.length === 3 && index === 0
              ? "col-span-2 aspect-[16/9] sm:col-span-3"
              : "aspect-square"
          }`}
        >
          <Image
            src={imageUrl}
            alt={`Post image ${index + 1}`}
            width={900}
            height={900}
            className="h-full w-full cursor-zoom-in object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-[0.9]"
          />
          <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full border border-white/35 bg-black/50 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition duration-200 group-hover:opacity-100">
            <Maximize2 className="h-3 w-3" />
            Expand
          </span>
          {extraCount > 0 && index === visibleImages.length - 1 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="text-lg font-bold text-white">
                +{extraCount}
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export default function PostPage({ user }: PostPageProps) {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();
  const postId = router.query.id as string;

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => await getPost(supabase, user, postId),
    enabled: !!postId,
  });

  const [bookmarked, setBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [vibes, setVibes] = useState(
    post?.vibes ??
      ([] as {
        profile_id: string;
        vibe: z.infer<typeof PostVibeValue>;
      }[]),
  );
  const [poll, setPoll] = useState(post?.poll ?? null);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    if (!postId) return;
    const list = JSON.parse(localStorage.getItem("bookmarkedPosts") || "[]");
    setBookmarked(list.includes(postId));
  }, [postId]);

  useEffect(() => {
    if (!post) return;
    const likedByUser = post.likes.some((like) => like.profile_id === user.id);
    setIsLiked(likedByUser);
    setLikeCount(post.likes.length);
    setVibes(post.vibes);
    setPoll(post.poll);
  }, [post, user.id]);

  const postImageUrls = useMemo(() => {
    if (!post) return [];

    const attachmentPaths = [...post.attachments]
      .sort((a, b) => a.position - b.position)
      .map((attachment) => attachment.path)
      .filter((path) => path.length > 0);

    const fallbackPaths =
      attachmentPaths.length > 0
        ? attachmentPaths
        : post.attachment_url
          ? [post.attachment_url]
          : [];

    return fallbackPaths.map(
      (path) =>
        supabase.storage.from("images").getPublicUrl(path).data.publicUrl,
    );
  }, [post, supabase]);
  const activeImageUrl =
    activeImageIndex === null
      ? null
      : (postImageUrls[activeImageIndex] ?? null);

  const sortedPollOptions = useMemo(
    () =>
      poll ? [...poll.options].sort((a, b) => a.position - b.position) : [],
    [poll],
  );

  const myPollVoteOptionId = useMemo(
    () =>
      sortedPollOptions.find((option) =>
        option.votes.some((vote) => vote.profile_id === user.id),
      )?.id ?? null,
    [sortedPollOptions, user.id],
  );

  const pollVoteTotal = useMemo(
    () =>
      sortedPollOptions.reduce((sum, option) => sum + option.votes.length, 0),
    [sortedPollOptions],
  );

  const myVibe = useMemo(
    () => vibes.find((entry) => entry.profile_id === user.id)?.vibe ?? null,
    [vibes, user.id],
  );

  const vibeStats = useMemo(() => {
    const counts = Object.fromEntries(
      vibeOptions.map((opt) => [opt.value, 0]),
    ) as Record<z.infer<typeof PostVibeValue>, number>;

    vibes.forEach((entry) => {
      counts[entry.vibe] += 1;
    });

    const byOption = vibeOptions.map((opt) => ({
      ...opt,
      count: counts[opt.value],
    }));

    const total = vibes.length;
    const top = byOption.reduce((best, current) =>
      current.count > best.count ? current : best,
    );

    return {
      byOption,
      total,
      top,
      topPercent: total > 0 ? Math.round((top.count / total) * 100) : 0,
    };
  }, [vibes]);

  const refreshPostQueries = (targetPostId: string) => {
    queryClient.invalidateQueries({
      queryKey: ["posts"],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["post", targetPostId],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["profile_posts"],
      refetchType: "all",
    });
  };

  const toggleBookmark = () => {
    const list: string[] = JSON.parse(
      localStorage.getItem("bookmarkedPosts") || "[]",
    );
    if (bookmarked) {
      const updated = list.filter((id) => id !== postId);
      localStorage.setItem("bookmarkedPosts", JSON.stringify(updated));
      setBookmarked(false);
      toast.success("Removed bookmark");
    } else {
      list.push(postId);
      localStorage.setItem("bookmarkedPosts", JSON.stringify(list));
      setBookmarked(true);
      toast.success("Bookmarked!");
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(currentUrl);
    toast.success("Link copied!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.content?.slice(0, 50) || "Check this post",
          url: currentUrl,
        });
      } catch {}
    } else {
      toast.error("Share not supported on this browser");
    }
  };

  const handleEmailLink = () => {
    const subject = encodeURIComponent("Check out this post");
    const body = encodeURIComponent(
      `I thought you might like this: ${currentUrl}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handlePrint = () => window.print();

  const handleLike = async () => {
    if (!post) return;

    const previousLiked = isLiked;
    const previousCount = likeCount;
    const nextLiked = !isLiked;

    setIsLiked(nextLiked);
    setLikeCount((count) => (nextLiked ? count + 1 : Math.max(count - 1, 0)));

    try {
      await toggleLike(supabase, user, post.id);
      refreshPostQueries(post.id);
      toast.success(nextLiked ? "Liked post" : "Unliked post");
    } catch {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error("Couldn't update like right now.");
    }
  };

  const handleVibe = async (selectedVibe: z.infer<typeof PostVibeValue>) => {
    if (!post) return;

    const previousVibes = vibes;
    const withoutMine = previousVibes.filter(
      (entry) => entry.profile_id !== user.id,
    );
    const nextVibes =
      myVibe === selectedVibe
        ? withoutMine
        : [
            ...withoutMine,
            {
              profile_id: user.id,
              vibe: selectedVibe,
            },
          ];

    setVibes(nextVibes);

    try {
      await setPostVibe(supabase, user, post.id, selectedVibe as PostVibe);
      refreshPostQueries(post.id);
      toast.success(
        myVibe === selectedVibe
          ? "Vibe removed"
          : `Vibe set: ${vibeOptions.find((v) => v.value === selectedVibe)?.label}`,
      );
    } catch {
      setVibes(previousVibes);
      toast.error("Couldn't update vibe right now.");
    }
  };

  const handlePollVote = async (optionId: string) => {
    if (!post || !poll) return;

    const previousPoll = poll;

    const nextOptions = poll.options.map((option) => {
      const withoutMyVote = option.votes.filter(
        (vote) => vote.profile_id !== user.id,
      );

      if (option.id !== optionId) {
        return {
          ...option,
          votes: withoutMyVote,
        };
      }

      if (myPollVoteOptionId === optionId) {
        return {
          ...option,
          votes: withoutMyVote,
        };
      }

      return {
        ...option,
        votes: [...withoutMyVote, { profile_id: user.id }],
      };
    });

    setPoll({
      ...poll,
      options: nextOptions,
    });

    try {
      await voteOnPostPoll(supabase, user, post.id, optionId);
      refreshPostQueries(post.id);
      toast.success(
        myPollVoteOptionId === optionId ? "Vote removed" : "Vote submitted",
      );
    } catch {
      setPoll(previousPoll);
      toast.error("Couldn't submit vote right now.");
    }
  };

  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImageIndex(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImageIndex]);

  useEffect(() => {
    if (
      activeImageIndex !== null &&
      (activeImageIndex < 0 || activeImageIndex >= postImageUrls.length)
    ) {
      setActiveImageIndex(null);
    }
  }, [activeImageIndex, postImageUrls.length]);

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-foreground/70" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="bottom-center" theme="system" richColors />
      <main className="page-shell max-w-4xl space-y-5">
        <div className="surface flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3">
          <TooltipHint content="Back to feed">
            <Button
              variant="ghost"
              className="rounded-full px-4"
              onClick={() => router.push("/home")}
            >
              <ArrowLeft /> Back to Feed
            </Button>
          </TooltipHint>
          <div className="flex flex-wrap gap-2">
            <TooltipHint content="Copy link">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handleCopyLink}
                aria-label="Copy link"
              >
                <Copy />
              </Button>
            </TooltipHint>
            <TooltipHint content="Share">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handleShare}
                aria-label="Share"
              >
                <Share2 />
              </Button>
            </TooltipHint>
            <TooltipHint content="Share by email">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handleEmailLink}
                aria-label="Email link"
              >
                <Mail />
              </Button>
            </TooltipHint>
            <TooltipHint
              content={bookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={toggleBookmark}
                aria-pressed={bookmarked}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
              >
                <Bookmark
                  className={
                    bookmarked ? "fill-current text-primary stroke-none" : ""
                  }
                />
              </Button>
            </TooltipHint>
            <TooltipHint content="Print post">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handlePrint}
                aria-label="Print"
              >
                <Printer />
              </Button>
            </TooltipHint>
          </div>
        </div>

        {post && (
          <article className="surface w-full overflow-hidden">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-7">
              <Link
                href={`/profile/${post.author.id}`}
                className="group inline-flex min-w-0 items-center gap-3"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={
                      supabase.storage
                        .from("avatars")
                        .getPublicUrl(post.author.avatar_url ?? "").data
                        .publicUrl
                    }
                  />
                  <AvatarFallback>
                    {post.author.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-foreground group-hover:text-primary">
                    {post.author.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    @{post.author.handle}
                  </p>
                </div>
              </Link>

              <div
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/45 px-3 py-1 text-xs font-medium text-muted-foreground"
                title={new Date(post.posted_at).toLocaleString()}
              >
                <Clock3 className="h-3.5 w-3.5" />
                {new Date(post.posted_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </header>

            <div className="space-y-5 px-5 py-6 sm:px-7">
              <p className="whitespace-pre-wrap break-words text-[17px] leading-relaxed text-foreground/95">
                {post.content}
              </p>

              {poll && (
                <section className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Quick Poll
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {pollVoteTotal.toLocaleString()} votes
                    </span>
                  </div>

                  {poll.question && (
                    <p className="mb-2 text-sm font-semibold text-foreground">
                      {poll.question}
                    </p>
                  )}

                  <div className="space-y-2">
                    {sortedPollOptions.map((option) => {
                      const votes = option.votes.length;
                      const percent =
                        pollVoteTotal > 0
                          ? Math.round((votes / pollVoteTotal) * 100)
                          : 0;
                      const active = myPollVoteOptionId === option.id;

                      return (
                        <Button
                          key={option.id}
                          variant="ghost"
                          className={`relative h-auto w-full justify-start overflow-hidden rounded-xl border px-3 py-2 text-left ${
                            active
                              ? "border-primary/45 bg-primary/10 text-foreground"
                              : "border-border/70 bg-background/60 text-foreground"
                          }`}
                          onClick={() => handlePollVote(option.id)}
                        >
                          <span
                            className="absolute inset-y-0 left-0 bg-primary/20"
                            style={{ width: `${percent}%` }}
                          />
                          <span className="relative flex w-full items-center justify-between gap-2 text-sm">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {percent}% ({votes})
                            </span>
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </section>
              )}

              <PostImageGallery
                imageUrls={postImageUrls}
                onImageClick={setActiveImageIndex}
              />

              <section className="rounded-2xl border border-border/70 bg-muted/25 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Vibe Check
                  </p>
                  {vibeStats.total > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      {vibeStats.top.emoji} {vibeStats.top.label} leads (
                      {vibeStats.topPercent}%)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {vibeStats.byOption.map((option) => {
                    const active = myVibe === option.value;

                    return (
                      <Button
                        key={option.value}
                        variant="ghost"
                        className={`h-8 rounded-full px-3 text-xs font-semibold ${
                          active
                            ? "bg-primary/15 text-primary hover:bg-primary/20"
                            : "bg-background/60 text-muted-foreground hover:bg-background"
                        }`}
                        onClick={() => handleVibe(option.value)}
                      >
                        <span>{option.emoji}</span>
                        <span>{option.label}</span>
                        <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] leading-none">
                          {option.count}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </section>
            </div>

            <footer className="flex items-center justify-between border-t border-border/70 px-5 py-4 sm:px-7">
              <TooltipHint content={isLiked ? "Unlike post" : "Like post"}>
                <Button
                  variant="ghost"
                  className={`rounded-full px-4 ${
                    isLiked
                      ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/15 hover:text-rose-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={handleLike}
                >
                  <Heart
                    className={
                      isLiked ? "fill-rose-500 text-rose-500" : "text-inherit"
                    }
                  />
                  <span className="font-semibold">
                    {likeCount.toLocaleString()}
                  </span>
                </Button>
              </TooltipHint>

              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Post details
              </span>
            </footer>
          </article>
        )}

        {!post && !isLoading && (
          <div className="surface px-6 py-10 text-center">
            <p className="text-lg font-semibold">Post not found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This post may have been deleted.
            </p>
          </div>
        )}
      </main>
      {activeImageUrl && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image"
          onClick={() => setActiveImageIndex(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
            aria-label="Close image viewer"
            onClick={() => setActiveImageIndex(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="max-h-[92vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeImageUrl}
              alt="Fullscreen post image"
              width={1800}
              height={1800}
              className="max-h-[92vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
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

  const postId = context.params?.id as string;

  const post = await getPost(supabase, userData.user, postId);
  if (post === null) {
    return { notFound: true };
  }

  return {
    props: {
      user: userData.user,
      initialPostId: postId,
    },
  };
}
