const {
  createPostComment,
  getMyNotifications,
  getPostComments,
  setCommentVibe,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("../utils/supabase/queries/comment");

describe("Comment query helpers", () => {
  const user = { id: "u1" };

  test("createPostComment -> rejects empty payload", async () => {
    const supabase = { from: jest.fn(), storage: { from: jest.fn() } };

    await expect(
      createPostComment(supabase, user, {
        postId: "p1",
        content: "   ",
        image: null,
      }),
    ).rejects.toThrow("Comment content is required.");
  });

  test("getPostComments -> returns top comments with reply rows", async () => {
    const topRows = [
      {
        id: "c1",
        post_id: "p1",
        author_id: "u2",
        parent_comment_id: null,
        content: "top comment",
        image_url: null,
        created_at: "2026-03-16T12:00:00.000Z",
        updated_at: "2026-03-16T12:00:00.000Z",
        reply_count: 1,
        vibe_count: 1,
        engagement_score: 3,
        author: { id: "u2", name: "Alice", handle: "alice", avatar_url: null },
        vibes: [{ profile_id: "u3", vibe: "real" }],
      },
    ];

    const replyRows = [
      {
        id: "c2",
        post_id: "p1",
        author_id: "u3",
        parent_comment_id: "c1",
        content: "reply",
        image_url: null,
        created_at: "2026-03-16T12:01:00.000Z",
        updated_at: "2026-03-16T12:01:00.000Z",
        reply_count: 0,
        vibe_count: 0,
        engagement_score: 0,
        author: { id: "u3", name: "Bob", handle: "bob", avatar_url: null },
        vibes: [],
      },
    ];

    const topQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: topRows, error: null }),
              }),
            }),
          }),
        }),
      }),
    };

    const repliesQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: replyRows, error: null }),
            }),
          }),
        }),
      }),
    };

    const supabase = {
      from: jest.fn().mockReturnValueOnce(topQuery).mockReturnValueOnce(repliesQuery),
    };

    const result = await getPostComments(supabase, user, "p1", 0, 10, "top");
    expect(result.comments).toHaveLength(1);
    expect(result.comments[0].replies).toHaveLength(1);
    expect(result.hasMore).toBe(false);
  });

  test("setCommentVibe -> inserts reaction + notification when first reaction", async () => {
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: "c1", author_id: "u2", post_id: "p1" },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null }),
        }),
    };

    await expect(setCommentVibe(supabase, user, "c1", "real")).resolves.toBeUndefined();
  });

  test("getMyNotifications -> returns rows + unread count", async () => {
    const rows = [
      {
        id: "n1",
        recipient_id: "u1",
        actor_id: "u2",
        type: "comment_reply",
        post_id: "p1",
        comment_id: "c1",
        payload: {},
        is_read: false,
        created_at: "2026-03-16T12:00:00.000Z",
        actor: { id: "u2", name: "Alice", handle: "alice", avatar_url: null },
      },
    ];

    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: rows, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 2, error: null }),
            }),
          }),
        }),
    };

    const result = await getMyNotifications(supabase, user, 8);
    expect(result.notifications).toHaveLength(1);
    expect(result.unreadCount).toBe(2);
  });
});

