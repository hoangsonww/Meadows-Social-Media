/**
 * /queries/profile contains all of the Supabase queries for
 * creating, reading, updating, and deleting data in our
 * database relating to profiles.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { SupabaseClient, User } from "@supabase/supabase-js";
import { emptyPostAuthor, Following, Post, PostAuthor } from "../models/post";
import { z } from "zod";

/**
 * TODO: Loads data for a specific profile given its ID.
 *
 * The data returned should match the format of the
 * `PostAuthor` Zod model.
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to view any profile you added in your
 *       database at the route:
 *       /profile/:id
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param profileId: Profile data to retrieve.
 * @returns: Profile object.
 */
export const getProfileData = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string
): Promise<z.infer<typeof PostAuthor>> => {
  // ... your implementation here ...
  return PostAuthor.parse(emptyPostAuthor);
};

/**
 * TODO: Retrieve all of the accounts that the user is following.
 *
 * The data returned should match the format of an array of
 * `PostAuthor` Zod models. Make sure to select the correct
 * columns and perform any joins that are necessary. Note that the
 * data returned from the `follow` table might not exactly match the
 * return format above, which sometimes is a common occurrence when
 * working on backend functionality. Make sure to perform any modification
 * to flatten the data into just the expected `PostAuthor[]` return type.
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to see whether or not you are following a profile on
 *       the page for any profile.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request (user to find followers for)
 */
export const getFollowing = async (
  supabase: SupabaseClient,
  user: User
): Promise<z.infer<typeof PostAuthor>[]> => {
  // ... your implementation here ...
  return [];
};

/**
 * TODO: Loads data for a profile's post feed.
 *
 * This function should the most recent posts in the
 * `post` database in reverse chronological order
 * (so that the *most recent posts* appear first)
 * that were posted by the profile with the given ID.
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
 *       see posts on the page for any profile at the route:
 *      /profile/:id
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param profileId: Profile ID to retrieve posts for.
 * @param cursor: Starting index of the page.
 * @returns: Post object.
 */
export const getProfilePosts = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string,
  cursor: number
): Promise<z.infer<typeof Post>[]> => {
  // ... your implementation here ...
  return [];
};

/**
 * TODO: Toggles whether or not the active user is following
 * another profile.
 *
 * If the user has already following the profile, remove the follow
 * by deleting an entry from the `follow` table.
 *
 * If the user is not already following the profile, add a follow
 * by creating an entry on the `follow` table.
 *
 * Ensure to throw errors if present.
 *
 * This method should succeed silently (return nothing).
 *
 * @note Once you implement this method, you should be able to follow
 *       and unfollow profiles on the page for any profile. Refresh
 *       the page to see the changes persist. Test this at the route:
 *       /profile/:id
 *
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param profileId: ID of the profile to follow.
 */

export const toggleFollowing = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string
): Promise<void> => {
  // ... your implementation here ...
};

/**
 * TODO: Updates a user's avatar in Supabase storage.
 *
 * This particular function is best performed in two parts:
 *
 * 1. If no file has been provided, that means that the user is
 *    trying to delete their profile photo. In this case, you
 *    will want to update the `avatar_url` field in the `profile`
 *    table to be `null`.
 *
 * 2. If a file has been provided, that means we want to either upload
 *    OR update the file in Supabase storage. The file should be
 *    uploaded to the `avatars` bucket. The name of the file should be
 *    the *ID of the user!* Do NOT include any extensions (like .png or
 *    .jpg) because it will make finding this image later more difficult.
 *
 * 3. When the file upload succeeds, we then want to *update* the
 *    profile we just made to change its `avatar_url` to the path
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
 * @param file: The avatar attachment, if any.
 */
export const updateProfilePicture = async (
  supabase: SupabaseClient,
  user: User,
  file: File | null
): Promise<void> => {
  // ... your implementation here ...
};
