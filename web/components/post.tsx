import { Heart } from "lucide-react";
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
  const numberOfLikes = likedByUser ? post.likes.length - 1 : post.likes.length;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(supabase, user, post.id);
    setIsLiked(!isLiked);
    queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "all" });
    queryClient.invalidateQueries({
      queryKey: ["post", post.id],
      refetchType: "all",
    });
    toast.success(isLiked ? "Unliked post" : "Liked post");
  };

  return (
    <div
      className="flex w-full gap-3 p-6 cursor-pointer"
      onClick={() => router.push(`/post/${post.id}`)}
    >
      <Avatar className="flex-shrink-0">
        <AvatarImage
          src={
            supabase.storage
              .from("avatars")
              .getPublicUrl(post.author.avatar_url ?? "").data.publicUrl
          }
        />
        <AvatarFallback>
          {post.author.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-3 w-full min-w-0">
        {/* header: author + like, wraps when too wide */}
        <div className="flex flex-wrap justify-between items-center gap-2 w-full">
          <Link href={`/profile/${post.author.id}`} legacyBehavior>
            <a
              className="flex flex-wrap items-center gap-2 break-words"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-primary font-bold hover:underline break-all">
                {post.author.name}
              </p>
              <p className="text-muted-foreground hover:underline break-all">
                @{post.author.handle}
              </p>
            </a>
          </Link>
          <div className="flex-shrink-0">
            <Button variant="ghost" onClick={handleLike}>
              <p
                className={`text-sm ${
                  isLiked ? "text-pink-600" : "text-muted-foreground"
                }`}
              >
                {numberOfLikes + (isLiked ? 1 : 0)}
              </p>
              <Heart className={isLiked ? "text-pink-600" : ""} />
            </Button>
          </div>
        </div>

        {/* content */}
        <div className="flex flex-col gap-4 my-2 w-full min-w-0">
          {post.attachment_url && (
            <Image
              className="rounded-xl object-cover w-full max-h-[600px]"
              src={
                supabase.storage
                  .from("images")
                  .getPublicUrl(post.attachment_url).data.publicUrl
              }
              alt="Attachment"
              width={600}
              height={600}
            />
          )}
          <p className="whitespace-pre-wrap break-words break-all">
            {post.content}
          </p>
        </div>
      </div>
    </div>
  );
}
