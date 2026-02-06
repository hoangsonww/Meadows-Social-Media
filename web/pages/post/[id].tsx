import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Clock3,
  Mail,
  Copy,
  Heart,
  Bookmark,
  Loader2,
  Printer,
  Share2,
} from "lucide-react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { getPost, toggleLike } from "@/utils/supabase/queries/post";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { User } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { TooltipHint } from "@/components/ui/tooltip-hint";

type PostPageProps = { user: User };

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

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  // initialize bookmark state
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
  }, [post, user.id]);

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

              {post.attachment_url && (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
                  <Image
                    src={
                      supabase.storage
                        .from("images")
                        .getPublicUrl(post.attachment_url).data.publicUrl
                    }
                    alt="Post attachment"
                    width={1200}
                    height={1200}
                    className="max-h-[760px] w-full object-cover"
                  />
                </div>
              )}
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
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // require login
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
