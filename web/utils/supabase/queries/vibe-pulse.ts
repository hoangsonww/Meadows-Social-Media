import { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { PostAuthor } from "../models/post";
import {
  createEmptyVibeCounts,
  getUTCDateOffset,
  getUTCDayBounds,
  toUTCDateString,
  VIBE_EMOJIS,
  VIBE_LABELS,
  VIBE_VALUES,
  VibeValue,
} from "../../vibe";

const VibeValueSchema = z.enum(VIBE_VALUES);

const NullablePostAuthor = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}, PostAuthor.nullable());

const UserDailyVibeStatusSchema = z.object({
  profile_id: z.string(),
  vibe: VibeValueSchema,
  note: z.string().nullable(),
  vibe_date: z.string(),
  updated_at: z.date({ coerce: true }),
});

const CircleVibeStatusSchema = UserDailyVibeStatusSchema.extend({
  profile: NullablePostAuthor,
});

const VibeReactionRowSchema = z.object({
  post_id: z.string(),
  profile_id: z.string(),
  vibe: VibeValueSchema,
  reacted_at: z.date({ coerce: true }),
});

const PulsePostRowSchema = z.object({
  id: z.string(),
  content: z.string(),
  author: NullablePostAuthor,
});

const WeeklyStatusRowSchema = z.object({
  vibe: VibeValueSchema,
  vibe_date: z.string(),
});

const WeeklyReactionRowSchema = z.object({
  vibe: VibeValueSchema,
  reacted_at: z.date({ coerce: true }),
});

const PostIdRowSchema = z.object({
  id: z.string(),
});

export type UserDailyVibeStatus = z.infer<typeof UserDailyVibeStatusSchema>;
export type CircleVibeStatus = z.infer<typeof CircleVibeStatusSchema>;

export type PulseVibeStat = {
  vibe: VibeValue;
  label: string;
  emoji: string;
  count: number;
  percent: number;
};

export type DailyPulseImpactPost = {
  postId: string;
  content: string;
  author: z.infer<typeof PostAuthor> | null;
  totalSignals: number;
  topVibe: VibeValue;
  topVibePercent: number;
  byVibe: PulseVibeStat[];
};

export type DailyVibePulse = {
  date: string;
  circleProfileCount: number;
  activeStatusCount: number;
  reactionCount: number;
  totalSignals: number;
  topVibe: PulseVibeStat | null;
  byVibe: PulseVibeStat[];
  statuses: CircleVibeStatus[];
  topImpactPosts: DailyPulseImpactPost[];
};

export type WeeklyVibeRecap = {
  rangeStart: string;
  rangeEnd: string;
  totalSignals: number;
  activeDays: number;
  mostUsedVibe: PulseVibeStat | null;
  vibesReceivedOnPosts: number;
  mostChaoticDay:
    | {
        date: string;
        label: string;
        count: number;
      }
    | null;
  byVibe: PulseVibeStat[];
};

const toPulseVibeStats = (
  counts: Record<VibeValue, number>,
  totalSignals: number,
): PulseVibeStat[] =>
  VIBE_VALUES.map((vibe) => ({
    vibe,
    label: VIBE_LABELS[vibe],
    emoji: VIBE_EMOJIS[vibe],
    count: counts[vibe],
    percent:
      totalSignals > 0 ? Math.round((counts[vibe] / totalSignals) * 100) : 0,
  }));

const getTopVibe = (vibes: PulseVibeStat[]): PulseVibeStat | null => {
  if (vibes.every((vibe) => vibe.count === 0)) {
    return null;
  }

  return vibes.reduce((best, current) =>
    current.count > best.count ? current : best,
  );
};

const getCircleProfileIds = async (
  supabase: SupabaseClient,
  user: User,
): Promise<string[]> => {
  const { data, error } = await supabase
    .from("follow")
    .select("following_id")
    .eq("follower_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  const ids = [user.id, ...(data ?? []).map((row) => row.following_id)];
  return Array.from(new Set(ids.filter(Boolean)));
};

const fetchPagedRows = async <T>(
  fetchPage: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> => {
  const pageSize = 1000;
  let from = 0;
  const allRows: T[] = [];

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await fetchPage(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];
    allRows.push(...rows);

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allRows;
};

export const getMyDailyVibeStatus = async (
  supabase: SupabaseClient,
  user: User,
  date: Date = new Date(),
): Promise<UserDailyVibeStatus | null> => {
  const vibeDate = toUTCDateString(date);

  const { data, error } = await supabase
    .from("daily_vibe_status")
    .select("profile_id, vibe, note, vibe_date, updated_at")
    .eq("profile_id", user.id)
    .eq("vibe_date", vibeDate)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return UserDailyVibeStatusSchema.parse(data);
};

export const setMyDailyVibeStatus = async (
  supabase: SupabaseClient,
  user: User,
  vibe: VibeValue,
  note: string | null = null,
  date: Date = new Date(),
): Promise<UserDailyVibeStatus> => {
  const vibeDate = toUTCDateString(date);
  const trimmed = note?.trim() ?? "";
  const normalizedNote = trimmed.length > 0 ? trimmed.slice(0, 280) : null;

  const { data, error } = await supabase
    .from("daily_vibe_status")
    .upsert(
      {
        profile_id: user.id,
        vibe_date: vibeDate,
        vibe,
        note: normalizedNote,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "profile_id,vibe_date",
      },
    )
    .select("profile_id, vibe, note, vibe_date, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return UserDailyVibeStatusSchema.parse(data);
};

export const getDailyVibePulse = async (
  supabase: SupabaseClient,
  user: User,
  options?: {
    date?: Date;
    topPostsLimit?: number;
    statusLimit?: number;
  },
): Promise<DailyVibePulse> => {
  const date = options?.date ?? new Date();
  const topPostsLimit = Math.max(1, options?.topPostsLimit ?? 4);
  const statusLimit = Math.max(4, options?.statusLimit ?? 16);

  const vibeDate = toUTCDateString(date);
  const dayBounds = getUTCDayBounds(date);
  const circleIds = await getCircleProfileIds(supabase, user);

  const [statusData, reactionData] = await Promise.all([
    fetchPagedRows((from, to) =>
      supabase
        .from("daily_vibe_status")
        .select(
          `
        profile_id,
        vibe,
        note,
        vibe_date,
        updated_at,
        profile:profile_id (
          id,
          name,
          handle,
          avatar_url
        )
      `,
        )
        .in("profile_id", circleIds)
        .eq("vibe_date", vibeDate)
        .order("updated_at", { ascending: false })
        .range(from, to),
    ),
    fetchPagedRows((from, to) =>
      supabase
        .from("vibe_reaction")
        .select("post_id, profile_id, vibe, reacted_at")
        .in("profile_id", circleIds)
        .gte("reacted_at", dayBounds.dayStartIso)
        .lt("reacted_at", dayBounds.dayEndIso)
        .order("reacted_at", { ascending: false })
        .range(from, to),
    ),
  ]);

  const allStatuses = CircleVibeStatusSchema.array().parse(statusData);
  const reactions = VibeReactionRowSchema.array().parse(
    reactionData ?? [],
  );

  const counts = createEmptyVibeCounts();
  allStatuses.forEach((status) => {
    counts[status.vibe] += 1;
  });
  reactions.forEach((reaction) => {
    counts[reaction.vibe] += 1;
  });

  const totalSignals = allStatuses.length + reactions.length;
  const byVibe = toPulseVibeStats(counts, totalSignals);
  const topVibe = getTopVibe(byVibe);

  const byPost = new Map<
    string,
    { totalSignals: number; counts: Record<VibeValue, number> }
  >();

  reactions.forEach((reaction) => {
    const existing = byPost.get(reaction.post_id) ?? {
      totalSignals: 0,
      counts: createEmptyVibeCounts(),
    };
    existing.totalSignals += 1;
    existing.counts[reaction.vibe] += 1;
    byPost.set(reaction.post_id, existing);
  });

  const topPostEntries = Array.from(byPost.entries())
    .sort((a, b) => b[1].totalSignals - a[1].totalSignals)
    .slice(0, topPostsLimit);

  const topPostIds = topPostEntries.map(([postId]) => postId);
  const postById = new Map<string, z.infer<typeof PulsePostRowSchema>>();

  if (topPostIds.length > 0) {
    const { data: postData, error: postError } = await supabase
      .from("post")
      .select(
        `
        id,
        content,
        author:author_id (
          id,
          name,
          handle,
          avatar_url
        )
      `,
      )
      .in("id", topPostIds);

    if (postError) {
      throw new Error(postError.message);
    }

    const parsedPosts = PulsePostRowSchema.array().parse(postData ?? []);
    parsedPosts.forEach((post) => {
      postById.set(post.id, post);
    });
  }

  const topImpactPosts: DailyPulseImpactPost[] = topPostEntries.map(
    ([postId, summary]) => {
      const stats = toPulseVibeStats(summary.counts, summary.totalSignals);
      const postTopVibe = getTopVibe(stats) ?? stats[0];
      const post = postById.get(postId);

      return {
        postId,
        content: post?.content ?? "",
        author: post?.author ?? null,
        totalSignals: summary.totalSignals,
        topVibe: postTopVibe.vibe,
        topVibePercent: postTopVibe.percent,
        byVibe: stats,
      };
    },
  );

  return {
    date: vibeDate,
    circleProfileCount: circleIds.length,
    activeStatusCount: allStatuses.length,
    reactionCount: reactions.length,
    totalSignals,
    topVibe,
    byVibe,
    statuses: allStatuses.slice(0, statusLimit),
    topImpactPosts,
  };
};

export const getWeeklyVibeRecap = async (
  supabase: SupabaseClient,
  user: User,
  date: Date = new Date(),
): Promise<WeeklyVibeRecap> => {
  const weekStartDate = getUTCDateOffset(date, -6);
  const weekStart = toUTCDateString(weekStartDate);
  const weekEnd = toUTCDateString(date);
  const weekStartIso = getUTCDayBounds(weekStartDate).dayStartIso;
  const weekEndIso = getUTCDayBounds(date).dayEndIso;

  const [statusResult, reactionResult, postIdResult] = await Promise.all([
    supabase
      .from("daily_vibe_status")
      .select("vibe, vibe_date")
      .eq("profile_id", user.id)
      .gte("vibe_date", weekStart)
      .lte("vibe_date", weekEnd),
    supabase
      .from("vibe_reaction")
      .select("vibe, reacted_at")
      .eq("profile_id", user.id)
      .gte("reacted_at", weekStartIso)
      .lt("reacted_at", weekEndIso),
    supabase.from("post").select("id").eq("author_id", user.id),
  ]);

  if (statusResult.error) {
    throw new Error(statusResult.error.message);
  }

  if (reactionResult.error) {
    throw new Error(reactionResult.error.message);
  }

  if (postIdResult.error) {
    throw new Error(postIdResult.error.message);
  }

  const statusRows = WeeklyStatusRowSchema.array().parse(statusResult.data ?? []);
  const reactionRows = WeeklyReactionRowSchema.array().parse(
    reactionResult.data ?? [],
  );
  const postIds = PostIdRowSchema.array()
    .parse(postIdResult.data ?? [])
    .map((row) => row.id);

  let vibesReceivedOnPosts = 0;

  if (postIds.length > 0) {
    const { count, error } = await supabase
      .from("vibe_reaction")
      .select("*", { count: "exact", head: true })
      .in("post_id", postIds)
      .gte("reacted_at", weekStartIso)
      .lt("reacted_at", weekEndIso);

    if (error) {
      throw new Error(error.message);
    }

    vibesReceivedOnPosts = count ?? 0;
  }

  const counts = createEmptyVibeCounts();
  const activeDays = new Set<string>();
  const chaoticByDay = new Map<string, number>();

  statusRows.forEach((row) => {
    counts[row.vibe] += 1;
    activeDays.add(row.vibe_date);
    if (row.vibe === "chaotic") {
      chaoticByDay.set(row.vibe_date, (chaoticByDay.get(row.vibe_date) ?? 0) + 1);
    }
  });

  reactionRows.forEach((row) => {
    counts[row.vibe] += 1;
    const day = toUTCDateString(row.reacted_at);
    activeDays.add(day);
    if (row.vibe === "chaotic") {
      chaoticByDay.set(day, (chaoticByDay.get(day) ?? 0) + 1);
    }
  });

  const totalSignals = statusRows.length + reactionRows.length;
  const byVibe = toPulseVibeStats(counts, totalSignals);
  const mostUsedVibe = getTopVibe(byVibe);

  const chaoticSorted = Array.from(chaoticByDay.entries()).sort(
    (a, b) => b[1] - a[1] || b[0].localeCompare(a[0]),
  );

  const mostChaoticDay =
    chaoticSorted.length === 0
      ? null
      : {
          date: chaoticSorted[0][0],
          label: new Date(`${chaoticSorted[0][0]}T12:00:00.000Z`).toLocaleDateString(
            undefined,
            { weekday: "long" },
          ),
          count: chaoticSorted[0][1],
        };

  return {
    rangeStart: weekStart,
    rangeEnd: weekEnd,
    totalSignals,
    activeDays: activeDays.size,
    mostUsedVibe,
    vibesReceivedOnPosts,
    mostChaoticDay,
    byVibe,
  };
};
