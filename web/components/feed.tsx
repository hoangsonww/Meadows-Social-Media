import { Fragment } from "react";
import { InView } from "react-intersection-observer";
import { z } from "zod";
import { Post } from "@/utils/supabase/models/post";
import { InfiniteData } from "@tanstack/react-query";
import PostCard from "./post";
import { Separator } from "./ui/separator";
import { User } from "@supabase/supabase-js";

type PostFeedProps = {
  user: User;
  posts: InfiniteData<z.infer<typeof Post>[]> | undefined;
  fetchNext: () => void;
};
export default function PostFeed({ user, posts, fetchNext }: PostFeedProps) {
  return (
    <>
      {posts &&
        posts.pages.map((page) => {
          return page.map((post, postIndex) => (
            <Fragment key={`post_${post.id}`}>
              {postIndex === 20 && (
                <InView onChange={(inView) => inView && fetchNext()}></InView>
              )}
              <PostCard user={user} post={post} />
              <Separator />
            </Fragment>
          ));
        })}
    </>
  );
}
