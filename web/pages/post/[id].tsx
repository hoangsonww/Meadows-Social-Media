import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Share2, Copy, Mail, Bookmark, Printer } from "lucide-react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { getPost } from "@/utils/supabase/queries/post";
import PostCard from "@/components/post";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { User } from "@supabase/supabase-js";

type PostPageProps = { user: User };

export default function PostPage({ user }: PostPageProps) {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const postId = router.query.id as string;

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => await getPost(supabase, user, postId),
    enabled: !!postId,
  });

  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  // initialize bookmark state
  useEffect(() => {
    if (!postId) return;
    const list = JSON.parse(localStorage.getItem("bookmarkedPosts") || "[]");
    setBookmarked(list.includes(postId));
  }, [postId]);

  const toggleBookmark = () => {
    const list: string[] = JSON.parse(
      localStorage.getItem("bookmarkedPosts") || "[]",
    );
    let message: string;
    if (bookmarked) {
      const updated = list.filter((id) => id !== postId);
      localStorage.setItem("bookmarkedPosts", JSON.stringify(updated));
      setBookmarked(false);
      message = "Removed bookmark";
    } else {
      list.push(postId);
      localStorage.setItem("bookmarkedPosts", JSON.stringify(list));
      setBookmarked(true);
      message = "Bookmarked!";
    }
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      setToast("Share not supported on this browser");
      setTimeout(() => setToast(null), 2000);
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
    return <p className="text-center mt-8">Loading post...</p>;
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-background p-4 space-y-6">
      <div className="flex items-center justify-between w-full mb-4">
        <Button
          variant="ghost"
          className="transition-transform duration-200 hover:scale-105"
          onClick={() => router.push("/")}
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
      {copied && (
        <div className="fixed bottom-4 right-4 bg-muted px-4 py-2 rounded-full shadow-md transition-opacity duration-300">
          Link copied!
        </div>
      )}
      {toast && (
        <div className="fixed bottom-16 right-4 bg-muted px-4 py-2 rounded-full shadow-md transition-opacity duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  return {
    props: { user: userData.user },
  };
}
