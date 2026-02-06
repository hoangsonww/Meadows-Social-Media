import { Leaf, LogOut, Plus, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { getProfileData } from "@/utils/supabase/queries/profile";
import { ModeToggle } from "./ui/mode-toggle";
import { Button } from "./ui/button";
import { TooltipHint } from "./ui/tooltip-hint";

export default function Header() {
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data) return null;
      return await getProfileData(supabase, data.user!, data.user!.id);
    },
  });

  const scrollToComposer = () => {
    if (router.pathname === "/home") {
      const composer = document.getElementById("create-post-section");
      if (composer) {
        composer.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    router.push("/home#create-post-section");
  };
  const homeTooltipText =
    isLoading || data ? "Go to home feed" : "Sign in first to view the feed";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/75 text-foreground backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <TooltipHint content={homeTooltipText}>
          <Link
            href="/home"
            className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted/60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft-xl">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-xl font-bold tracking-tight">Meadows</p>
              <p className="text-xs font-medium text-muted-foreground">
                Your social circle, leveled up
              </p>
            </div>
          </Link>
        </TooltipHint>

        <div className="flex items-center gap-2 sm:gap-3">
          <TooltipHint content="Live social updates">
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 sm:inline-flex">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Live Feed
              </span>
            </div>
          </TooltipHint>

          {data && (
            <TooltipHint content="Create a post">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={scrollToComposer}
                aria-label="Jump to post composer"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipHint>
          )}

          <div className="cursor-pointer">
            <TooltipHint content="Switch theme">
              <ModeToggle />
            </TooltipHint>
          </div>

          {data && (
            <DropdownMenu>
              <TooltipHint content="Account">
                <DropdownMenuTrigger className="cursor-pointer rounded-2xl outline-none transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-2 py-1.5">
                    <Avatar>
                      <AvatarImage
                        src={
                          supabase.storage
                            .from("avatars")
                            .getPublicUrl(data.avatar_url ?? "").data.publicUrl
                        }
                      />
                      <AvatarFallback className="bg-muted text-foreground">
                        {data.name!.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left sm:block">
                      <p className="max-w-28 truncate text-sm font-semibold">
                        {data.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{data.handle}
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
              </TooltipHint>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push(`/profile/${data.id}`)}
                >
                  <UserRound className="h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/home")}
                >
                  <Sparkles className="h-4 w-4" />
                  Home Feed
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500 dark:text-red-400 dark:focus:bg-red-400/10 dark:focus:text-red-400"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    queryClient.resetQueries({ queryKey: ["user_profile"] });
                    router.push("/");
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
