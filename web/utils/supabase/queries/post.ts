import { SupabaseClient, User } from "@supabase/supabase-js";
import { Post, PostVibeValue } from "../models/post";
import { z } from "zod";

export type PostVibe = z.infer<typeof PostVibeValue>;
export type PostPollDraft = {
  question?: string | null;
  options: string[];
};
export type PostMediaInput = File[] | File | null;

const postSelect = `
  id,
  content,
  posted_at,
  attachment_url,
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
`;

export const getPost = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
): Promise<z.infer<typeof Post> | null> => {
  const { data, error } = await supabase
    .from("post")
    .select(postSelect)
    .eq("id", postId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return Post.parse(data);
};

export const getFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number,
): Promise<z.infer<typeof Post>[]> => {
  const { data, error } = await supabase
    .from("post")
    .select(postSelect)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return Post.array().parse(data);
};

export const getFollowingFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number,
): Promise<z.infer<typeof Post>[]> => {
  const { data: followingData, error: followError } = await supabase
    .from("follow")
    .select("following_id")
    .eq("follower_id", user.id);

  if (followError) {
    throw new Error(followError.message);
  }

  if (!followingData || followingData.length === 0) {
    return [];
  }

  const followingIDs = followingData.map((f) => f.following_id);

  const { data, error } = await supabase
    .from("post")
    .select(postSelect)
    .in("author_id", followingIDs)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return Post.array().parse(data);
};

export const getLikesFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number,
): Promise<z.infer<typeof Post>[]> => {
  const { data: likeData, error: likeError } = await supabase
    .from("like")
    .select("post_id")
    .eq("profile_id", user.id);

  if (likeError) {
    throw new Error(likeError.message);
  }

  if (!likeData || likeData.length === 0) {
    return [];
  }

  const likedPostIDs = likeData.map((like) => like.post_id);

  const { data, error } = await supabase
    .from("post")
    .select(postSelect)
    .in("id", likedPostIDs)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return Post.array().parse(data);
};

export const getMyPosts = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number,
): Promise<z.infer<typeof Post>[]> => {
  const { data, error } = await supabase
    .from("post")
    .select(postSelect)
    .eq("author_id", user.id)
    .order("posted_at", { ascending: false })
    .range(cursor, cursor + 24);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return Post.array().parse(data);
};

export const toggleLike = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
): Promise<void> => {
  const { data, error } = await supabase
    .from("like")
    .select("*")
    .eq("profile_id", user.id)
    .eq("post_id", postId);

  if (error) {
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    const { error: deleteError } = await supabase.from("like").delete().match({
      profile_id: user.id,
      post_id: postId,
    });

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return;
  }

  const { error: insertError } = await supabase.from("like").insert({
    profile_id: user.id,
    post_id: postId,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
};

export const setPostVibe = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
  vibe: PostVibe | null,
): Promise<void> => {
  const { data: existing, error: readError } = await supabase
    .from("vibe_reaction")
    .select("vibe")
    .eq("profile_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  const shouldDelete = !vibe || (existing && existing.vibe === vibe);

  if (shouldDelete && existing) {
    const { error: deleteError } = await supabase
      .from("vibe_reaction")
      .delete()
      .match({ profile_id: user.id, post_id: postId });

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return;
  }

  if (existing && vibe) {
    const { error: updateError } = await supabase
      .from("vibe_reaction")
      .update({ vibe })
      .match({ profile_id: user.id, post_id: postId });

    if (updateError) {
      throw new Error(updateError.message);
    }

    return;
  }

  if (vibe) {
    const { error: insertError } = await supabase.from("vibe_reaction").insert({
      post_id: postId,
      profile_id: user.id,
      vibe,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
};

export const voteOnPostPoll = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
  optionId: string,
): Promise<void> => {
  const { data: option, error: optionError } = await supabase
    .from("post_poll_option")
    .select("id")
    .eq("id", optionId)
    .eq("post_id", postId)
    .maybeSingle();

  if (optionError) {
    throw new Error(optionError.message);
  }

  if (!option) {
    throw new Error("Poll option not found.");
  }

  const { data: existingVote, error: readVoteError } = await supabase
    .from("post_poll_vote")
    .select("option_id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (readVoteError) {
    throw new Error(readVoteError.message);
  }

  if (existingVote && existingVote.option_id === optionId) {
    const { error: deleteError } = await supabase
      .from("post_poll_vote")
      .delete()
      .match({ post_id: postId, profile_id: user.id });

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return;
  }

  const { error: upsertError } = await supabase.from("post_poll_vote").upsert(
    {
      post_id: postId,
      option_id: optionId,
      profile_id: user.id,
      voted_at: new Date(),
    },
    {
      onConflict: "post_id,profile_id",
    },
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }
};

export const createPost = async (
  supabase: SupabaseClient,
  user: User,
  content: string,
  media: PostMediaInput,
  poll: PostPollDraft | null = null,
): Promise<void> => {
  const { data: insertedData, error: insertError } = await supabase
    .from("post")
    .insert({
      author_id: user.id,
      content,
      posted_at: new Date(),
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  if (!insertedData) {
    throw new Error("Post insertion failed or returned no data.");
  }

  const postId = insertedData.id as string;

  const files = Array.isArray(media) ? media : media ? [media] : [];
  const acceptedFiles = files.slice(0, 8);

  if (acceptedFiles.length > 0) {
    const uploadedPaths: string[] = [];

    for (const [index, file] of acceptedFiles.entries()) {
      const rawName =
        typeof (file as File).name === "string" ? (file as File).name : "";
      const ext = rawName.includes(".")
        ? `.${rawName.split(".").pop()?.toLowerCase() ?? "jpg"}`
        : "";
      const uploadPath = `${postId}/${Date.now()}-${index + 1}${ext}`;

      const { data: fileData, error: fileError } = await supabase.storage
        .from("images")
        .upload(uploadPath, file, {
          upsert: false,
        });

      if (fileError) {
        throw new Error(fileError.message);
      }

      if (fileData?.path) {
        uploadedPaths.push(fileData.path);
      }
    }

    if (uploadedPaths.length > 0) {
      const { error: attachmentInsertError } = await supabase
        .from("post_attachment")
        .insert(
          uploadedPaths.map((path, index) => ({
            post_id: postId,
            path,
            position: index + 1,
          })),
        );

      if (attachmentInsertError) {
        throw new Error(attachmentInsertError.message);
      }

      const { error: updateError } = await supabase
        .from("post")
        .update({ attachment_url: uploadedPaths[0] })
        .eq("id", postId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  }

  if (poll) {
    const uniqueOptions = Array.from(
      new Set(
        poll.options
          .map((option) => option.trim())
          .filter((option) => option.length > 0),
      ),
    ).slice(0, 4);

    if (uniqueOptions.length >= 2) {
      const { error: pollError } = await supabase.from("post_poll").insert({
        post_id: postId,
        question: poll.question?.trim() || null,
      });

      if (pollError) {
        throw new Error(pollError.message);
      }

      const { error: optionError } = await supabase
        .from("post_poll_option")
        .insert(
          uniqueOptions.map((label, index) => ({
            post_id: postId,
            label,
            position: index + 1,
          })),
        );

      if (optionError) {
        throw new Error(optionError.message);
      }
    }
  }
};
