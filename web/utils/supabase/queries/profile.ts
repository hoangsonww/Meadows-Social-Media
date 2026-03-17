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
): Promise<z.infer<typeof PostAuthor> | null> => {
  // Select the single profile data for the given profile ID,
  // with all relevant fields
  const { data, error } = await supabase
    .from("profile")
    .select("id, name, handle, avatar_url")
    .eq("id", profileId)
    .maybeSingle();

  // If there is a real DB error, return null
  if (error) {
    return null;
  }

  // No data means "not found" – return null so caller can 404
  if (!data) {
    return null;
  }

  // Parse the data into a PostAuthor object
  return PostAuthor.parse(data);
};

/**
 * Search profiles by handle or display name for typeahead UX.
 *
 * @param supabase - Supabase client to use.
 * @param term - Raw search term.
 * @param limit - Maximum number of results.
 * @returns - Matching profiles ranked by handle relevance.
 */
export const searchProfiles = async (
  supabase: SupabaseClient,
  term: string,
  limit = 8,
): Promise<z.infer<typeof PostAuthor>[]> => {
  const normalizedTerm = term.trim().replace(/[^a-zA-Z0-9_\s.-]/g, "");
  if (!normalizedTerm) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(limit, 12));
  const pattern = `%${normalizedTerm}%`;

  const { data, error } = await supabase
    .from("profile")
    .select("id, name, handle, avatar_url")
    .or(`handle.ilike.${pattern},name.ilike.${pattern}`)
    .order("handle", { ascending: true })
    .limit(safeLimit);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  const profiles = PostAuthor.array().parse(data);
  const lowerTerm = normalizedTerm.toLowerCase();

  const rank = (profile: z.infer<typeof PostAuthor>): number => {
    const handle = profile.handle.toLowerCase();
    const name = profile.name.toLowerCase();

    if (handle === lowerTerm) return 6;
    if (name === lowerTerm) return 5;
    if (handle.startsWith(lowerTerm)) return 4;
    if (name.startsWith(lowerTerm)) return 3;
    if (handle.includes(lowerTerm)) return 2;
    return 1;
  };

  return profiles.sort((a, b) => {
    const scoreDelta = rank(b) - rank(a);
    if (scoreDelta !== 0) return scoreDelta;
    return a.handle.localeCompare(b.handle);
  });
};

/**
 * Resolve a profile by exact handle.
 *
 * @param supabase - Supabase client to use.
 * @param handle - Raw handle with or without leading @.
 * @returns - Matching profile or null.
 */
export const getProfileDataByHandle = async (
  supabase: SupabaseClient,
  handle: string,
): Promise<z.infer<typeof PostAuthor> | null> => {
  const normalizedHandle = handle.trim().replace(/^@/, "").toLowerCase();
  if (!normalizedHandle) {
    return null;
  }

  const { data, error } = await supabase
    .from("profile")
    .select("id, name, handle, avatar_url")
    .ilike("handle", normalizedHandle)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

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
      comment_count,
      attachments:post_attachment (
        path,
        position
      ),
      author:author_id (
        id,
        name,
        handle,
        avatar_url
      ),
      likes:like (
        profile_id
      ),
      vibes:vibe_reaction (
        profile_id,
        vibe
      ),
      poll:post_poll (
        question,
        options:post_poll_option (
          id,
          label,
          position,
          votes:post_poll_vote (
            profile_id
          )
        )
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
