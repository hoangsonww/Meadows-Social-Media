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
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-black shadow-md px-4 py-2 flex items-center justify-between">
      {/* Logo + Home link */}
      <Link
        href="/"
        className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
      >
        <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
        <div className="flex flex-col leading-tight">
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Meadow
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Socialize & Share with People
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
                <AvatarFallback>
                  {data.name!.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
            >
              <DropdownMenuItem
                className="flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => router.push(`/profile/${data.id}`)}
              >
                <UserRound className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={async () => {
                  await supabase.auth.signOut();
                  queryClient.resetQueries({ queryKey: ["user_profile"] });
                  router.push("/");
                }}
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
