import { ArrowUpRight, Clock3, Heart, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { z } from "zod";
import { Post, PostVibeValue } from "@/utils/supabase/models/post";
import {
  setPostVibe,
  toggleLike,
  PostVibe,
  voteOnPostPoll,
} from "@/utils/supabase/queries/post";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type PostCardProps = {
  user: User;
  post: z.infer<typeof Post>;
};

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

function PostImageGallery({ imageUrls }: { imageUrls: string[] }) {
  if (imageUrls.length === 0) {
    return null;
  }

  if (imageUrls.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
        <Image
          className="max-h-[620px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
          src={imageUrls[0]}
          alt="Post image"
          width={900}
          height={900}
        />
      </div>
    );
  }

  const visibleImages = imageUrls.slice(0, 4);
  const extraCount = imageUrls.length - visibleImages.length;

  return (
    <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl border border-border/70 bg-muted/30 p-2">
      {visibleImages.map((imageUrl, index) => (
        <div
          key={`${imageUrl}-${index}`}
          className={`relative overflow-hidden rounded-xl ${
            imageUrls.length === 3 && index === 0
              ? "col-span-2 aspect-[16/9]"
              : "aspect-square"
          }`}
        >
          <Image
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            src={imageUrl}
            alt={`Post image ${index + 1}`}
            width={900}
            height={900}
          />

          {extraCount > 0 && index === visibleImages.length - 1 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="text-lg font-bold text-white">
                +{extraCount}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PostCard({ user, post }: PostCardProps) {
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [vibes, setVibes] = useState(post.vibes);
  const [poll, setPoll] = useState(post.poll);

  useEffect(() => {
    const likedByUser = post.likes.some((like) => like.profile_id === user.id);
    setIsLiked(likedByUser);
    setLikeCount(post.likes.length);
    setVibes(post.vibes);
    setPoll(post.poll);
  }, [post, user.id]);

  const postedAt = new Date(post.posted_at);
  const postedAtLabel = postedAt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const profileAvatarUrl = supabase.storage
    .from("avatars")
    .getPublicUrl(post.author.avatar_url ?? "").data.publicUrl;

  const postImageUrls = useMemo(() => {
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
  }, [post.attachments, post.attachment_url, supabase]);

  const openPost = () => router.push(`/post/${post.id}`);

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

  const myVibeLabel = useMemo(
    () => vibeOptions.find((option) => option.value === myVibe)?.label ?? null,
    [myVibe],
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

  const refreshPostQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["posts"],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["post", post.id],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["profile_posts"],
      refetchType: "all",
    });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const previousLiked = isLiked;
    const previousCount = likeCount;
    const nextLiked = !isLiked;

    setIsLiked(nextLiked);
    setLikeCount((count) => (nextLiked ? count + 1 : Math.max(count - 1, 0)));

    try {
      await toggleLike(supabase, user, post.id);
      refreshPostQueries();
      toast.success(nextLiked ? "Liked post" : "Unliked post");
    } catch {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error("Couldn't update like right now.");
    }
  };

  const handleVibe = async (
    e: React.MouseEvent,
    selectedVibe: z.infer<typeof PostVibeValue>,
  ) => {
    e.stopPropagation();

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
      refreshPostQueries();
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

  const handlePollVote = async (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();

    if (!poll) return;

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
      refreshPostQueries();
      toast.success(
        myPollVoteOptionId === optionId ? "Vote removed" : "Vote submitted",
      );
    } catch {
      setPoll(previousPoll);
      toast.error("Couldn't submit vote right now.");
    }
  };

  return (
    <div
      className="group relative w-full cursor-pointer overflow-hidden rounded-[1.6rem] border border-border/70 bg-card/85 p-4 shadow-soft-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl sm:p-5"
      onClick={openPost}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPost();
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.08] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex w-full gap-3 sm:gap-4">
        <Avatar className="mt-0.5 h-11 w-11 flex-shrink-0">
          <AvatarImage src={profileAvatarUrl} />
          <AvatarFallback>
            {post.author.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex w-full flex-wrap items-start justify-between gap-2">
            <Link
              href={`/profile/${post.author.id}`}
              className="flex min-w-0 flex-col leading-tight"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="truncate text-[15.5px] font-bold text-foreground transition-colors group-hover:text-primary">
                {post.author.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                @{post.author.handle}
              </p>
            </Link>
            <div
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              title={postedAt.toLocaleString()}
            >
              <Clock3 className="h-3.5 w-3.5" />
              <span>{postedAtLabel}</span>
            </div>
          </div>

          <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground/95 sm:text-[15.5px]">
            {post.content}
          </p>

          {poll && (
            <div className="mt-3 rounded-2xl border border-border/70 bg-muted/20 p-3">
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
                  const isActive = myPollVoteOptionId === option.id;

                  return (
                    <Button
                      key={option.id}
                      variant="ghost"
                      className={`relative h-auto w-full justify-start overflow-hidden rounded-xl border px-3 py-2 text-left ${
                        isActive
                          ? "border-primary/45 bg-primary/10 text-foreground"
                          : "border-border/70 bg-background/60 text-foreground"
                      }`}
                      onClick={(e) => handlePollVote(e, option.id)}
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
            </div>
          )}

          <div className="mt-3">
            <PostImageGallery imageUrls={postImageUrls} />
          </div>

          <div className="mt-3 rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-background/40 to-accent/[0.08] p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/85">
                  Vibe Check
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                  {myVibeLabel
                    ? `Your vibe: ${myVibeLabel} (tap again to remove)`
                    : "Tap a vibe chip to react"}
                </p>
              </div>
              {vibeStats.total > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {vibeStats.top.emoji} {vibeStats.top.label}{" "}
                  {vibeStats.topPercent}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {vibeStats.byOption.map((option) => {
                const active = myVibe === option.value;

                return (
                  <Button
                    key={option.value}
                    variant="ghost"
                    aria-pressed={active}
                    className={`h-auto cursor-pointer flex-col items-start rounded-xl border px-2.5 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      active
                        ? "border-primary/45 bg-primary/15 text-primary shadow-sm"
                        : "border-border/70 bg-background/75 text-foreground/90 hover:border-primary/35 hover:bg-primary/[0.08]"
                    }`}
                    onClick={(e) => handleVibe(e, option.value)}
                    title={active ? "Tap to remove your vibe" : "Tap to react"}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-[13px] font-bold leading-none">
                        {option.emoji}
                      </span>
                      <span className="rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground">
                        {option.count}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] font-semibold leading-none">
                      {option.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
            <Button
              variant="ghost"
              className={`h-9 rounded-full px-3.5 ${
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
              <span className="text-sm font-semibold">
                {likeCount.toLocaleString()}
              </span>
            </Button>

            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Open post
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
