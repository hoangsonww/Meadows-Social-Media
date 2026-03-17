import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Flame,
  MessageSquareText,
  Sparkles,
  Users,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { PostAuthor } from "@/utils/supabase/models/post";
import {
  getDailyVibePulse,
  getMyDailyVibeStatus,
  getWeeklyVibeRecap,
  setMyDailyVibeStatus,
} from "@/utils/supabase/queries/vibe-pulse";
import { toUTCDateString, VIBE_LABELS, VIBE_META, VibeValue } from "@/utils/vibe";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

type DailyVibePulseProps = {
  user: User;
  profile: z.infer<typeof PostAuthor> | null;
};

const vibeTintClasses: Record<VibeValue, string> = {
  aura_up:
    "border-emerald-400/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  real: "border-cyan-400/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  mood: "border-amber-400/50 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  chaotic:
    "border-rose-400/50 bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

const vibeBarClasses: Record<VibeValue, string> = {
  aura_up: "bg-emerald-500/80",
  real: "bg-cyan-500/80",
  mood: "bg-amber-500/80",
  chaotic: "bg-rose-500/80",
};

const vibeChartColors: Record<VibeValue, string> = {
  aura_up: "rgba(16, 185, 129, 0.95)",
  real: "rgba(6, 182, 212, 0.95)",
  mood: "rgba(245, 158, 11, 0.95)",
  chaotic: "rgba(244, 63, 94, 0.95)",
};

export default function DailyVibePulse({ user, profile }: DailyVibePulseProps) {
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();
  const [noteDraft, setNoteDraft] = useState("");
  const [noteDirty, setNoteDirty] = useState(false);

  const { data: myStatus, isLoading: loadingMyStatus } = useQuery({
    queryKey: ["daily_vibe_status", user.id],
    queryFn: async () => getMyDailyVibeStatus(supabase, user),
  });

  const { data: pulse, isLoading: loadingPulse } = useQuery({
    queryKey: ["daily_vibe_pulse", user.id],
    queryFn: async () => getDailyVibePulse(supabase, user),
    refetchInterval: 60_000,
  });

  const { data: weeklyRecap } = useQuery({
    queryKey: ["weekly_vibe_recap", user.id],
    queryFn: async () => getWeeklyVibeRecap(supabase, user),
    staleTime: 120_000,
  });

  useEffect(() => {
    if (!noteDirty) {
      setNoteDraft(myStatus?.note ?? "");
    }
  }, [myStatus?.note, noteDirty]);

  const setVibeMutation = useMutation({
    mutationFn: async (payload: { vibe: VibeValue; note: string | null }) =>
      setMyDailyVibeStatus(supabase, user, payload.vibe, payload.note),
    onSuccess: (savedStatus) => {
      queryClient.setQueryData(["daily_vibe_status", user.id], savedStatus);
      queryClient.invalidateQueries({
        queryKey: ["daily_vibe_pulse"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["weekly_vibe_recap"],
        refetchType: "all",
      });
      setNoteDirty(false);
      setNoteDraft(savedStatus.note ?? "");
      toast.success(`Today's vibe: ${VIBE_LABELS[savedStatus.vibe]}`);
    },
    onError: () => {
      toast.error("Couldn't save your daily vibe right now.");
    },
  });

  const myVibe = myStatus?.vibe ?? null;
  const pulseDateLabel = useMemo(() => {
    const pulseDate = pulse?.date ?? toUTCDateString();
    return new Date(`${pulseDate}T12:00:00.000Z`).toLocaleDateString(
      undefined,
      {
        weekday: "long",
        month: "short",
        day: "numeric",
      },
    );
  }, [pulse?.date]);

  const friendStatuses = useMemo(
    () =>
      (pulse?.statuses ?? []).filter(
        (status) => status.profile_id !== user.id && status.profile,
      ),
    [pulse?.statuses, user.id],
  );

  const avatarUrl = useMemo(() => {
    const avatarKey = profile?.avatar_url ?? "";
    if (!avatarKey) return undefined;
    return supabase.storage.from("avatars").getPublicUrl(avatarKey).data.publicUrl;
  }, [profile?.avatar_url, supabase]);

  const saveNote = async () => {
    if (!myVibe) {
      toast.error("Set today's vibe first.");
      return;
    }

    await setVibeMutation.mutateAsync({
      vibe: myVibe,
      note: noteDraft,
    });
  };

  const pulseRingStyle = useMemo(() => {
    if (!pulse || pulse.totalSignals <= 0) {
      return {
        background:
          "conic-gradient(from 210deg, rgba(148,163,184,0.4) 0% 100%)",
      };
    }

    let cursor = 0;
    const segments = pulse.byVibe
      .filter((vibe) => vibe.count > 0)
      .map((vibe) => {
        const slice = (vibe.count / pulse.totalSignals) * 100;
        const start = cursor;
        const end = cursor + slice;
        cursor = end;
        return `${vibeChartColors[vibe.vibe]} ${start}% ${end}%`;
      });

    if (segments.length === 0) {
      return {
        background:
          "conic-gradient(from 210deg, rgba(148,163,184,0.4) 0% 100%)",
      };
    }

    return {
      background: `conic-gradient(from 210deg, ${segments.join(", ")})`,
    };
  }, [pulse]);

  return (
    <section className="mb-5 grid gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-5 animate-fade-up border-border/70 bg-card/90">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">Daily Vibe Check</CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              {pulseDateLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            How are you feeling today? One tap sets your vibe.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {VIBE_META.map((vibe) => {
              const active = myVibe === vibe.value;

              return (
                <Button
                  key={vibe.value}
                  type="button"
                  variant="ghost"
                  disabled={setVibeMutation.isPending}
                  onClick={() =>
                    setVibeMutation.mutate({
                      vibe: vibe.value,
                      note: noteDraft,
                    })
                  }
                  className={`h-auto w-full flex-col items-stretch rounded-xl border px-3 py-2.5 text-left ${
                    active
                      ? vibeTintClasses[vibe.value]
                      : "border-border/70 bg-background/70 text-foreground/90 hover:border-primary/30 hover:bg-primary/[0.07]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex max-w-[5.25rem] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[10px] font-bold leading-none tracking-wide text-ellipsis whitespace-nowrap">
                        {vibe.emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold leading-tight">
                          {vibe.label}
                        </span>
                      </span>
                    </div>
                    {active && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/35 bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5">
            <label
              htmlFor="daily-vibe-note"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Optional status note
            </label>
            <Input
              id="daily-vibe-note"
              maxLength={280}
              value={noteDraft}
              onChange={(event) => {
                setNoteDirty(true);
                setNoteDraft(event.target.value);
              }}
              placeholder="Running on 2 hours of sleep..."
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {myVibe ? `Current vibe: ${VIBE_LABELS[myVibe]}` : "No vibe set yet"}
              </span>
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                variant="secondary"
                onClick={saveNote}
                disabled={setVibeMutation.isPending || !myVibe}
              >
                Save note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-7 animate-fade-up border-border/70 bg-card/90">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Meadows Pulse</CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Live today
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Collective mood from daily check-ins and post vibe reactions.
          </p>
        </CardHeader>
        <CardContent>
          {loadingPulse ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Loading pulse...
            </div>
          ) : pulse ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[0.95fr,1.05fr]">
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-background/80 via-primary/[0.06] to-accent/[0.09] p-3">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-16 left-0 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
                  <div className="relative">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Vibe Mix Wheel
                    </p>
                    <div className="mt-3 flex justify-center">
                      <div
                        className="relative h-44 w-44 rounded-full p-3 shadow-[0_0_0_1px_hsl(var(--border)/0.35),0_12px_30px_-16px_hsl(var(--foreground)/0.55)]"
                        style={pulseRingStyle}
                      >
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-border/70 bg-card/95 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Signals
                          </p>
                          <p className="mt-0.5 text-2xl font-bold leading-none">
                            {pulse.totalSignals.toLocaleString()}
                          </p>
                          <p className="mt-1 px-2 text-[11px] font-medium text-muted-foreground">
                            {pulse.topVibe
                              ? `${pulse.topVibe.emoji} ${pulse.topVibe.label} leads`
                              : "No dominant vibe yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div
                    className={`rounded-2xl border px-3 py-2.5 ${
                      pulse.topVibe
                        ? vibeTintClasses[pulse.topVibe.vibe]
                        : "border-border/70 bg-muted/20 text-foreground"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                      Top vibe right now
                    </p>
                    <p className="mt-1 text-base font-bold">
                      {pulse.topVibe
                        ? `${pulse.topVibe.emoji} ${pulse.topVibe.label}`
                        : "No pulse leader yet"}
                    </p>
                    <p className="text-xs opacity-85">
                      {pulse.topVibe
                        ? `${pulse.topVibe.percent}% of today's signals`
                        : "Set your vibe and react to posts to shape the pulse."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {pulse.byVibe.map((vibe) => (
                      <div
                        key={vibe.vibe}
                        className={`rounded-xl border border-border/70 bg-muted/20 px-2.5 py-2 ${
                          pulse.topVibe?.vibe === vibe.vibe
                            ? "ring-1 ring-primary/40"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold">{vibe.emoji}</span>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {vibe.percent}%
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-semibold">
                          {vibe.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {vibe.count.toLocaleString()} signals
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/[0.14] p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Vibe Skyline
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Live vibe distribution
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {pulse.byVibe.map((vibe) => (
                    <div key={`bar-${vibe.vibe}`} className="flex flex-col items-center gap-1.5">
                      <div className="relative flex h-24 w-full items-end overflow-hidden rounded-xl border border-border/70 bg-background/70 p-1.5">
                        <div
                          className={`w-full rounded-lg transition-all duration-500 ${vibeBarClasses[vibe.vibe]}`}
                          style={{
                            height:
                              vibe.count === 0
                                ? "8%"
                                : `${Math.max(vibe.percent, pulse.totalSignals > 0 ? 18 : 8)}%`,
                          }}
                        />
                        <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full border border-border/60 bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {vibe.percent}%
                        </span>
                      </div>
                      <p className="text-[10px] font-bold leading-none text-muted-foreground">
                        {vibe.emoji}
                      </p>
                      <p className="text-center text-[11px] font-semibold leading-tight">
                        {vibe.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.13em]">Signals</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {pulse.totalSignals.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.13em]">Statuses</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {pulse.activeStatusCount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.13em]">Reactions</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {pulse.reactionCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Pulse data is unavailable right now.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-8 animate-fade-up border-border/70 bg-card/90">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">Circle Vibe Statuses</CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {(pulse?.circleProfileCount ?? 0).toLocaleString()} in your circle
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Friends are accounts you follow. A vibe appears here once they
            check in for today.
          </p>
        </CardHeader>
        <CardContent>
          {friendStatuses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              No friend vibe check-ins yet today.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {friendStatuses.map((status) => {
                const person = status.profile!;
                const personAvatar = person.avatar_url
                  ? supabase.storage.from("avatars").getPublicUrl(person.avatar_url).data
                      .publicUrl
                  : undefined;

                return (
                  <div
                    key={`${status.profile_id}-${status.vibe_date}`}
                    className="rounded-xl border border-border/70 bg-muted/15 p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={personAvatar} />
                        <AvatarFallback>
                          {person.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{person.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{person.handle}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.11em] text-primary">
                          {VIBE_LABELS[status.vibe]}
                        </p>
                        {status.note && (
                          <p className="mt-1 line-clamp-2 text-sm text-foreground/90">
                            &ldquo;{status.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-4 animate-fade-up border-border/70 bg-card/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Week on Meadows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Most used vibe
            </p>
            <p className="mt-1 text-base font-semibold">
              {weeklyRecap?.mostUsedVibe
                ? `${weeklyRecap.mostUsedVibe.label} ${weeklyRecap.mostUsedVibe.emoji}`
                : "No vibe signals yet"}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Your post vibes (7d)
            </p>
            <p className="mt-1 text-base font-semibold">
              {(weeklyRecap?.vibesReceivedOnPosts ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Most chaotic day
            </p>
            <p className="mt-1 text-base font-semibold">
              {weeklyRecap?.mostChaoticDay
                ? `${weeklyRecap.mostChaoticDay.label} (${weeklyRecap.mostChaoticDay.count})`
                : "No chaotic spikes"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-12 animate-fade-up border-border/70 bg-card/90">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Posts Influencing Today&apos;s Vibe</CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Live influence
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {!pulse || pulse.topImpactPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              No post vibe activity yet today.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pulse.topImpactPosts.map((impactPost) => (
                <Link
                  key={impactPost.postId}
                  href={`/post/${impactPost.postId}`}
                  className="group rounded-xl border border-border/70 bg-muted/15 p-3 transition hover:border-primary/35 hover:bg-primary/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {impactPost.author
                          ? `${impactPost.author.name} (@${impactPost.author.handle})`
                          : "Unknown author"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {impactPost.content || "No post text."}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${vibeTintClasses[impactPost.topVibe]}`}
                    >
                      <Flame className="h-3.5 w-3.5" />
                      {VIBE_LABELS[impactPost.topVibe]} {impactPost.topVibePercent}%
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      {impactPost.totalSignals.toLocaleString()} vibe signals
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {loadingMyStatus && (
        <p className="lg:col-span-12 text-xs text-muted-foreground">
          Syncing your vibe state...
        </p>
      )}

      {!loadingMyStatus && !myStatus && (
        <div className="lg:col-span-12 flex items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{(profile?.name ?? "ME").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          Set your vibe to appear in your circle&apos;s Daily Pulse.
        </div>
      )}
    </section>
  );
}
