/**
 * The post component shows an individual post.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { ExternalLink, Heart } from "lucide-react";
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

type PostCardProps = {
  user: User;
  post: z.infer<typeof Post>;
};
export default function PostCard({ user, post }: PostCardProps) {
  // Create necessary hooks for clients and providers.
  const supabase = createSupabaseComponentClient();
  const router = useRouter();

  // Determine the initial value for the `isLiked` hook.
  const likedByUser = post.likes.some(
    (like) => like.profile_id === user.id
  );

  // Store whether or not the post is liked by the user.
  // This should optimistically update when the user clicks the like button
  // to avoid needing to refetch the post.
  const [isLiked, setIsLiked] = useState(likedByUser);

  // Helper variable to determine the number of likes to display, which updates
  // when the user clicks the like button. We need to subtract 1 from the number
  // of likes if the user has already liked the post, since we are optimistically
  // updating the state to reflect the new number of likes.
  const numberOfLikes = likedByUser ? post.likes.length - 1 : post.likes.length;

  return (
    <div className="flex flex-row w-full gap-3 p-6">
      <Avatar className="mt-1">
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
      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-row justify-between items-center">
          <Link
            href={`/profile/${post.author.id}`}
            className="flex flex-row items-center"
          >
            <p className="text-primary font-bold hover:underline">
              {post.author.name}
            </p>
            <p className="ml-3 text-muted-foreground  hover:underline">
              @{post.author.handle}
            </p>
          </Link>
          <div className="flex flex-row items-center">
            {/* Handle likes */}
            <Button
              variant="ghost"
              onClick={async () => {
                await toggleLike(supabase, user, post.id);
                setIsLiked(!isLiked);
              }}
            >
              <p
                className={`text-sm ${
                  isLiked ? "text-pink-600" : "text-muted-foreground"
                }`}
              >
                {numberOfLikes + (isLiked ? 1 : 0)}
              </p>
              <Heart className={`${isLiked ? "text-pink-600" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                router.push(`/post/${post.id}`);
              }}
            >
              <ExternalLink className="text-muted-foreground" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 my-2 min-w-full">
          {/* Show the post's image, if it exists. */}
          {post.attachment_url && (
            <Image
              className="rounded-xl"
              src={
                supabase.storage
                  .from("images")
                  .getPublicUrl(post.attachment_url).data.publicUrl
              }
              alt="Image"
              width={600}
              height={600}
            />
          )}
          <p>{post.content}</p>
        </div>
      </div>
    </div>
  );
}
