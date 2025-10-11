import { Leaf, LogOut, UserRound } from "lucide-react";
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

export default function Header() {
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data) return null;
      return await getProfileData(supabase, data.user!, data.user!.id);
    },
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-background text-foreground border-b border-border shadow-md px-4 py-2 flex items-center justify-between">
      {/* Logo + Home link */}
      <Link
        href="/home"
        className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
      >
        <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
        <div className="flex flex-col leading-tight">
          <p className="text-xl font-bold text-foreground">Meadows</p>
          <p className="text-sm text-muted-foreground">
            Socialize &amp; Share Stylishly
          </p>
        </div>
      </Link>

      {data && (
        <div className="flex items-center gap-4">
          {/* Dark mode / light mode toggle */}
          <div className="cursor-pointer">
            <ModeToggle />
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer">
              <Avatar className="transition-transform hover:scale-105">
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
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-popover text-popover-foreground border border-border rounded-xl shadow-lg"
            >
              <DropdownMenuItem
                className="flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg hover:bg-muted focus:bg-muted"
                onClick={() => router.push(`/profile/${data.id}`)}
              >
                <UserRound className="w-5 h-5 text-foreground" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg hover:bg-muted focus:bg-muted"
                onClick={async () => {
                  await supabase.auth.signOut();
                  queryClient.resetQueries({ queryKey: ["user_profile"] });
                  router.push("/");
                }}
              >
                <LogOut className="w-5 h-5 text-foreground" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
