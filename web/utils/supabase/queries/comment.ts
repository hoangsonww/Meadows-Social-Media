import { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import {
  CommentVibeValue,
  Notification,
  NotificationPage,
  PostComment,
  PostCommentsPage,
} from "../models/comment";
import { PostAuthor } from "../models/post";

export type CommentVibe = z.infer<typeof CommentVibeValue>;
export type CommentSort = "top" | "newest";

export type CreatePostCommentInput = {
  postId: string;
  content: string;
  parentCommentId?: string | null;
  image?: File | null;
};

const MAX_COMMENT_LENGTH = 500;
const MAX_REPLY_PREVIEW = 2;

const commentSelect = `
  id,
  post_id,
  author_id,
  parent_comment_id,
  content,
  image_url,
  created_at,
  updated_at,
  reply_count,
  vibe_count,
  engagement_score,
  author:author_id (
    id,
    name,
    handle,
    avatar_url
  ),
  vibes:post_comment_vibe_reaction (
    profile_id,
    vibe
  )
`;

const mentionPattern = /(^|\s)@([a-zA-Z0-9_]{2,32})/g;

const normalizeCommentContent = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.slice(0, MAX_COMMENT_LENGTH);
};

const parseMentionHandles = (value: string): string[] => {
  const handles = new Set<string>();
  let match: RegExpExecArray | null = mentionPattern.exec(value);

  while (match) {
    handles.add(match[2].toLowerCase());
    match = mentionPattern.exec(value);
  }

  mentionPattern.lastIndex = 0;
  return Array.from(handles);
};

const uploadCommentImage = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
  image: File,
): Promise<string> => {
  const rawName = image.name ?? "";
  const ext = rawName.includes(".")
    ? `.${rawName.split(".").pop()?.toLowerCase() ?? "jpg"}`
    : "";
  const path = `comments/${postId}/${user.id}-${Date.now()}${ext}`;

  const { data, error } = await supabase.storage.from("images").upload(path, image, {
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.path) {
    throw new Error("Comment image upload returned no path.");
  }

  return data.path;
};

type NotificationInsert = {
  recipient_id: string;
  actor_id: string | null;
  type: "post_comment" | "comment_reply" | "comment_mention" | "comment_vibe";
  post_id: string | null;
  comment_id: string | null;
  payload: Record<string, unknown>;
};

const insertNotifications = async (
  supabase: SupabaseClient,
  rows: NotificationInsert[],
): Promise<void> => {
  if (rows.length === 0) return;

  const dedupedMap = new Map<string, NotificationInsert>();
  rows.forEach((row) => {
    const key = [
      row.recipient_id,
      row.actor_id ?? "",
      row.type,
      row.post_id ?? "",
      row.comment_id ?? "",
    ].join(":");
    dedupedMap.set(key, row);
  });

  const dedupedRows = Array.from(dedupedMap.values());
  const { error } = await supabase.from("notification").insert(dedupedRows);
  if (error) {
    throw new Error(error.message);
  }
};

const getMentionProfiles = async (
  supabase: SupabaseClient,
  handles: string[],
): Promise<z.infer<typeof PostAuthor>[]> => {
  if (handles.length === 0) return [];

  const { data, error } = await supabase
    .from("profile")
    .select("id, name, handle, avatar_url")
    .in("handle", handles);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return [];

  return PostAuthor.array().parse(data);
};

export const getMentionSuggestions = async (
  supabase: SupabaseClient,
  query: string,
  limit = 6,
): Promise<z.infer<typeof PostAuthor>[]> => {
  const term = query.trim().replace(/^@/, "").toLowerCase();
  if (term.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("profile")
    .select("id, name, handle, avatar_url")
    .ilike("handle", `${term}%`)
    .order("handle", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 10)));

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return PostAuthor.array().parse(data);
};

export const createPostComment = async (
  supabase: SupabaseClient,
  user: User,
  input: CreatePostCommentInput,
): Promise<z.infer<typeof PostComment>> => {
  const normalizedContent = normalizeCommentContent(input.content);
  const image = input.image ?? null;

  if (!normalizedContent && !image) {
    throw new Error("Comment content is required.");
  }

  if (input.content.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment can be up to ${MAX_COMMENT_LENGTH} characters.`);
  }

  const imagePath = image
    ? await uploadCommentImage(supabase, user, input.postId, image)
    : null;

  const { data: inserted, error: insertError } = await supabase
    .from("post_comment")
    .insert({
      post_id: input.postId,
      author_id: user.id,
      parent_comment_id: input.parentCommentId ?? null,
      content: normalizedContent,
      image_url: imagePath,
      updated_at: new Date().toISOString(),
    })
    .select(commentSelect)
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  const parsed = PostComment.parse(inserted);

  const [postResult, parentResult] = await Promise.all([
    supabase
      .from("post")
      .select("author_id")
      .eq("id", input.postId)
      .maybeSingle(),
    input.parentCommentId
      ? supabase
          .from("post_comment")
          .select("author_id")
          .eq("id", input.parentCommentId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (postResult.error) {
    throw new Error(postResult.error.message);
  }

  if (parentResult.error) {
    throw new Error(parentResult.error.message);
  }

  const notifications: NotificationInsert[] = [];
  const mentionHandles = parseMentionHandles(input.content);
  const mentionedProfiles = await getMentionProfiles(supabase, mentionHandles);
  const mentionRows = mentionedProfiles
    .filter((profile) => profile.id !== user.id)
    .map((profile) => ({
      comment_id: parsed.id,
      mentioned_profile_id: profile.id,
    }));

  if (mentionRows.length > 0) {
    const { error: mentionInsertError } = await supabase
      .from("post_comment_mention")
      .upsert(mentionRows, { onConflict: "comment_id,mentioned_profile_id" });

    if (mentionInsertError) {
      throw new Error(mentionInsertError.message);
    }
  }

  if (postResult.data?.author_id && postResult.data.author_id !== user.id) {
    notifications.push({
      recipient_id: postResult.data.author_id,
      actor_id: user.id,
      type: "post_comment",
      post_id: input.postId,
      comment_id: parsed.id,
      payload: {
        snippet: (normalizedContent ?? "").slice(0, 120),
      },
    });
  }

  if (
    input.parentCommentId &&
    parentResult.data?.author_id &&
    parentResult.data.author_id !== user.id
  ) {
    notifications.push({
      recipient_id: parentResult.data.author_id,
      actor_id: user.id,
      type: "comment_reply",
      post_id: input.postId,
      comment_id: parsed.id,
      payload: {
        snippet: (normalizedContent ?? "").slice(0, 120),
      },
    });
  }

  mentionedProfiles
    .filter((profile) => profile.id !== user.id)
    .forEach((profile) => {
      notifications.push({
        recipient_id: profile.id,
        actor_id: user.id,
        type: "comment_mention",
        post_id: input.postId,
        comment_id: parsed.id,
        payload: {
          handle: profile.handle,
          snippet: (normalizedContent ?? "").slice(0, 120),
        },
      });
    });

  await insertNotifications(supabase, notifications);
  return parsed;
};

export const getPostComments = async (
  supabase: SupabaseClient,
  user: User,
  postId: string,
  cursor: number,
  limit = 10,
  sort: CommentSort = "top",
): Promise<z.infer<typeof PostCommentsPage>> => {
  let query = supabase
    .from("post_comment")
    .select(commentSelect)
    .eq("post_id", postId)
    .is("parent_comment_id", null)
    .range(cursor, cursor + limit - 1);

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("engagement_score", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const topComments = PostComment.array().parse(data ?? []);
  const topIds = topComments.map((comment) => comment.id);

  let replies: z.infer<typeof PostComment>[] = [];
  if (topIds.length > 0) {
    const { data: replyData, error: replyError } = await supabase
      .from("post_comment")
      .select(commentSelect)
      .eq("post_id", postId)
      .in("parent_comment_id", topIds)
      .order("created_at", { ascending: true })
      .limit(500);

    if (replyError) {
      throw new Error(replyError.message);
    }

    replies = PostComment.array().parse(replyData ?? []);
  }

  const replyMap = new Map<string, z.infer<typeof PostComment>[]>();
  replies.forEach((reply) => {
    const key = reply.parent_comment_id;
    if (!key) return;
    const list = replyMap.get(key) ?? [];
    list.push(reply);
    replyMap.set(key, list);
  });

  const comments = topComments.map((comment) => ({
    ...comment,
    replies: (replyMap.get(comment.id) ?? []).slice(0, comment.reply_count),
  }));

  return PostCommentsPage.parse({
    comments,
    nextCursor: topComments.length >= limit ? cursor + topComments.length : null,
    hasMore: topComments.length >= limit,
  });
};

export const deletePostComment = async (
  supabase: SupabaseClient,
  user: User,
  commentId: string,
): Promise<void> => {
  const { data: existing, error: readError } = await supabase
    .from("post_comment")
    .select("id")
    .eq("id", commentId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (!existing) {
    throw new Error("Comment not found or not owned by current user.");
  }

  const { error: deleteError } = await supabase
    .from("post_comment")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
};

export const reportPostComment = async (
  supabase: SupabaseClient,
  user: User,
  commentId: string,
  reason: string,
  details: string | null = null,
): Promise<void> => {
  const normalizedReason = reason.trim().slice(0, 80);
  const normalizedDetails = details?.trim().slice(0, 500) ?? null;

  if (normalizedReason.length < 2) {
    throw new Error("A report reason is required.");
  }

  const { error } = await supabase.from("post_comment_report").upsert(
    {
      comment_id: commentId,
      reporter_id: user.id,
      reason: normalizedReason,
      details: normalizedDetails,
    },
    { onConflict: "comment_id,reporter_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
};

export const setCommentVibe = async (
  supabase: SupabaseClient,
  user: User,
  commentId: string,
  vibe: CommentVibe | null,
): Promise<void> => {
  const { data: comment, error: commentError } = await supabase
    .from("post_comment")
    .select("id, author_id, post_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError) {
    throw new Error(commentError.message);
  }

  if (!comment) {
    throw new Error("Comment not found.");
  }

  const { data: existing, error: readError } = await supabase
    .from("post_comment_vibe_reaction")
    .select("vibe")
    .eq("comment_id", commentId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  const shouldDelete = !vibe || (existing && existing.vibe === vibe);

  if (shouldDelete && existing) {
    const { error: deleteError } = await supabase
      .from("post_comment_vibe_reaction")
      .delete()
      .match({ comment_id: commentId, profile_id: user.id });

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return;
  }

  if (existing && vibe) {
    const { error: updateError } = await supabase
      .from("post_comment_vibe_reaction")
      .update({ vibe, reacted_at: new Date().toISOString() })
      .match({ comment_id: commentId, profile_id: user.id });

    if (updateError) {
      throw new Error(updateError.message);
    }

    return;
  }

  if (vibe) {
    const { error: insertError } = await supabase
      .from("post_comment_vibe_reaction")
      .insert({
        comment_id: commentId,
        profile_id: user.id,
        vibe,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    if (comment.author_id !== user.id) {
      await insertNotifications(supabase, [
        {
          recipient_id: comment.author_id,
          actor_id: user.id,
          type: "comment_vibe",
          post_id: comment.post_id,
          comment_id: comment.id,
          payload: { vibe },
        },
      ]);
    }
  }
};

const notificationSelect = `
  id,
  recipient_id,
  actor_id,
  type,
  post_id,
  comment_id,
  payload,
  is_read,
  created_at,
  actor:actor_id (
    id,
    name,
    handle,
    avatar_url
  )
`;

export const getMyNotifications = async (
  supabase: SupabaseClient,
  user: User,
  limit = 8,
): Promise<z.infer<typeof NotificationPage>> => {
  const [rowsResult, unreadResult] = await Promise.all([
    supabase
      .from("notification")
      .select(notificationSelect)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(limit, 20))),
    supabase
      .from("notification")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false),
  ]);

  if (rowsResult.error) {
    throw new Error(rowsResult.error.message);
  }

  if (unreadResult.error) {
    throw new Error(unreadResult.error.message);
  }

  const notifications = Notification.array().parse(rowsResult.data ?? []);
  const unreadCount = unreadResult.count ?? 0;

  return NotificationPage.parse({
    notifications,
    unreadCount,
  });
};

export const markMyNotificationsRead = async (
  supabase: SupabaseClient,
  user: User,
  notificationIds?: string[],
): Promise<void> => {
  let query = supabase
    .from("notification")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (notificationIds && notificationIds.length > 0) {
    query = query.in("id", notificationIds);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
};

export const getReplyPreviewLimit = (): number => MAX_REPLY_PREVIEW;
export const getMaxCommentLength = (): number => MAX_COMMENT_LENGTH;
