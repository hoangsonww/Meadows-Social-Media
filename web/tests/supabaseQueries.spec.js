// mock out Zod so .parse() and .array().parse() just return raw data
jest.mock("../utils/supabase/models/post", () => {
  const id = (d) => d;
  return {
    Post: { parse: id, array: () => ({ parse: id }) },
    PostAuthor: { parse: id, array: () => ({ parse: id }) },
  };
});

const {
  getPost,
  getFeed,
  getFollowingFeed,
  getLikesFeed,
  toggleLike,
  createPost,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("../utils/supabase/queries/post");

const {
  getProfileData,
  getFollowing,
  getProfilePosts,
  toggleFollowing,
  updateProfilePicture,
  getProfileFollowers,
  getProfileFollowing,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("../utils/supabase/queries/profile");

describe("Supabase query helpers", () => {
  const dummyPost = {
    id: "p",
    content: "c",
    posted_at: new Date(),
    attachment_url: null,
    author: { id: "a", name: "n", handle: "h", avatar_url: null },
    likes: [{ profile_id: "l" }],
  };
  const user = { id: "u" };

  test("getPost → returns parsed post", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest
              .fn()
              .mockResolvedValue({ data: dummyPost, error: null }),
          }),
        }),
      }),
    };
    await expect(getPost(supabase, user, "123")).resolves.toEqual(dummyPost);
  });

  test("getFeed → returns array of parsed posts", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest
              .fn()
              .mockResolvedValue({ data: [dummyPost], error: null }),
          }),
        }),
      }),
    };
    await expect(getFeed(supabase, user, 0)).resolves.toEqual([dummyPost]);
  });

  test("getFollowingFeed → empty when no followees", async () => {
    const supabase = {
      from: jest
        .fn()
        // 1st call: list follows → no data
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest
              .fn()
              .mockReturnValue(Promise.resolve({ data: [], error: null })),
          }),
        })
        // 2nd call: would fetch posts, but we never get there
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest
                  .fn()
                  .mockResolvedValue({ data: [dummyPost], error: null }),
              }),
            }),
          }),
        }),
    };
    await expect(getFollowingFeed(supabase, user, 0)).resolves.toEqual([]);
  });

  test("getLikesFeed → empty when no likes", async () => {
    const supabase = {
      from: jest
        .fn()
        // 1st call: list likes → no data
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest
              .fn()
              .mockReturnValue(Promise.resolve({ data: [], error: null })),
          }),
        })
        // 2nd call: would fetch posts
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest
                  .fn()
                  .mockResolvedValue({ data: [dummyPost], error: null }),
              }),
            }),
          }),
        }),
    };
    await expect(getLikesFeed(supabase, user, 0)).resolves.toEqual([]);
  });

  test("toggleLike → inserts when none exists", async () => {
    const supabase = {
      from: jest
        .fn()
        // select existing likes → none
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockReturnValue(Promise.resolve({ data: [], error: null })),
            }),
          }),
        })
        // insert
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
        }),
    };
    await expect(toggleLike(supabase, user, "pid")).resolves.toBeUndefined();
  });

  test("createPost → inserts and uploads if file provided", async () => {
    const supabase = {
      from: jest
        .fn()
        // 1st call: insert post
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: { id: "x" }, error: null }),
            }),
          }),
        })
        // 2nd call: update attachment_url
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
          }),
        }),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest
            .fn()
            .mockResolvedValue({ data: { path: "p" }, error: null }),
        }),
      },
    };
    await expect(
      createPost(supabase, user, "hey", {}),
    ).resolves.toBeUndefined();
  });

  test("getProfileData → null on error, data otherwise", async () => {
    let supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest
              .fn()
              .mockResolvedValue({ data: null, error: new Error() }),
          }),
        }),
      }),
    };
    await expect(getProfileData(supabase, user, "x")).resolves.toBeNull();

    supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "a", name: "n", handle: "h", avatar_url: null },
              error: null,
            }),
          }),
        }),
      }),
    };
    await expect(getProfileData(supabase, user, "x")).resolves.toHaveProperty(
      "id",
      "a",
    );
  });

  test("getFollowing → returns mapped array", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(
            Promise.resolve({
              data: [
                {
                  following: {
                    id: "f",
                    name: "n",
                    handle: "h",
                    avatar_url: null,
                  },
                },
              ],
              error: null,
            }),
          ),
        }),
      }),
    };
    await expect(getFollowing(supabase, user)).resolves.toEqual([
      { id: "f", name: "n", handle: "h", avatar_url: null },
    ]);
  });

  test("getProfilePosts → returns array", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest
                .fn()
                .mockResolvedValue({ data: [dummyPost], error: null }),
            }),
          }),
        }),
      }),
    };
    await expect(getProfilePosts(supabase, user, "p", 0)).resolves.toEqual([
      dummyPost,
    ]);
  });

  test("toggleFollowing → adds when none exists", async () => {
    const supabase = {
      from: jest
        .fn()
        // 1st call: check existing → none
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockReturnValue(Promise.resolve({ data: [], error: null })),
            }),
          }),
        })
        // 2nd call: insert
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
        }),
    };
    await expect(toggleFollowing(supabase, user, "p")).resolves.toBeUndefined();
  });

  test("updateProfilePicture → deletes when no file, uploads when file", async () => {
    let supabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
        }),
      }),
      storage: { from: jest.fn() },
    };
    await expect(
      updateProfilePicture(supabase, user, null),
    ).resolves.toBeUndefined();

    supabase = {
      from: jest
        .fn()
        // after file upload, update call
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
          }),
        }),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest
            .fn()
            .mockResolvedValue({ data: { path: "u" }, error: null }),
        }),
      },
    };
    await expect(
      updateProfilePicture(supabase, user, {}),
    ).resolves.toBeUndefined();
  });

  test("getProfileFollowers & getProfileFollowing → return arrays", async () => {
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(
              Promise.resolve({
                data: [
                  {
                    follower: {
                      id: "x",
                      name: "n",
                      handle: "h",
                      avatar_url: null,
                    },
                  },
                ],
                error: null,
              }),
            ),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(
              Promise.resolve({
                data: [
                  {
                    following: {
                      id: "y",
                      name: "n",
                      handle: "h",
                      avatar_url: null,
                    },
                  },
                ],
                error: null,
              }),
            ),
          }),
        }),
    };
    await expect(getProfileFollowers(supabase, "p")).resolves.toEqual([
      { id: "x", name: "n", handle: "h", avatar_url: null },
    ]);
    await expect(getProfileFollowing(supabase, "p")).resolves.toEqual([
      { id: "y", name: "n", handle: "h", avatar_url: null },
    ]);
  });
});
