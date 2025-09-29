import { useEffect, useState } from "react";
import PostCard from "@/components/post";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { getPostsByIds } from "@/utils/supabase/queries/post";
import { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { BookmarkX, Loader2 } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { Toaster, toast } from "sonner";

type BookmarksPageProps = {
  user: User;
};

export default function BookmarksPage({ user }: BookmarksPageProps) {
  const supabase = createSupabaseComponentClient();
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromStorage = () => {
      try {
        const raw = window.localStorage.getItem("bookmarkedPosts");
        const parsed = raw ? JSON.parse(raw) : [];

        if (Array.isArray(parsed)) {
          const sanitized = Array.from(
            new Set(
              parsed.filter((id): id is string => typeof id === "string"),
            ),
          );

          setBookmarkIds(sanitized);
          window.localStorage.setItem(
            "bookmarkedPosts",
            JSON.stringify(sanitized),
          );
        } else {
          setBookmarkIds([]);
          window.localStorage.removeItem("bookmarkedPosts");
        }
      } catch {
        setBookmarkIds([]);
      }
    };

    syncFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "bookmarkedPosts") {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["bookmarkedPosts", bookmarkIds],
    queryFn: async () => getPostsByIds(supabase, user, bookmarkIds),
    enabled: bookmarkIds.length > 0,
  });

  const posts = bookmarkIds.length === 0 ? [] : data ?? [];
  const isLoadingBookmarks =
    bookmarkIds.length > 0 && (isLoading || isFetching);

  const handleRemoveBookmark = (postId: string) => {
    if (typeof window === "undefined") return;

    setBookmarkIds((prev) => {
      const updated = prev.filter((id) => id !== postId);
      window.localStorage.setItem("bookmarkedPosts", JSON.stringify(updated));
      return updated;
    });

    toast.success("Removed bookmark");
  };

  const handleClearAll = () => {
    if (typeof window === "undefined" || bookmarkIds.length === 0) return;

    window.localStorage.setItem("bookmarkedPosts", JSON.stringify([]));
    setBookmarkIds([]);
    toast.success("Cleared all bookmarks");
  };

  return (
    <>
      <Toaster position="bottom-center" />
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Bookmarked Posts</h1>
          <p className="text-muted-foreground">
            Organize your saved posts and jump back into the conversations you
            love.
          </p>
        </div>

        {bookmarkIds.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          </div>
        )}

        {isLoadingBookmarks ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 rounded-3xl border-dashed p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BookmarkX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No bookmarks yet</h2>
            <p className="max-w-sm text-muted-foreground">
              Tap the bookmark icon on any post to save it for later and it will
              appear here.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-5 pb-10">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="relative overflow-hidden rounded-3xl shadow-sm transition-shadow hover:shadow-lg"
              >
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-4 z-10 rounded-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveBookmark(post.id);
                  }}
                >
                  <BookmarkX className="h-4 w-4" />
                  <span className="sr-only">Remove bookmark</span>
                </Button>
                <PostCard user={user} post={post} />
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  return {
    props: {
      user: userData.user,
    },
  };
}
