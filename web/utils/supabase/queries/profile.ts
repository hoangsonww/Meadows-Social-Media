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
import { Post, PostAuthor } from "../models/post";
import { z } from "zod";

/**
 * TODO: (DONE) Loads data for a specific profile given its ID.
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
  // Select the single profile data for the given profile ID, 
  // with all relevant fields
  const { data, error } = await supabase
    .from("profile")
    .select("id, name, handle, avatar_url")
    .eq("id", profileId)
    .single();

  // If there is an error, throw it
  if (error) {
    throw new Error(error.message);
  }

  // Edge case: no data returned even though there was no error
  if (!data) {
    throw new Error("No data returned for this profile.");
  }

  // Parse the data into a PostAuthor object
  return PostAuthor.parse(data);
};

/**
 * TODO: (DONE) Retrieve all of the accounts that the user is following.
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
  // We want to get the 'following_id' from 'follow', then
  // select all relevant profile fields from that user.
  const { data, error } = await supabase
    .from("follow")
    .select(
      `
      following:following_id (
        id,
        name,
        handle,
        avatar_url
      )
    `
    )
    .eq("follower_id", user.id);

  // If there is an error, throw it
  if (error) {
    throw new Error(error.message);
  }

  // Edge case: no data returned even though there was no error
  if (!data) {
    return [];
  }

  // Data is an array of { following: { ...PostAuthorFields } }
  // So we map it to an array of PostAuthor objects
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const followingList = data.map((item: any) => item.following);

  // Parse the data into an array of PostAuthor objects
  return PostAuthor.array().parse(followingList);
};

/**
 * TODO: (DONE) Loads data for a profile's post feed.
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
  // Select the posts for the given profile ID, with all relevant fields
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
    .eq("author_id", profileId)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);

  // If there is an error, throw it
  if (error) {
    throw new Error(error.message);
  }

  // Edge case: no data returned even though there was no error
  if (!data) {
    return [];
  }

  // Parse the data into an array of Post objects
  return Post.array().parse(data);
};

/**
 * TODO: (DONE) Toggles whether or not the active user is following
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
  // Check if user already follows this profile
  const { data, error } = await supabase
    .from("follow")
    .select("*")
    .eq("follower_id", user.id)
    .eq("following_id", profileId);

  // If there is an error, throw it
  if (error) {
    throw new Error(error.message);
  }

  // If already following, remove the follow
  if (data && data.length > 0) {
    const { error: deleteError } = await supabase
      .from("follow")
      .delete()
      .match({ follower_id: user.id, following_id: profileId });

    // If there is an error, throw it
    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return;
  }

  // Otherwise, we add the follow
  const { error: insertError } = await supabase.from("follow").insert({
    follower_id: user.id,
    following_id: profileId,
  });

  // If there is an error, throw it
  if (insertError) {
    throw new Error(insertError.message);
  }
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
  // No file means deleting the avatar
  if (!file) {
    const { error } = await supabase
      .from("profile")
      .update({ avatar_url: null })
      .eq("id", user.id);

    // If there is an error, throw it
    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  // Upload new file to "avatars" bucket, named by user.id (no extension)
  const { data: fileData, error: fileError } = await supabase.storage
    .from("avatars")
    .upload(user.id, file, {
      upsert: true,
    });

  // If there is an error, throw it
  if (fileError) {
    throw new Error(fileError.message);
  }

  // Update the profile avatar_url with the new path
  if (fileData) {
    // Update the profile with the new avatar URL
    const { error: updateError } = await supabase
      .from("profile")
      .update({
        avatar_url: fileData.path,
      })
      .eq("id", user.id);

    // If there is an error, throw it
    if (updateError) {
      throw new Error(updateError.message);
    }
  }
};

/**
 * I wanna enhance stuff, so I just created a new query for getting
 * the followers of a profile. 
 * 
 * @param supabase The Supabase client to use
 * @param profileId The ID of the profile to get followers for
 * @returns An array of PostAuthor objects representing the followers
 */
export const getProfileFollowers = async (
  supabase: SupabaseClient,
  profileId: string
): Promise<z.infer<typeof PostAuthor>[]> => {
  // Select the followers of the given profile ID, with all relevant fields
  const { data, error } = await supabase
    .from("follow")
    .select(
      `
      follower: follower_id (
        id,
        name,
        handle,
        avatar_url
      )
    `
    )
    .eq("following_id", profileId);

  // If there is an error, throw it
  if (error) {
    throw new Error(error.message);
  }

  // Edge case: no data returned even though there was no error
  if (!data) {
    return [];
  }

  // Data is an array of { follower: { ...PostAuthorFields } }
  // So we map it to an array of PostAuthor objects
  const followersList = data.map((item) => item.follower);

  // Parse the data into an array of PostAuthor objects
  return PostAuthor.array().parse(followersList);
};

// I also created a new query for getting the following of a profile.
// This is similar to the getFollowing query, but it's more specific
// and only gets the following of a specific profile.
export const getProfileFollowing = async (
  supabase: SupabaseClient,
  profileId: string
): Promise<z.infer<typeof PostAuthor>[]> => {
  // Select the following of the given profile ID, with all relevant fields
  const { data, error } = await supabase
    .from("follow")
    .select(
      `
      following: following_id (
        id,
        name,
        handle,
        avatar_url
      )
    `
    )
    .eq("follower_id", profileId);

  // If there is an error, throw it
  if (error) {
    throw new Error(error.message);
  }

  // Edge case: no data returned even though there was no error
  if (!data) {
    return [];
  }

  // Data is an array of { following: { ...PostAuthorFields } }
  // So we map it to an array of PostAuthor objects
  const followingList = data.map((item) => item.following);

  // Parse the data into an array of PostAuthor objects
  return PostAuthor.array().parse(followingList);
};
