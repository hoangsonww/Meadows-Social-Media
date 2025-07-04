const {
  PostAuthor,
  PostLikes,
  Post,
  Following,
  emptyPostAuthor,
  emptyPostLikes,
  emptyPost,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("../utils/supabase/models/post");

describe("Zod schemas for posts", () => {
  it("PostAuthor parses a valid object", () => {
    const v = { id: "1", name: "Alice", handle: "alice", avatar_url: null };
    expect(PostAuthor.parse(v)).toEqual(v);
  });

  it("PostLikes parses a valid object", () => {
    const v = { profile_id: "2" };
    expect(PostLikes.parse(v)).toEqual(v);
  });

  it("Post parses and coerces its posted_at to a Date", () => {
    const now = new Date().toISOString();
    const inp = {
      id: "3",
      content: "hello",
      posted_at: now,
      author: { id: "a", name: "n", handle: "h", avatar_url: null },
      likes: [{ profile_id: "x" }],
      attachment_url: null,
    };
    const out = Post.parse(inp);
    expect(out.id).toBe("3");
    expect(out.posted_at).toBeInstanceOf(Date);
  });

  it("Following schema works", () => {
    const v = {
      following: { id: "f", name: "n", handle: "h", avatar_url: null },
    };
    expect(Following.parse(v)).toEqual(v);
  });

  it("emptyPostAuthor / emptyPostLikes / emptyPost are valid defaults", () => {
    expect(emptyPostAuthor).toHaveProperty("id", "");
    expect(emptyPostLikes).toHaveProperty("profile_id", "");
    expect(emptyPost).toHaveProperty("id", "");
  });
});
