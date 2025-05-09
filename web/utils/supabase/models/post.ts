import { z } from "zod";

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

/** Defines the schema for posts. */
export const Post = z.object({
  id: z.string(),
  content: z.string(),
  posted_at: z.date({ coerce: true }),
  author: PostAuthor,
  likes: PostLikes.array(),
  attachment_url: z.string().nullable(),
});

/** Defines thes schema for following data. */
export const Following = z.object({
  following: PostAuthor,
});

/** Defines the schema for followers. */
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

/** Defines the schema for empty posts. */
export const emptyPost = Post.parse({
  id: "",
  content: "",
  posted_at: new Date(),
  author: emptyPostAuthor,
  likes: [],
  attachment_url: null,
});
