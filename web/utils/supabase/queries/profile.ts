import { SupabaseClient, User } from "@supabase/supabase-js";
import { Post, PostAuthor } from "../models/post";
import { z } from "zod";

/**
 * This function retrieves the profile data for a given profile ID.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param profileId - Profile ID to retrieve data for.
 * @returns - Profile data for the given profile ID.
 */
export const getProfileData = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string,
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
 * This function retrieves the list of profiles that the active user is following.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @returns - An array of PostAuthor objects representing the profiles
 */
export const getFollowing = async (
  supabase: SupabaseClient,
  user: User,
): Promise<z.infer<typeof PostAuthor>[]> => {
  // We want to get the 'following_id' from 'follow', then
  // select all relevant profile fields from that user
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
    `,
    )
    .eq("follower_id", user.id);
  // "'following:following_id' joins and renames the related following user data

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
 * This function retrieves the posts for a given profile ID.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param profileId - Profile ID to retrieve posts for.
 * @param cursor - The starting point for pagination.
 * @returns - An array of Post objects representing the posts
 */
export const getProfilePosts = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string,
  cursor: number,
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
    `,
    )
    .eq("author_id", profileId)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);
  // "author:author_id" joins and renames the related author user data
  // "likes:like" joins and renames the related like data

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
 * This function toggles the following status of a profile for the active user.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param profileId - Profile ID to toggle following status for.
 * @returns - void
 */
export const toggleFollowing = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string,
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
 * This function updates the profile picture of the active user.
 *
 * @param supabase - Supabase client to use.
 * @param user - Active user making the request.
 * @param file - The file to upload as the new profile picture.
 * @returns - void
 */
export const updateProfilePicture = async (
  supabase: SupabaseClient,
  user: User,
  file: File | null,
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
 * This function retrieves the followers of a given profile ID.
 *
 * @param supabase The Supabase client to use
 * @param profileId The ID of the profile to get followers for
 * @returns An array of PostAuthor objects representing the followers
 */
export const getProfileFollowers = async (
  supabase: SupabaseClient,
  profileId: string,
): Promise<z.infer<typeof PostAuthor>[]> => {
  // Select the followers of the given profile ID, with all relevant fields
  const { data, error } = await supabase
    .from("follow")
    .select(
      `
      follower:follower_id (
        id,
        name,
        handle,
        avatar_url
      )
    `,
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

/**
 * This function retrieves the following people of a given profile ID.
 *
 * @param supabase The Supabase client to use
 * @param profileId The ID of the profile to get following for
 * @returns An array of PostAuthor objects representing the following
 */
export const getProfileFollowing = async (
  supabase: SupabaseClient,
  profileId: string,
): Promise<z.infer<typeof PostAuthor>[]> => {
  // Select the following of the given profile ID, with all relevant fields
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
    `,
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
