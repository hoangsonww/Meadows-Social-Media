import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Bell, BellOff, ImageOff, ImageUp } from "lucide-react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import {
  getFollowing,
  getProfileData,
  getProfilePosts,
  toggleFollowing,
  updateProfilePicture,
  getProfileFollowers,
  getProfileFollowing,
} from "@/utils/supabase/queries/profile";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { useRouter } from "next/router";
import { User } from "@supabase/supabase-js";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import PostFeed from "@/components/feed";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";

type PublicProfilePageProps = { user: User };

/**
 * PublicProfilePage renders a user's public profile, including avatar, follow button,
 * statistics, posts, and modals for followers and following lists.
 *
 * @param {{ user: User }} props - Component props.
 * @param {User} props.user - The current authenticated Supabase user.
 * @returns {JSX.Element} The public profile page.
 */
export default function PublicProfilePage({ user }: PublicProfilePageProps) {
  const [followersModalOpen, setFollowersModalOpen] = useState<boolean>(false);
  const [followingModalOpen, setFollowingModalOpen] = useState<boolean>(false);
  const postFeedRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const profileId = router.query.id as string;
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", profileId],
    queryFn: async () => getProfileData(supabase, user, profileId),
  });

  const { data: followers } = useQuery({
    queryKey: ["profile_followers", profileId],
    queryFn: async () => getProfileFollowers(supabase, profileId),
    enabled: !!profileId,
  });

  const { data: following } = useQuery({
    queryKey: ["profile_following", profileId],
    queryFn: async () => getProfileFollowing(supabase, profileId),
    enabled: !!profileId,
  });

  const [isFollowing, setIsFollowing] = useState<boolean | undefined>(
    undefined,
  );

  useEffect(() => {
    getFollowing(supabase, user).then((list) => {
      setIsFollowing(list.some((f) => f.id === profileId));
    });
  }, [supabase, user, profileId]);

  const {
    data: posts,
    fetchNextPage: fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["profile_posts", profileId],
    queryFn: async ({ pageParam = 0 }) =>
      getProfilePosts(supabase, user, profileId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < 25 ? undefined : pages.length * lastPage.length,
  });

  const followButtonPressed = async () => {
    await toggleFollowing(supabase, user, profileId);
    setIsFollowing(!isFollowing);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    queryClient.invalidateQueries(["profile_followers", profileId]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    queryClient.invalidateQueries(["profile_following", profileId]);
  };

  const isPersonalPage = user.id === profileId;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (selectedFile) {
      updateProfilePicture(supabase, user, selectedFile).then(() => {
        setSelectedFile(null);
        queryClient.resetQueries();
      });
    }
  }, [queryClient, selectedFile, supabase, user]);

  return (
    <div className="w-full min-h-screen bg-background p-4 space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          className="transition-transform duration-200 hover:scale-105"
          onClick={() => router.push("/")}
        >
          <ArrowLeft /> Back to Feed
        </Button>
      </div>

      {profile && (
        <Card className="w-full rounded-xl transition-shadow duration-200 hover:shadow-lg">
          <CardContent className="space-y-4 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="transition-transform duration-200 hover:scale-105">
                  <AvatarImage
                    src={
                      supabase.storage
                        .from("avatars")
                        .getPublicUrl(profile.avatar_url ?? "").data.publicUrl
                    }
                  />
                  <AvatarFallback>
                    {profile.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-primary font-bold">{profile.name}</p>
                  <p className="text-muted-foreground">@{profile.handle}</p>
                </div>
              </div>
              {!isPersonalPage && isFollowing !== undefined && (
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  className="transition-opacity duration-200 hover:opacity-80"
                  onClick={followButtonPressed}
                >
                  {isFollowing ? <BellOff /> : <Bell />}{" "}
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
              {isPersonalPage && (
                <>
                  {profile.avatar_url ? (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="transition-opacity duration-200 hover:opacity-80"
                      onClick={() =>
                        updateProfilePicture(supabase, user, null).then(() =>
                          queryClient.resetQueries(),
                        )
                      }
                    >
                      <ImageOff />
                    </Button>
                  ) : (
                    <>
                      <Input
                        className="hidden"
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) =>
                          setSelectedFile(
                            e.target.files && e.target.files[0]
                              ? e.target.files[0]
                              : null,
                          )
                        }
                      />
                      <Button
                        className="transition-opacity duration-200 hover:opacity-80"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageUp /> Change Avatar
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap justify-between gap-4 mt-6">
              {[
                {
                  label: "Posts",
                  count: posts?.pages.reduce((a, p) => a + p.length, 0) || 0,
                  onClick: () =>
                    postFeedRef.current?.scrollIntoView({ behavior: "smooth" }),
                },
                {
                  label: "Followers",
                  count: followers?.length || 0,
                  onClick: () => setFollowersModalOpen(true),
                },
                {
                  label: "Following",
                  count: following?.length || 0,
                  onClick: () => setFollowingModalOpen(true),
                },
              ].map(({ label, count, onClick }) => (
                <div
                  key={label}
                  className="cursor-pointer flex flex-col items-center transition-transform duration-200 hover:scale-105"
                  onClick={onClick}
                >
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea
        className="w-full h-auto rounded-xl transition-shadow duration-200 hover:shadow-lg"
        ref={postFeedRef}
      >
        <div className="py-4 px-2">
          <p className="text-lg font-bold mb-2">
            {isPersonalPage ? "Your" : `${profile?.name}'s`} Recent Posts
          </p>
          <Separator />
          <PostFeed user={user} posts={posts} fetchNext={fetchNextPage} />
          {isFetchingNextPage && (
            <p className="text-center py-4 opacity-70">Loading more…</p>
          )}
        </div>
      </ScrollArea>

      <Modal
        open={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        title="Followers"
        emptyMessage="No followers yet."
        isEmpty={!followers || followers.length === 0}
      >
        <div className="space-y-4">
          {followers?.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 py-2 transition-transform duration-200 hover:scale-105"
            >
              <Avatar>
                <AvatarImage
                  src={
                    supabase.storage
                      .from("avatars")
                      .getPublicUrl(f.avatar_url ?? "").data.publicUrl
                  }
                />
                <AvatarFallback>
                  {f.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{f.name}</p>
                <p className="text-sm text-muted-foreground">@{f.handle}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={followingModalOpen}
        onClose={() => setFollowingModalOpen(false)}
        title="Following"
        emptyMessage="This user is not following anyone."
        isEmpty={!following || following.length === 0}
      >
        <div className="space-y-4">
          {following?.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 py-2 transition-transform duration-200 hover:scale-105"
            >
              <Avatar>
                <AvatarImage
                  src={
                    supabase.storage
                      .from("avatars")
                      .getPublicUrl(f.avatar_url ?? "").data.publicUrl
                  }
                />
                <AvatarFallback>
                  {f.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{f.name}</p>
                <p className="text-sm text-muted-foreground">@{f.handle}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

/**
 * getServerSideProps fetches the authenticated user before rendering the profile page.
 *
 * @param {GetServerSidePropsContext} context - The Next.js server-side context.
 * @returns {Promise<{ props: { user: User } } | { redirect: { destination: string; permanent: boolean } }>}
 */
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: userData.user,
    },
  };
}
