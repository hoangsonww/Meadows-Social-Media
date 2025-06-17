// pages/profile/[id].tsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import { User } from "@supabase/supabase-js";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, Bell, BellOff, ImageOff, ImageUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import PostFeed from "@/components/feed";
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
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

function Modal({
  open,
  onClose,
  title,
  isEmpty = false,
  emptyMessage = "",
  children,
}: ModalProps) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-md max-h-[95vh] overflow-y-auto rounded-xl bg-background shadow-xl p-4">
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {isEmpty ? (
          <p className="text-center text-muted-foreground">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </div>,
    document.body,
  );
}

type PublicProfilePageProps = { user: User };

export default function PublicProfilePage({ user }: PublicProfilePageProps) {
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean | undefined>(undefined);

  const postFeedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const profileId = router.query.id as string;

  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", profileId],
    queryFn: () => getProfileData(supabase, user, profileId),
  });

  const { data: followers } = useQuery({
    queryKey: ["profile_followers", profileId],
    queryFn: () => getProfileFollowers(supabase, profileId),
    enabled: !!profileId,
  });

  const { data: following } = useQuery({
    queryKey: ["profile_following", profileId],
    queryFn: () => getProfileFollowing(supabase, profileId),
    enabled: !!profileId,
  });

  useEffect(() => {
    getFollowing(supabase, user).then((list) =>
      setIsFollowing(list.some((f) => f.id === profileId)),
    );
  }, [supabase, user, profileId]);

  const {
    data: posts,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["profile_posts", profileId],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) =>
      getProfilePosts(supabase, user, profileId, pageParam),
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < 25 ? undefined : pages.length * lastPage.length,
  });

  const followButtonPressed = async () => {
    await toggleFollowing(supabase, user, profileId);
    setIsFollowing((prev) => !prev);
    queryClient.invalidateQueries(["profile_followers", profileId]);
    queryClient.invalidateQueries(["profile_following", profileId]);
  };

  useEffect(() => {
    if (selectedFile) {
      updateProfilePicture(supabase, user, selectedFile).then(() => {
        setSelectedFile(null);
        queryClient.resetQueries();
      });
    }
  }, [selectedFile, supabase, user, queryClient]);

  const isPersonalPage = user.id === profileId;

  return (
    <div className="min-h-screen w-full space-y-6 bg-background p-4">
      <div className="mb-4 flex items-center">
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
                  <p className="font-bold text-primary">{profile.name}</p>
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
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] ?? null)
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

            <div className="mt-6 flex flex-wrap justify-between gap-4">
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
                  onClick={onClick}
                  className="flex cursor-pointer flex-col items-center transition-transform duration-200 hover:scale-105"
                >
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-sm text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea
        ref={postFeedRef}
        className="h-auto w-full rounded-xl transition-shadow duration-200 hover:shadow-lg"
      >
        <div className="px-2 py-4">
          <p className="mb-2 text-lg font-bold">
            {isPersonalPage ? "Your" : `${profile?.name}'s`} Recent Posts
          </p>
          <Separator />
          <PostFeed user={user} posts={posts} fetchNext={fetchNextPage} />
          {isFetchingNextPage && (
            <p className="py-4 text-center opacity-70">Loading more…</p>
          )}
        </div>
      </ScrollArea>

      <Modal
        open={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        title="Followers"
        emptyMessage="No followers yet."
        isEmpty={!followers?.length}
      >
        <div className="space-y-4">
          {followers?.map((f) => (
            <div
              key={f.id}
              className="group flex cursor-pointer items-center gap-3 py-2"
              onClick={() => {
                setFollowersModalOpen(false);
                router.push(`/profile/${f.id}`);
              }}
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
                <p className="font-bold group-hover:underline">{f.name}</p>
                <p className="text-sm text-muted-foreground group-hover:underline">
                  @{f.handle}
                </p>
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
        isEmpty={!following?.length}
      >
        <div className="space-y-4">
          {following?.map((f) => (
            <div
              key={f.id}
              className="group flex cursor-pointer items-center gap-3 py-2"
              onClick={() => {
                setFollowingModalOpen(false);
                router.push(`/profile/${f.id}`);
              }}
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
                <p className="font-bold group-hover:underline">{f.name}</p>
                <p className="text-sm text-muted-foreground group-hover:underline">
                  @{f.handle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData) {
    return { redirect: { destination: "/", permanent: false } };
  }

  const profileId = context.params?.id as string;
  const profile = await getProfileData(supabase, userData.user, profileId);

  if (!profile) return { notFound: true };

  return { props: { user: userData.user } };
}
