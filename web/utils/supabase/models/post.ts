/**
 * This file contains all of the Zod validation models
 * used to ensure that our Supabase query functions
 * ultimately return data in the correct format.
 *
 * Zod is the industry standard for schema validation.
 * It allows for easy casting of and validation of data.
 *
 * Zod types are defined as objects that contains fields.
 * We can compose Zod types as well as shown below.
 *
 * To access the pure type of any Zod model, we can use:
 * z.infer<typeof Model>
 *
 * In the future, we will use Zod in many more places, so
 * it is good to introduce it here.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

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

/**
 * Helper variables containing empty models so that
 * `npm run dev` runs when on the blank starter code.
 */

export const emptyPostAuthor = PostAuthor.parse({
  id: "",
  name: "",
  handle: "",
  avatar_url: null,
});

export const emptyPostLikes = PostLikes.parse({
  profile_id: "",
});

export const emptyPost = Post.parse({
  id: "",
  content: "",
  posted_at: new Date(),
  author: emptyPostAuthor,
  likes: [],
  attachment_url: null,
});
