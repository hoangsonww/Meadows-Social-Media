import DailyVibePulse from "@/components/daily-vibe-pulse";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { PostAuthor } from "@/utils/supabase/models/post";
import { getProfileData } from "@/utils/supabase/queries/profile";
import { User } from "@supabase/supabase-js";
import { Sparkles } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { z } from "zod";
import { Toaster } from "sonner";

type PulsePageProps = {
  user: User;
  profile: z.infer<typeof PostAuthor> | null;
};

export default function PulsePage({ user, profile }: PulsePageProps) {
  return (
    <>
      <Toaster position="bottom-center" theme="system" richColors />
      <main className="min-h-screen w-full text-foreground">
        <div className="page-shell max-w-5xl">
          <section className="surface mb-5 animate-fade-up p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Vibe Intelligence
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Daily Pulse
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Track your circle&apos;s mood and manage your daily vibe status.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Live vibe data
              </div>
            </div>
          </section>

          <DailyVibePulse user={user} profile={profile} />
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const profile = await getProfileData(
    supabase,
    userData.user,
    userData.user.id,
  );

  return {
    props: { user: userData.user, profile },
  };
}

