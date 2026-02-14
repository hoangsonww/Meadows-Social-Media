import { z } from "zod";

/** Defines allowed vibe reaction values for posts. */
export const PostVibeValue = z.enum(["aura_up", "real", "mood", "chaotic"]);

/** Defines the schema for profile and author data. */
export const PostAuthor = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  avatar_url: z.string().nullable(),
});

/** Defines the schema for individual likes. */
export const PostLikes = z.object({
  profile_id: z.string(),
});

/** Defines the schema for individual vibe reactions. */
export const PostVibe = z.object({
  profile_id: z.string(),
  vibe: PostVibeValue,
});

/** Defines a single image attachment entry for a post. */
export const PostAttachment = z.object({
  path: z.string(),
  position: z.number({ coerce: true }),
});

/** Defines a single poll vote on an option. */
export const PostPollVote = z.object({
  profile_id: z.string(),
});

/** Defines a poll option and all votes tied to it. */
export const PostPollOption = z.object({
  id: z.string(),
  label: z.string(),
  position: z.number({ coerce: true }),
  votes: PostPollVote.array(),
});

/** Defines poll data attached to a post. */
export const PostPoll = z.object({
  question: z.string().nullable(),
  options: PostPollOption.array(),
});

const NullablePostPoll = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}, PostPoll.nullable());

const PostAttachmentsArray = z.preprocess((value) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}, PostAttachment.array());

/** Defines the schema for posts. */
export const Post = z.object({
  id: z.string(),
  content: z.string(),
  posted_at: z.date({ coerce: true }),
  author: PostAuthor,
  likes: PostLikes.array(),
  vibes: PostVibe.array(),
  attachments: PostAttachmentsArray,
  poll: NullablePostPoll,
  attachment_url: z.string().nullable(),
});

/** Defines the schema for following data. */
export const Following = z.object({
  following: PostAuthor,
});

/** Defines the schema for empty author payloads. */
export const emptyPostAuthor = PostAuthor.parse({
  id: "",
  name: "",
  handle: "",
  avatar_url: null,
});

/** Defines the schema for empty likes. */
export const emptyPostLikes = PostLikes.parse({
  profile_id: "",
});

/** Defines the schema for empty vibes. */
export const emptyPostVibe = PostVibe.parse({
  profile_id: "",
  vibe: "real",
});

/** Defines the schema for empty posts. */
export const emptyPost = Post.parse({
  id: "",
  content: "",
  posted_at: new Date(),
  author: emptyPostAuthor,
  likes: [],
  vibes: [],
  attachments: [],
  poll: null,
  attachment_url: null,
});
