/**
 * /queries/posts contains all of the Supabase queries for
 * creating, reading, updating, and deleting data in our
 * database relating to posts.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { SupabaseClient, User } from "@supabase/supabase-js";
import { Post } from "../models/post";
import { z } from "zod";

/**
 * TODO: (DONE) Loads data for a specific post given its ID.
 *
 * The data returned should match the format of the
 * `Post` Zod model. Make sure to select the correct
 * columns and perform any joins that are necessary.
 * Refer to the Supabase documentation for details.
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to view any post you added in your
 *       database at the route:
 *       /post/:id
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param postId: Post data to retrieve.
 * @returns: Post object.
 */
export const getPost = async (
  supabase: SupabaseClient,
  user: User,
  postId: string
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
    `
    )
    .eq("id", postId)
    .single();

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
 * TODO: (DONE) Loads data for the user's post feed.
 *
 * This function should the most recent posts in the
 * `post` database in reverse chronological order
 * (so that the *most recent posts* appear first).
 *
 * This method takes is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the post to load. Each page should be a length
 * of 25 posts long. For example, if the database
 * contains 100 posts and the cursor is set to 10, posts
 * 10 through 35 should be loaded.
 *
 * The data returned should match the format of an array of
 * `Post` Zod models. Make sure to select the correct
 * columns and perform any joins that are necessary.
 * Refer to the Supabase documentation for details.
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to view recent posts at the route:
 *       /
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Post object.
 */
export const getFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number
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
    `
    )
    .order("posted_at", { ascending: false })
    // Supabase ranges are inclusive, so range(cursor, cursor + 24)
    .range(cursor, cursor + 24);

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
 * TODO: Loads data for the user's 'following' post feed.
 *
 * This function should the most recent posts in the
 * `post` database in reverse chronological order
 * (so that the *most recent posts* appear first) made by
 * accounts that the user follows.
 *
 * This method takes is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the post to load. Each page should be a length
 * of 25 posts long. For example, if the database
 * contains 100 posts and the cursor is set to 10, posts
 * 10 through 35 should be loaded.
 *
 * The data returned should match the format of an array of
 * `Post` Zod models. Make sure to select the correct
 * columns and perform any joins that are necessary.
 * Refer to the Supabase documentation for details.
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 *
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to view your recents feed at the route:
 *       /
 *       (Navigate to the following tab)
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Post object.
 */
export const getFollowingFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number
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
    `
    )
    .in("author_id", followingIDs)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);

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
 * TODO: Loads data for the user's 'likes' post feed.
 *
 * This function should the most recent posts in the
 * `post` database in reverse chronological order
 * (so that the *most recent posts* appear first) that
 * the user has liked.
 *
 * HINT: To do this effectively, you may need to write
 * two separate .select() calls - one to fetch all of the
 * post IDs that the user has liked from the `like` table,
 * then again on the post table.
 *
 * This method takes is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the post to load. Each page should be a length
 * of 25 posts long. For example, if the database
 * contains 100 posts and the cursor is set to 10, posts
 * 10 through 35 should be loaded.
 *
 * The data returned should match the format of an array of
 * `Post` Zod models. Make sure to select the correct
 * columns and perform any joins that are necessary.
 * Refer to the Supabase documentation for details.
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 *
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to view your likes feed at the route:
 *       /
 *       (Navigate to the likes tab)
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Post object.
 */
export const getLikesFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number
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
    `
    )
    .in("id", likedPostIDs)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);

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
 * TODO: Toggles whether or not a user has liked a
 * post with a given ID.
 *
 * If the user has already liked the post, remove the like
 * by deleting an entry from the `like` table.
 *
 * If the user has not already liked the post, add a like
 * by creating an entry on the `like` table.
 *
 * Ensure to throw errors if present.
 *
 * This method should succeed silently (return nothing).
 *
 * @note Once you implement this method, you should
 *       be able to toggle likes on a post. To test this,
 *       press the "like" button on any post and refresh.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param postId: ID of the post to work with.
 */
export const toggleLike = async (
  supabase: SupabaseClient,
  user: User,
  postId: string
): Promise<void> => {
  // Check if user already liked the post first
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
 * TODO: Creates a post in the database.
 *
 * This particular function is best performed in three parts:
 *
 * 1. Create a new post in the database and retrieve the post
 *    that was created. This is because we need to access the
 *    ID of the post added so that we can refer to it next.
 *
 * 2. If a file has been provided, we want to add this file
 *    as an image in the `images` bucket in Supabase storage.
 *    The name of the file should be the *ID of the post!*
 *    Do NOT include any extensions (like .png or .jpg) because
 *    it will make finding this image later more difficult.
 *
 * 3. When the file upload succeeds, we then want to *update* the
 *    post we just made to change its `attachment_url` to the path
 *    of the file we just uploaded. This should be accessible from
 *    the data returned from the storage.upload() call using
 *    `fileData.path`. You can skip this step if the user did not
 *    upload any photo / file.
 *
 * Ensure to throw errors if present.
 *
 * This method should succeed silently (return nothing).
 *
 * @note Once you implement this method, you should
 *       be able to create posts on the home page, and the feed
 *       should update to show the new post.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param content: The content of the post to make.
 * @param file: The image attachment, if any, with the post.
 */
export const createPost = async (
  supabase: SupabaseClient,
  user: User,
  content: string,
  file: File | null
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
