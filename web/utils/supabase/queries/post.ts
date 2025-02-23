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
import { emptyPost, Post } from "../models/post";
import { z } from "zod";

/**
 * TODO: Loads data for a specific post given its ID.
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
  // ... your implementation here ...
  return Post.parse(emptyPost);
};

/**
 * TODO: Loads data for the user's post feed.
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
 *
 * Ensure to throw errors if present.
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
  // ... your implementation here ...
  return Post.array().parse([]);
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
  // ... your implementation here ...
  return Post.array().parse([]);
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
  // ... your implementation here ...
  return Post.array().parse([]);
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
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param postId: ID of the post to work with.
 */
export const toggleLike = async (
  supabase: SupabaseClient,
  user: User,
  postId: string
): Promise<void> => {
  // ... your implementation here ...
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
  // ... your implementation here ...
};
