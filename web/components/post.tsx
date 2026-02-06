import { ArrowUpRight, Clock3, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { z } from "zod";
import { Post } from "@/utils/supabase/models/post";
import { toggleLike } from "@/utils/supabase/queries/post";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useState } from "react";
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

/**
 * Renders an individual post card with author info, content, image, and like action.
 * Clicking anywhere on the card (except the like button or author link) navigates to the post detail page.
 */
export default function PostCard({ user, post }: PostCardProps) {
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const likedByUser = post.likes.some((like) => like.profile_id === user.id);
  const [isLiked, setIsLiked] = useState<boolean>(likedByUser);
  const [likeCount, setLikeCount] = useState<number>(post.likes.length);
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
  const postImageUrl = post.attachment_url
    ? supabase.storage.from("images").getPublicUrl(post.attachment_url).data
        .publicUrl
    : null;
  const openPost = () => router.push(`/post/${post.id}`);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const previousLiked = isLiked;
    const previousCount = likeCount;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((count) => (nextLiked ? count + 1 : Math.max(count - 1, 0)));
    try {
      await toggleLike(supabase, user, post.id);
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["post", post.id],
        refetchType: "all",
      });
      toast.success(nextLiked ? "Liked post" : "Unliked post");
    } catch {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error("Couldn't update like right now.");
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

          {postImageUrl && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
              <Image
                className="max-h-[620px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                src={postImageUrl}
                alt="Attachment"
                width={900}
                height={900}
              />
            </div>
          )}

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
