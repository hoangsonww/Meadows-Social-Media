import { ChangeEvent, Fragment, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Flag,
  ImagePlus,
  Loader2,
  MessageCircle,
  Reply,
  Send,
  Smile,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { VIBE_LABELS, VIBE_META, VibeValue } from "@/utils/vibe";
import {
  createPostComment,
  deletePostComment,
  getMaxCommentLength,
  getMentionSuggestions,
  getPostComments,
  getReplyPreviewLimit,
  reportPostComment,
  setCommentVibe,
} from "@/utils/supabase/queries/comment";
import {
  PostComment,
  PostCommentThread,
} from "@/utils/supabase/models/comment";
import { getProfileDataByHandle } from "@/utils/supabase/queries/profile";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { TooltipHint } from "./ui/tooltip-hint";

type PostCommentsProps = {
  user: User;
  postId: string;
  commentCount: number;
};

type ReplyTarget = {
  parentCommentId: string;
  handle: string;
};
type ThreadComment = z.infer<typeof PostCommentThread>;
type FlatComment = z.infer<typeof PostComment>;

const COMMENT_PAGE_SIZE = 10;
const MAX_COMMENT_LENGTH = getMaxCommentLength();
const REPLY_PREVIEW_LIMIT = getReplyPreviewLimit();

const mentionTrailPattern = /(?:^|\s)@([a-zA-Z0-9_]{1,32})$/;
const inlineMentionPattern = /(@[a-zA-Z0-9_]{2,32})/g;

const getDisplayTime = (value: Date) =>
  value.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const getCommentImageUrl = (
  imagePath: string | null,
  imageBucket: {
    getPublicUrl: (path: string) => { data: { publicUrl: string } };
  },
): string | null => {
  if (!imagePath) return null;
  return imageBucket.getPublicUrl(imagePath).data.publicUrl;
};

const renderTextWithMentions = (
  content: string,
  onMentionClick: (handle: string) => void,
) =>
  content.split(inlineMentionPattern).map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <button
          key={`mention-${part}-${index}`}
          type="button"
          className="inline-flex items-center rounded-md border border-primary/25 bg-primary/[0.08] px-1 py-0.5 font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={() => onMentionClick(part)}
        >
          {part}
        </button>
      );
    }
    return <Fragment key={`text-${index}`}>{part}</Fragment>;
  });

const parseMentionQuery = (content: string, cursor: number): string | null => {
  const prefix = content.slice(0, cursor);
  const match = prefix.match(mentionTrailPattern);
  if (!match) return null;
  return match[1].toLowerCase();
};

export default function PostComments({
  user,
  postId,
  commentCount,
}: PostCommentsProps) {
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const imageBucket = supabase.storage.from("images");
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sortMode, setSortMode] = useState<"top" | "newest">("top");
  const [composerText, setComposerText] = useState("");
  const [composerCursor, setComposerCursor] = useState(0);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<
    string | null
  >(null);
  const [expandedReplyThreads, setExpandedReplyThreads] = useState<
    Record<string, boolean>
  >({});
  const [mentionLoadingHandle, setMentionLoadingHandle] = useState<
    string | null
  >(null);

  const mentionQuery = useMemo(
    () => parseMentionQuery(composerText, composerCursor),
    [composerText, composerCursor],
  );

  const { data: mentionSuggestions } = useQuery({
    queryKey: ["comment_mentions", mentionQuery],
    queryFn: async () => getMentionSuggestions(supabase, mentionQuery ?? "", 6),
    enabled: Boolean(mentionQuery),
    staleTime: 10_000,
  });

  const {
    data: commentsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingComments,
  } = useInfiniteQuery({
    queryKey: ["post_comments", postId, sortMode],
    queryFn: async ({ pageParam = 0 }) =>
      getPostComments(
        supabase,
        user,
        postId,
        pageParam,
        COMMENT_PAGE_SIZE,
        sortMode,
      ),
    enabled: Boolean(postId),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const flattenedComments = useMemo(
    () => commentsPages?.pages.flatMap((page) => page.comments) ?? [],
    [commentsPages],
  );

  const invalidateCommentRelatedQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["post_comments", postId],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["post", postId],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["posts"],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["profile_posts"],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["notifications"],
      refetchType: "all",
    });
  };

  const createCommentMutation = useMutation({
    mutationFn: async () =>
      createPostComment(supabase, user, {
        postId,
        content: composerText,
        parentCommentId: replyTarget?.parentCommentId ?? null,
        image: selectedImage,
      }),
    onSuccess: () => {
      setComposerText("");
      setReplyTarget(null);
      setSelectedImage(null);
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
      setSelectedImagePreview(null);
      invalidateCommentRelatedQueries();
      toast.success("Comment posted");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Could not post comment right now.";
      toast.error(message);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) =>
      deletePostComment(supabase, user, commentId),
    onSuccess: () => {
      invalidateCommentRelatedQueries();
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete comment.",
      );
    },
  });

  const reportCommentMutation = useMutation({
    mutationFn: async (params: { commentId: string; reason: string }) =>
      reportPostComment(supabase, user, params.commentId, params.reason),
    onSuccess: () => toast.success("Comment reported"),
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not report comment.",
      ),
  });

  const setCommentVibeMutation = useMutation({
    mutationFn: async (params: { commentId: string; vibe: VibeValue }) =>
      setCommentVibe(supabase, user, params.commentId, params.vibe),
    onSuccess: () => {
      invalidateCommentRelatedQueries();
    },
    onError: () => {
      toast.error("Couldn't update comment vibe right now.");
    },
  });

  const handlePickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (!picked) return;
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImage(picked);
    setSelectedImagePreview(URL.createObjectURL(picked));
  };

  const handleSubmit = async () => {
    if (createCommentMutation.isPending) return;
    await createCommentMutation.mutateAsync();
  };

  const handleMentionClick = async (handleToken: string) => {
    const normalizedHandle = handleToken.replace(/^@/, "").trim().toLowerCase();
    if (!normalizedHandle) return;
    if (mentionLoadingHandle === normalizedHandle) return;

    try {
      setMentionLoadingHandle(normalizedHandle);
      const profile = await getProfileDataByHandle(supabase, normalizedHandle);
      if (!profile) {
        toast.error(`Profile @${normalizedHandle} not found.`);
        return;
      }
      router.push(`/profile/${profile.id}`);
    } catch {
      toast.error("Couldn't open this profile right now.");
    } finally {
      setMentionLoadingHandle(null);
    }
  };

  const insertMention = (handle: string) => {
    const textarea = composerRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart ?? composerCursor;
    const textBeforeCursor = composerText.slice(0, cursor);
    const textAfterCursor = composerText.slice(cursor);
    const match = textBeforeCursor.match(mentionTrailPattern);
    if (!match) return;

    const matchedText = match[0];
    const replacement = matchedText.replace(
      /@[a-zA-Z0-9_]{1,32}$/,
      `@${handle} `,
    );
    const nextText =
      textBeforeCursor.slice(0, textBeforeCursor.length - matchedText.length) +
      replacement +
      textAfterCursor;

    const nextCursor =
      textBeforeCursor.length - matchedText.length + replacement.length;
    setComposerText(nextText);
    setComposerCursor(nextCursor);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  };

  const openReply = (comment: ThreadComment | FlatComment) => {
    if (!comment.author) return;
    const parentCommentId = comment.parent_comment_id ?? comment.id;

    setReplyTarget({
      parentCommentId,
      handle: comment.author.handle,
    });
    setComposerText((prev) => {
      if (prev.trim().length > 0) {
        return prev;
      }
      return `@${comment.author!.handle} `;
    });
    setTimeout(() => {
      const textarea = composerRef.current;
      if (!textarea) return;
      const nextCursor = textarea.value.length;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
      setComposerCursor(nextCursor);
    }, 0);
  };

  const renderCommentVibes = (comment: ThreadComment | FlatComment) => {
    const counts: Record<VibeValue, number> = {
      aura_up: 0,
      real: 0,
      mood: 0,
      chaotic: 0,
    };

    comment.vibes.forEach((vibe) => {
      counts[vibe.vibe] += 1;
    });

    const myVibe =
      comment.vibes.find((vibe) => vibe.profile_id === user.id)?.vibe ?? null;

    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {VIBE_META.map((vibe) => (
          <Button
            key={`${comment.id}-${vibe.value}`}
            variant="ghost"
            className={`h-7 rounded-full border px-2.5 text-[11px] font-semibold ${
              myVibe === vibe.value
                ? "border-primary/45 bg-primary/15 text-primary"
                : "border-border/70 bg-background/70 text-muted-foreground"
            }`}
            onClick={() =>
              setCommentVibeMutation.mutate({
                commentId: comment.id,
                vibe: vibe.value,
              })
            }
          >
            {vibe.emoji} {VIBE_LABELS[vibe.value]} {counts[vibe.value]}
          </Button>
        ))}
      </div>
    );
  };

  const renderCommentCard = (
    comment: ThreadComment | FlatComment,
    isReply: boolean,
  ) => {
    const author = comment.author;
    const avatarUrl = author?.avatar_url
      ? supabase.storage.from("avatars").getPublicUrl(author.avatar_url).data
          .publicUrl
      : undefined;
    const imageUrl = getCommentImageUrl(comment.image_url, imageBucket);
    const isMine = comment.author_id === user.id;
    const replies =
      !isReply && "replies" in comment ? (comment.replies ?? []) : [];
    const expanded = expandedReplyThreads[comment.id] ?? false;
    const hasHiddenReplies = replies.length > REPLY_PREVIEW_LIMIT;
    const visibleReplies =
      hasHiddenReplies && !expanded
        ? replies.slice(0, REPLY_PREVIEW_LIMIT)
        : replies;

    return (
      <div
        id={`comment-${comment.id}`}
        key={comment.id}
        className={`rounded-xl border border-border/70 bg-card/75 p-3 ${
          isReply ? "ml-6 mt-2" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>
                {(author?.name ?? "??").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {author ? (
                  <Link
                    href={`/profile/${author.id}`}
                    className="group/comment-author min-w-0 px-1 py-0.5"
                  >
                    <span className="block truncate text-sm font-semibold group-hover/comment-author:underline group-hover/comment-author:underline-offset-2">
                      {author.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground group-hover/comment-author:underline group-hover/comment-author:underline-offset-2">
                      @{author.handle}
                    </span>
                  </Link>
                ) : (
                  <span className="text-sm font-semibold">Unknown user</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {getDisplayTime(comment.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <TooltipHint content="Reply">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => openReply(comment)}
              >
                <Reply className="h-3.5 w-3.5" />
              </Button>
            </TooltipHint>
            {isMine ? (
              <TooltipHint content="Delete comment">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipHint>
            ) : (
              <TooltipHint content="Report comment">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => {
                    const reason = window.prompt(
                      "Report reason (e.g. spam, abuse, hate):",
                      "spam",
                    );
                    if (!reason) return;
                    reportCommentMutation.mutate({
                      commentId: comment.id,
                      reason,
                    });
                  }}
                >
                  <Flag className="h-3.5 w-3.5" />
                </Button>
              </TooltipHint>
            )}
          </div>
        </div>

        {comment.content && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground/95">
            {renderTextWithMentions(comment.content, handleMentionClick)}
          </p>
        )}

        {imageUrl && (
          <div className="mt-2 overflow-hidden rounded-xl border border-border/70 bg-muted/25">
            <Image
              src={imageUrl}
              alt="Comment attachment"
              width={700}
              height={700}
              className="max-h-[360px] w-full object-cover"
            />
          </div>
        )}

        {renderCommentVibes(comment)}

        {!isReply && replies.length > 0 && (
          <div className="mt-2">
            <div className="space-y-1.5">
              {visibleReplies.map((reply) => renderCommentCard(reply, true))}
            </div>
            {hasHiddenReplies && (
              <Button
                variant="ghost"
                className="mt-1 h-8 rounded-full px-3 text-xs"
                onClick={() =>
                  setExpandedReplyThreads((prev) => ({
                    ...prev,
                    [comment.id]: !expanded,
                  }))
                }
              >
                {expanded
                  ? "Hide replies"
                  : `View ${replies.length - REPLY_PREVIEW_LIMIT} more repl${replies.length - REPLY_PREVIEW_LIMIT === 1 ? "y" : "ies"}`}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-5">
      <Card className="border-border/70 bg-card/90">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="inline-flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              {commentCount.toLocaleString()} Comments
            </CardTitle>
            <Tabs
              value={sortMode}
              onValueChange={(value) => setSortMode(value as "top" | "newest")}
            >
              <TabsList className="grid h-auto min-h-11 w-[240px] grid-cols-2 gap-1 p-1">
                <TabsTrigger className="h-9" value="top">
                  Top Comments
                </TabsTrigger>
                <TabsTrigger className="h-9" value="newest">
                  Newest
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingComments ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-7 w-7 animate-spin text-foreground/70" />
            </div>
          ) : flattenedComments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-4 text-sm text-muted-foreground">
              No comments yet. Start the conversation.
            </div>
          ) : (
            <div className="space-y-2">
              {flattenedComments.map((comment) =>
                renderCommentCard(comment, false),
              )}
              {hasNextPage && (
                <Button
                  variant="secondary"
                  className="w-full rounded-xl"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading more comments...
                    </span>
                  ) : (
                    "View more comments"
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-3 border-border/70 bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Write a comment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/70 bg-card/90 p-3">
            {replyTarget && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs">
                <span>
                  Replying to{" "}
                  <span className="font-semibold">@{replyTarget.handle}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-2 text-xs"
                  onClick={() => setReplyTarget(null)}
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="relative">
              <Textarea
                ref={composerRef}
                value={composerText}
                maxLength={MAX_COMMENT_LENGTH}
                onChange={(event) => {
                  setComposerText(event.target.value);
                  setComposerCursor(
                    event.target.selectionStart ?? event.target.value.length,
                  );
                }}
                onClick={(event) => {
                  setComposerCursor(
                    event.currentTarget.selectionStart ?? composerText.length,
                  );
                }}
                onKeyUp={(event) => {
                  setComposerCursor(
                    event.currentTarget.selectionStart ?? composerText.length,
                  );
                }}
                placeholder="Write a comment..."
                className="min-h-[88px] resize-none pr-2"
              />

              {mentionQuery &&
                mentionSuggestions &&
                mentionSuggestions.length > 0 && (
                  <div className="absolute left-2 top-full z-50 mt-2 w-full max-w-sm rounded-xl border border-border/70 bg-popover/95 p-1 shadow-soft-xl">
                    {mentionSuggestions.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                        onClick={() => insertMention(profile.handle)}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={
                              supabase.storage
                                .from("avatars")
                                .getPublicUrl(profile.avatar_url ?? "").data
                                .publicUrl
                            }
                          />
                          <AvatarFallback>
                            {profile.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {profile.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            @{profile.handle}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {selectedImagePreview && (
              <div className="mt-2 overflow-hidden rounded-xl border border-border/70 bg-muted/20 p-2">
                <Image
                  src={selectedImagePreview}
                  alt="Selected comment image"
                  width={600}
                  height={600}
                  unoptimized
                  className="max-h-44 w-full rounded-lg object-cover"
                />
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePickImage}
                />
                <TooltipHint content="Add image">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </TooltipHint>
                <TooltipHint content="Insert emoji">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setComposerText((prev) => `${prev}🙂`)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </TooltipHint>
                {selectedImage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setSelectedImage(null);
                      if (selectedImagePreview) {
                        URL.revokeObjectURL(selectedImagePreview);
                      }
                      setSelectedImagePreview(null);
                    }}
                  >
                    Remove image
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {composerText.length}/{MAX_COMMENT_LENGTH}
                </span>
                <Button
                  className="rounded-full px-5"
                  onClick={handleSubmit}
                  disabled={
                    createCommentMutation.isPending ||
                    (composerText.trim().length === 0 && !selectedImage)
                  }
                >
                  {createCommentMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
