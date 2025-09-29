import { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { Post } from "../models/post";

/** Loads bookmarked posts for the authenticated user ordered by most recent. */
export const getBookmarkedPosts = async (
  supabase: SupabaseClient,
  user: User,
): Promise<z.infer<typeof Post>[]> => {
  const { data, error } = await supabase
    .from("bookmark")
    .select(
      `
      created_at,
      post:post_id (
        id,
        content,
        posted_at,
        attachment_url,
        author:author_id (
          id,
          name,
          handle,
          avatar_url
        ),
        likes:like (
          profile_id
        )
      )
    `,
    )
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data
    .filter((row): row is { post: unknown } => row.post !== null)
    .map((row) => Post.parse(row.post));
};

/** Checks whether the given post is bookmarked by the authenticated user. */
export const isPostBookmarked = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("bookmark")
    .select("post_id")
    .eq("profile_id", user.id)
    .eq("post_id", postId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return !!data && data.length > 0;
};

/** Saves a bookmark for the authenticated user. */
export const addBookmark = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
): Promise<void> => {
  const { error } = await supabase.from("bookmark").upsert(
    { profile_id: user.id, post_id: postId },
    { onConflict: "profile_id,post_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
};

/** Removes a single bookmark for the authenticated user. */
export const removeBookmark = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("bookmark")
    .delete()
    .match({ profile_id: user.id, post_id: postId });

  if (error) {
    throw new Error(error.message);
  }
};

/** Clears all bookmarks for the authenticated user. */
export const clearBookmarks = async (
  supabase: SupabaseClient,
  user: User,
): Promise<void> => {
  const { error } = await supabase
    .from("bookmark")
    .delete()
    .eq("profile_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
};

/** Imports legacy localStorage bookmarks into Supabase. */
export const saveBookmarksBulk = async (
  supabase: SupabaseClient,
  user: User,
  postIds: string[],
): Promise<void> => {
  const uniqueIds = Array.from(new Set(postIds));

  if (uniqueIds.length === 0) {
    return;
  }

  const rows = uniqueIds.map((postId) => ({
    profile_id: user.id,
    post_id: postId,
  }));

  const { error } = await supabase
    .from("bookmark")
    .upsert(rows, { onConflict: "profile_id,post_id" });

  if (error) {
    throw new Error(error.message);
  }
};
