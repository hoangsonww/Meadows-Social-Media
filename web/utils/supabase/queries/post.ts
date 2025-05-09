import { SupabaseClient, User } from "@supabase/supabase-js";
import { Post } from "../models/post";
import { z } from "zod";

/**
 * This function loads data for a single post.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param postId - ID of the post to work with.
 * @returns - Post object.
 */
export const getPost = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
): Promise<z.infer<typeof Post>> => {
  // Select the post with the given ID (all its data,
  // such as id, content, posted_at, likes, and author)
  const { data, error } = await supabase
    .from("post")
    .select(
      `
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
    `,
    )
    .eq("id", postId)
    .single();
  // 'author:author_id' joins and renames the related author data
  // 'likes:like' fetches and aliases the corresponding likes information

  // Handle errors
  if (error) {
    throw new Error(error.message);
  }

  // Edge case: no data returned but no error either
  if (!data) {
    throw new Error("Post not found or no data returned.");
  }

  // Validate and transform data using Zod
  return Post.parse(data);
};

/**
 * This function loads data for the user's 'feed' post feed.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param cursor -
 * @returns - Post object.
 */
export const getFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number,
): Promise<z.infer<typeof Post>[]> => {
  // Select all posts, ordered by posted_at in descending order
  // (most recent first), with author and all its data such as
  // id, name, handle, and avatar_url, and likes
  const { data, error } = await supabase
    .from("post")
    .select(
      `
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
    `,
    )
    .order("posted_at", { ascending: false })
    // Supabase ranges are inclusive, so range(cursor, cursor + 24)
    .range(cursor, cursor + 24);
  // "author:author_id" joins and renames the related author data
  // "likes:like" fetches and aliases the corresponding likes information

  // Handle errors
  if (error) {
    throw new Error(error.message);
  }

  // Edge case: no data returned but no error either
  if (!data) {
    return [];
  }

  // Validate and transform data using Zod
  return Post.array().parse(data);
};

/**
 * This function loads data for the user's 'following' post feed.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param cursor - The starting index of the page.
 * @returns - Post object.
 */
export const getFollowingFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number,
): Promise<z.infer<typeof Post>[]> => {
  // First, find all profile IDs the current user is following
  const { data: followingData, error: followError } = await supabase
    .from("follow")
    .select("following_id")
    .eq("follower_id", user.id);

  // Handle errors
  if (followError) {
    throw new Error(followError.message);
  }

  // Edge case: no data returned but no error either
  // Or if user actually follows no one, just return an empty array
  if (!followingData || followingData.length === 0) {
    // If user follows no one, just return an empty array
    return [];
  }

  const followingIDs = followingData.map((f) => f.following_id);

  // Then, select all posts where author_id is in the set of following IDs
  const { data, error } = await supabase
    .from("post")
    .select(
      `
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
    `,
    )
    .in("author_id", followingIDs)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);
  // "author:author_id" joins and renames the related author data
  // "likes:like" fetches and aliases the corresponding likes information

  // Handle errors
  if (error) {
    throw new Error(error.message);
  }

  // Edge case: no data returned but no error either
  if (!data) {
    return [];
  }

  // Validate and transform data using
  return Post.array().parse(data);
};

/**
 * This function loads data for the user's 'likes' post feed.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param cursor - The starting index of the page.
 * @returns - Post object.
 */
export const getLikesFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number,
): Promise<z.infer<typeof Post>[]> => {
  // First, find all post IDs the current user has liked
  const { data: likeData, error: likeError } = await supabase
    .from("like")
    .select("post_id")
    .eq("profile_id", user.id);

  // Handle errors
  if (likeError) {
    throw new Error(likeError.message);
  }

  // Edge case: no data returned but no error either
  // Or if user has actually liked no posts, just return an empty array
  if (!likeData || likeData.length === 0) {
    // If user hasn't liked any posts, just return empty
    return [];
  }

  // Extract the set of post IDs that the user has liked
  const likedPostIDs = likeData.map((like) => like.post_id);

  // Then, select all posts that are in that set of post IDs
  const { data, error } = await supabase
    .from("post")
    .select(
      `
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
    `,
    )
    .in("id", likedPostIDs)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);
  // "author:author_id" joins and renames the related author data
  // "likes:like" fetches and aliases the corresponding likes information

  // Handle errors
  if (error) {
    throw new Error(error.message);
  }

  // Edge case: no data returned but no error either
  if (!data) {
    return [];
  }

  // Validate and transform data using Zod
  return Post.array().parse(data);
};

/**
 * This function toggles the like status of a post for a user.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param postId - ID of the post to work with.
 */
export const toggleLike = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
): Promise<void> => {
  // Check if user already liked the post first by selecting
  // all likes with the user's profile ID and the post ID
  // and then checking if there's any data returned
  const { data, error } = await supabase
    .from("like")
    .select("*")
    .eq("profile_id", user.id)
    .eq("post_id", postId);

  // Handle errors
  if (error) {
    throw new Error(error.message);
  }

  // If there's an existing like, remove it by deleting the entry
  // from the 'like' table with the user's profile ID and post ID
  if (data && data.length > 0) {
    const { error: deleteError } = await supabase.from("like").delete().match({
      profile_id: user.id,
      post_id: postId,
    });

    // Handle errors
    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return;
  }

  // Otherwise, insert a new like for the user with the post ID
  const { error: insertError } = await supabase.from("like").insert({
    profile_id: user.id,
    post_id: postId,
  });

  // Handle errors
  if (insertError) {
    throw new Error(insertError.message);
  }

  // No return needed if success -- we simply end the function as it
  // has done its job
};

/**
 * This function creates a new post for the user.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param content - Content of the post.
 * @param file - Optional file to upload as an attachment.
 */
export const createPost = async (
  supabase: SupabaseClient,
  user: User,
  content: string,
  file: File | null,
): Promise<void> => {
  // First we insert the post into the database and get the ID
  // of the new post
  const { data: insertedData, error: insertError } = await supabase
    .from("post")
    .insert({
      author_id: user.id,
      content,
      // I could have just relied on DB's default value for this,
      // but according to an article I read recently, setting it
      // in the query is a good practice for consistency...
      // Also new Date() returns a date with timezone info, which
      // is what we want for our database (with timestamptz type)
      posted_at: new Date(),
    })
    .select("id") // get the ID of the newly created post
    .single(); // we only expect one post to be created

  // Handle errors
  if (insertError) {
    throw new Error(insertError.message);
  }

  // Edge case: no data returned but no error either
  if (!insertedData) {
    throw new Error("Post insertion failed or returned no data.");
  }

  // Extract the ID of the newly created post as a string to avoid
  // type errors later
  const postId = insertedData.id as string;

  // If a file was provided, also upload it to the images bucket
  if (file) {
    const { data: fileData, error: fileError } = await supabase.storage
      .from("images")
      .upload(postId, file, {
        upsert: false, // do not overwrite if it already exists
      });

    // Handle errors
    if (fileError) {
      throw new Error(fileError.message);
    }

    // If upload succeeds, update the post with the attachment URL
    // to the path of the file we just uploaded. This ensures that
    // the post can display the image correctly.
    if (fileData) {
      const { error: updateError } = await supabase
        .from("post")
        .update({ attachment_url: fileData.path })
        .eq("id", postId);

      // Handle errors
      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  }

  // If everything succeeds, we simply end the function silently
  // as it has done its job
};
