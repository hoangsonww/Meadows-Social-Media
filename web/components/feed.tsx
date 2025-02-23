/**
 * Component to display an infinitely scrolling feed of posts.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

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
      {/* Posts are grouped by pages, so we need to iterate first over page, then posts. */}
      {posts &&
        posts.pages.map((page) => {
          return page.map((post, postIndex) => (
            <Fragment key={`post_${post.id}`}>
              {/* This in-view component triggers an action whenever it appears on the
              screen. Since the page length is 25, this item is placed on the 20th element
              per page. Once the user scrolls to near the end of the page and this element
              appears, new data is loaded (infinite scrolling) */}
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
