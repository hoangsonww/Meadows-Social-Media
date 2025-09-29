import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Share2,
  Copy,
  Mail,
  Bookmark,
  Printer,
  Loader2,
} from "lucide-react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { getPost } from "@/utils/supabase/queries/post";
import PostCard from "@/components/post";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { User } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner";
import {
  addBookmark,
  isPostBookmarked,
  removeBookmark,
} from "@/utils/supabase/queries/bookmark";

type PostPageProps = { user: User };

export default function PostPage({ user }: PostPageProps) {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const postId = typeof router.query.id === "string" ? router.query.id : null;
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!postId) {
        throw new Error("Missing post id");
      }

      return await getPost(supabase, user, postId);
    },
    enabled: !!postId,
  });

  const [bookmarked, setBookmarked] = useState(false);
  const [isUpdatingBookmark, setIsUpdatingBookmark] = useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const { data: isBookmarked, isLoading: isBookmarkStatusLoading } = useQuery({
    queryKey: ["bookmark", user.id, postId],
    queryFn: async () => {
      if (!postId) {
        return false;
      }

      return await isPostBookmarked(supabase, user, postId);
    },
    enabled: !!postId,
  });

  useEffect(() => {
    if (typeof isBookmarked === "boolean") {
      setBookmarked(isBookmarked);
    }
  }, [isBookmarked]);

  const toggleBookmark = async () => {
    if (!postId || isUpdatingBookmark) return;

    setIsUpdatingBookmark(true);

    try {
      if (bookmarked) {
        await removeBookmark(supabase, user, postId);
        setBookmarked(false);
        toast.success("Removed bookmark");
      } else {
        await addBookmark(supabase, user, postId);
        setBookmarked(true);
        toast.success("Bookmarked!");
      }

      queryClient.invalidateQueries({ queryKey: ["bookmarkedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["bookmark", user.id, postId] });
    } catch {
      toast.error("Couldn't update bookmark");
    } finally {
      setIsUpdatingBookmark(false);
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
          title: post?.content.slice(0, 50) || "Check this post",
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-64">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="bottom-center" />
      <div className="flex flex-col w-full min-h-screen bg-background p-4 space-y-6">
        <div className="flex items-center justify-between w-full mb-4">
          <Button
            variant="ghost"
            className="transition-transform duration-200 hover:scale-105"
            onClick={() => router.push("/home")}
          >
            <ArrowLeft /> Back to Feed
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="transition-transform duration-200 hover:scale-105"
              onClick={handleCopyLink}
            >
              <Copy />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="transition-transform duration-200 hover:scale-105"
              onClick={handleShare}
            >
              <Share2 />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="transition-transform duration-200 hover:scale-105"
              onClick={handleEmailLink}
            >
              <Mail />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="transition-transform duration-200 hover:scale-105"
              onClick={toggleBookmark}
              disabled={isUpdatingBookmark || isBookmarkStatusLoading}
            >
              <Bookmark
                className={
                  bookmarked ? "fill-current text-primary stroke-none" : ""
                }
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="transition-transform duration-200 hover:scale-105"
              onClick={handlePrint}
            >
              <Printer />
            </Button>
          </div>
        </div>
        {post && (
          <Card className="w-full rounded-2xl shadow-lg transition-shadow duration-300 hover:shadow-2xl">
            <PostCard user={user} post={post} />
          </Card>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // require login
  if (userError || !userData) {
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
