const {
  getMyDailyVibeStatus,
  setMyDailyVibeStatus,
  getDailyVibePulse,
  getWeeklyVibeRecap,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("../utils/supabase/queries/vibe-pulse");

describe("Daily vibe pulse query helpers", () => {
  const user = { id: "user-1" };

  test("getMyDailyVibeStatus -> returns null when no row exists", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest
              .fn()
              .mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) }),
          }),
        }),
      }),
    };

    await expect(getMyDailyVibeStatus(supabase, user)).resolves.toBeNull();
  });

  test("setMyDailyVibeStatus -> upserts today's vibe", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                profile_id: "user-1",
                vibe: "mood",
                note: "locked in",
                vibe_date: "2026-03-16",
                updated_at: "2026-03-16T12:00:00.000Z",
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    await expect(
      setMyDailyVibeStatus(supabase, user, "mood", "locked in"),
    ).resolves.toHaveProperty("vibe", "mood");
  });

  test("getDailyVibePulse -> aggregates status + reaction signals", async () => {
    const followQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ following_id: "friend-1" }],
          error: null,
        }),
      }),
    };

    const dailyStatusQuery = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [
                  {
                    profile_id: "user-1",
                    vibe: "real",
                    note: "shipping",
                    vibe_date: "2026-03-16",
                    updated_at: "2026-03-16T08:00:00.000Z",
                    profile: {
                      id: "user-1",
                      name: "User One",
                      handle: "u1",
                      avatar_url: null,
                    },
                  },
                  {
                    profile_id: "friend-1",
                    vibe: "chaotic",
                    note: "no sleep",
                    vibe_date: "2026-03-16",
                    updated_at: "2026-03-16T09:00:00.000Z",
                    profile: {
                      id: "friend-1",
                      name: "Friend One",
                      handle: "f1",
                      avatar_url: null,
                    },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    const vibeReactionQuery = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lt: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [
                    {
                      post_id: "post-1",
                      profile_id: "user-1",
                      vibe: "real",
                      reacted_at: "2026-03-16T11:00:00.000Z",
                    },
                    {
                      post_id: "post-1",
                      profile_id: "friend-1",
                      vibe: "chaotic",
                      reacted_at: "2026-03-16T11:01:00.000Z",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    };

    const postQuery = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: "post-1",
              content: "Exam tomorrow",
              author: {
                id: "friend-1",
                name: "Friend One",
                handle: "f1",
                avatar_url: null,
              },
            },
          ],
          error: null,
        }),
      }),
    };

    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(followQuery)
        .mockReturnValueOnce(dailyStatusQuery)
        .mockReturnValueOnce(vibeReactionQuery)
        .mockReturnValueOnce(postQuery),
    };

    const result = await getDailyVibePulse(supabase, user, {
      topPostsLimit: 3,
      statusLimit: 10,
    });

    expect(result.totalSignals).toBe(4);
    expect(result.activeStatusCount).toBe(2);
    expect(result.reactionCount).toBe(2);
    expect(result.topImpactPosts).toHaveLength(1);
    expect(result.topImpactPosts[0]).toHaveProperty("postId", "post-1");
  });

  test("getWeeklyVibeRecap -> returns weekly summary fields", async () => {
    const weeklyStatusQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockResolvedValue({
              data: [{ vibe: "chaotic", vibe_date: "2026-03-14" }],
              error: null,
            }),
          }),
        }),
      }),
    };

    const weeklyReactionQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lt: jest.fn().mockResolvedValue({
              data: [{ vibe: "real", reacted_at: "2026-03-15T11:00:00.000Z" }],
              error: null,
            }),
          }),
        }),
      }),
    };

    const myPostsQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ id: "post-1" }],
          error: null,
        }),
      }),
    };

    const receivedCountQuery = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lt: jest.fn().mockResolvedValue({
              count: 7,
              error: null,
            }),
          }),
        }),
      }),
    };

    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(weeklyStatusQuery)
        .mockReturnValueOnce(weeklyReactionQuery)
        .mockReturnValueOnce(myPostsQuery)
        .mockReturnValueOnce(receivedCountQuery),
    };

    const result = await getWeeklyVibeRecap(supabase, user);

    expect(result.totalSignals).toBe(2);
    expect(result.vibesReceivedOnPosts).toBe(7);
    expect(result.mostUsedVibe).not.toBeNull();
  });
});

