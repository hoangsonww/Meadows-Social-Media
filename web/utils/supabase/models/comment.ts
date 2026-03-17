import { z } from "zod";
import { PostAuthor } from "./post";
import { VIBE_VALUES } from "../../vibe";

export const CommentVibeValue = z.enum(VIBE_VALUES);
export const NotificationType = z.enum([
  "post_comment",
  "comment_reply",
  "comment_mention",
  "comment_vibe",
]);

export const CommentVibeReaction = z.object({
  profile_id: z.string(),
  vibe: CommentVibeValue,
});

const NullablePostAuthor = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}, PostAuthor.nullable());

const CommentVibeReactionArray = z.preprocess((value) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}, CommentVibeReaction.array());

export const PostComment = z.object({
  id: z.string(),
  post_id: z.string(),
  author_id: z.string(),
  parent_comment_id: z.string().nullable(),
  content: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.date({ coerce: true }),
  updated_at: z.date({ coerce: true }),
  reply_count: z.number({ coerce: true }).default(0),
  vibe_count: z.number({ coerce: true }).default(0),
  engagement_score: z.number({ coerce: true }).default(0),
  author: NullablePostAuthor,
  vibes: CommentVibeReactionArray,
});

export const PostCommentThread = PostComment.extend({
  replies: PostComment.array(),
});

export const PostCommentsPage = z.object({
  comments: PostCommentThread.array(),
  nextCursor: z.number().nullable(),
  hasMore: z.boolean(),
});

export const Notification = z.object({
  id: z.string(),
  recipient_id: z.string(),
  actor_id: z.string().nullable(),
  type: NotificationType,
  post_id: z.string().nullable(),
  comment_id: z.string().nullable(),
  payload: z.record(z.unknown()),
  is_read: z.boolean(),
  created_at: z.date({ coerce: true }),
  actor: NullablePostAuthor,
});

export const NotificationPage = z.object({
  notifications: Notification.array(),
  unreadCount: z.number({ coerce: true }).default(0),
});
