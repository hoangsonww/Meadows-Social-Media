import {
  Bell,
  Leaf,
  Loader2,
  LogOut,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import {
  getProfileData,
  searchProfiles,
} from "@/utils/supabase/queries/profile";
import {
  getMyNotifications,
  markMyNotificationsRead,
} from "@/utils/supabase/queries/comment";
import { ModeToggle } from "./ui/mode-toggle";
import { Button } from "./ui/button";
import { TooltipHint } from "./ui/tooltip-hint";
import { Input } from "./ui/input";

const SEARCH_PROFILE_CHIP_MIN_WIDTH = 420;

export default function Header() {
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [showSearchProfileChip, setShowSearchProfileChip] = useState(true);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data) return null;
      return await getProfileData(supabase, data.user!, data.user!.id);
    },
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications", data?.id],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        return { notifications: [], unreadCount: 0 };
      }

      return getMyNotifications(supabase, authData.user, 8);
    },
    enabled: Boolean(data?.id),
    refetchInterval: 45_000,
  });

  const { data: searchResults = [], isFetching: searchingProfiles } = useQuery({
    queryKey: ["profile_search", debouncedSearchTerm],
    queryFn: async () => searchProfiles(supabase, debouncedSearchTerm, 8),
    enabled: Boolean(data?.id) && debouncedSearchTerm.trim().length > 0,
    staleTime: 20_000,
  });

  const markNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;
      await markMyNotificationsRead(supabase, authData.user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
        refetchType: "all",
      });
    },
  });

  useEffect(() => {
    if (!notificationsOpen) return;
    if (!notificationsData?.unreadCount) return;
    if (markNotificationsReadMutation.isPending) return;
    markNotificationsReadMutation.mutate();
  }, [
    notificationsOpen,
    notificationsData?.unreadCount,
    markNotificationsReadMutation,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 180);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchOpen(false);
      setActiveSearchIndex(-1);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (searchResults.length === 0) {
      setActiveSearchIndex(-1);
      return;
    }

    if (activeSearchIndex >= searchResults.length) {
      setActiveSearchIndex(0);
    }
  }, [activeSearchIndex, searchResults.length]);

  useEffect(() => {
    setSearchOpen(false);
    setActiveSearchIndex(-1);
  }, [router.asPath]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchBoxRef.current) return;
      if (searchBoxRef.current.contains(event.target as Node)) return;
      setSearchOpen(false);
      setActiveSearchIndex(-1);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const searchBox = searchBoxRef.current;
    if (!searchBox) return;

    const updateChipVisibility = () => {
      setShowSearchProfileChip(
        searchBox.clientWidth >= SEARCH_PROFILE_CHIP_MIN_WIDTH,
      );
    };

    updateChipVisibility();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateChipVisibility);
    observer.observe(searchBox);

    return () => observer.disconnect();
  }, []);

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
  const unreadCount = notificationsData?.unreadCount ?? 0;
  const notifications = notificationsData?.notifications ?? [];

  const openNotificationTarget = (
    postId: string | null,
    commentId: string | null,
  ) => {
    if (!postId) return;
    if (commentId) {
      router.push(`/post/${postId}#comment-${commentId}`);
      return;
    }
    router.push(`/post/${postId}`);
  };

  const getNotificationLabel = (type: string) => {
    if (type === "comment_reply") return "replied to your comment";
    if (type === "comment_mention") return "mentioned you";
    if (type === "comment_vibe") return "reacted to your comment";
    return "commented on your post";
  };

  const hasSearchTerm = searchTerm.trim().length > 0;
  const showSearchDropdown = searchOpen && hasSearchTerm;

  const openProfileFromSearch = (profileId: string) => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSearchOpen(false);
    setActiveSearchIndex(-1);
    router.push(`/profile/${profileId}`);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown) return;
    if (searchResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSearchIndex((prev) => (prev + 1) % searchResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSearchIndex((prev) =>
        prev <= 0 ? searchResults.length - 1 : prev - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const targetIndex = activeSearchIndex >= 0 ? activeSearchIndex : 0;
      const target = searchResults[targetIndex];
      if (target) {
        openProfileFromSearch(target.id);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSearchOpen(false);
      setActiveSearchIndex(-1);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/75 text-foreground backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-2 gap-y-2 px-3 py-2 sm:gap-x-3 sm:px-6 lg:px-8">
        <TooltipHint content={homeTooltipText}>
          <Link
            href="/home"
            className="group order-1 flex min-w-0 items-center gap-2 rounded-2xl p-1.5 transition-colors hover:bg-muted/60 lg:gap-3 lg:p-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft-xl lg:h-10 lg:w-10 lg:rounded-2xl">
              <Leaf className="h-4 w-4 lg:h-5 lg:w-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[1.05rem] font-bold tracking-tight lg:text-xl">
                Meadows
              </p>
              <p className="hidden truncate text-xs font-medium text-muted-foreground lg:block">
                Your social circle, leveled up
              </p>
            </div>
          </Link>
        </TooltipHint>

        {data && (
          <div className="order-3 w-full lg:order-2 lg:flex-1 lg:px-4">
            <div
              ref={searchBoxRef}
              className="relative mx-auto w-full max-w-xl"
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSearchOpen(true);
                  setActiveSearchIndex(-1);
                }}
                onFocus={() => {
                  if (searchTerm.trim().length > 0) {
                    setSearchOpen(true);
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search profiles by name or @handle"
                aria-label="Search profiles"
                className="h-10 rounded-2xl border-border/70 bg-card/80 pl-10 pr-10 text-sm shadow-sm transition focus-visible:border-primary/45 focus-visible:ring-primary/30 lg:h-11"
              />
              {searchTerm.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
                  onClick={() => {
                    setSearchTerm("");
                    setDebouncedSearchTerm("");
                    setSearchOpen(false);
                    setActiveSearchIndex(-1);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {showSearchDropdown && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[70] overflow-hidden rounded-2xl border border-border/70 bg-popover/95 shadow-soft-xl backdrop-blur">
                  {searchingProfiles ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-5 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching profiles...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-muted-foreground">
                      No profiles found for{" "}
                      <span className="font-semibold text-foreground">
                        {searchTerm.trim()}
                      </span>
                      .
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto p-1.5">
                      {searchResults.map((profile, index) => {
                        const isActive = index === activeSearchIndex;
                        const avatarUrl = supabase.storage
                          .from("avatars")
                          .getPublicUrl(profile.avatar_url ?? "")
                          .data.publicUrl;

                        return (
                          <button
                            key={profile.id}
                            type="button"
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                              isActive ? "bg-primary/12" : "hover:bg-muted/70"
                            }`}
                            onMouseEnter={() => setActiveSearchIndex(index)}
                            onClick={() => openProfileFromSearch(profile.id)}
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback>
                                {profile.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {profile.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                @{profile.handle}
                              </p>
                            </div>
                            {showSearchProfileChip && (
                              <span className="shrink-0 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                Profile
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="order-2 ml-auto flex shrink-0 items-center gap-1 lg:order-3 lg:gap-2">
          <TooltipHint content="Live social updates">
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 lg:inline-flex">
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
            <DropdownMenu onOpenChange={setNotificationsOpen}>
              <TooltipHint content="Notifications">
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 rounded-full lg:h-9 lg:w-9"
                    aria-label="Open notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {Math.min(unreadCount, 99)}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipHint>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-2.5 py-3 text-sm text-muted-foreground">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="cursor-pointer items-start py-2"
                      onClick={() =>
                        openNotificationTarget(
                          notification.post_id,
                          notification.comment_id,
                        )
                      }
                    >
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium leading-tight">
                          {notification.actor?.handle
                            ? `@${notification.actor.handle}`
                            : "Someone"}{" "}
                          {getNotificationLabel(notification.type)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {data && (
            <TooltipHint content="Open Daily Pulse">
              <Button
                variant="ghost"
                className="h-8 rounded-full px-2 lg:h-9 lg:px-3"
                onClick={() => router.push("/pulse")}
                aria-label="Open Daily Pulse"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipHint>
          )}

          {data && (
            <TooltipHint content="Create a post">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full lg:h-9 lg:w-9"
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
                  <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-1.5 py-1 lg:px-2 lg:py-1.5">
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
                    <div className="hidden text-left lg:block">
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
