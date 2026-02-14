const {
  PostAuthor,
  PostLikes,
  PostVibe,
  PostVibeValue,
  PostAttachment,
  PostPollVote,
  PostPollOption,
  PostPoll,
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

  it("PostVibe and PostVibeValue parse valid entries", () => {
    expect(PostVibeValue.parse("real")).toBe("real");
    const v = { profile_id: "2", vibe: "mood" };
    expect(PostVibe.parse(v)).toEqual(v);
  });

  it("PostAttachment parses a valid entry", () => {
    const v = { path: "post-id/1.jpg", position: 1 };
    expect(PostAttachment.parse(v)).toEqual(v);
  });

  it("PostPoll pieces parse valid entries", () => {
    const vote = { profile_id: "u1" };
    expect(PostPollVote.parse(vote)).toEqual(vote);

    const option = { id: "opt1", label: "Tea", position: 1, votes: [vote] };
    expect(PostPollOption.parse(option)).toEqual(option);

    const poll = {
      question: "What are we doing tonight?",
      options: [option],
    };
    expect(PostPoll.parse(poll)).toEqual(poll);
  });

  it("Post parses and coerces its posted_at to a Date", () => {
    const now = new Date().toISOString();
    const inp = {
      id: "3",
      content: "hello",
      posted_at: now,
      author: { id: "a", name: "n", handle: "h", avatar_url: null },
      likes: [{ profile_id: "x" }],
      vibes: [{ profile_id: "x", vibe: "real" }],
      attachments: [{ path: "post/1.jpg", position: 1 }],
      poll: {
        question: null,
        options: [
          { id: "o1", label: "Yes", position: 1, votes: [] },
          { id: "o2", label: "No", position: 2, votes: [] },
        ],
      },
      attachment_url: null,
    };
    const out = Post.parse(inp);
    expect(out.id).toBe("3");
    expect(out.posted_at).toBeInstanceOf(Date);
    expect(out.poll.options).toHaveLength(2);
    expect(out.attachments).toHaveLength(1);
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
    expect(emptyPost).toHaveProperty("vibes");
    expect(emptyPost).toHaveProperty("attachments");
    expect(emptyPost).toHaveProperty("poll", null);
  });
});
