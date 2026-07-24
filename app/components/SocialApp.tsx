"use client";

import type { UploadResponse } from "@imagekit/next";
import {
  Bookmark,
  Clapperboard,
  Heart,
  Home,
  Loader2,
  LogIn,
  LogOut,
  MessageCircle,
  PlusSquare,
  Search,
  Send,
  ThumbsDown,
  UserRound,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import FileUpload from "./UploadFile";

type MediaType = "image" | "video";
type Interaction = "like" | "dislike" | "save";

type SocialPost = {
  id: string;
  authorId: string;
  authorEmail: string;
  caption: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: MediaType;
  likeCount: number;
  dislikeCount: number;
  saveCount: number;
  commentCount: number;
  likedByMe: boolean;
  dislikedByMe: boolean;
  savedByMe: boolean;
  createdAt: string;
  comments: Array<{
    id: string;
    authorId: string;
    authorEmail: string;
    text: string;
    createdAt: string;
  }>;
};

function displayName(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ") || "creator";
}

function getMediaType(url: string, fallback: MediaType = "image"): MediaType {
  const cleanUrl = url.split("?")[0]?.toLowerCase() ?? "";

  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(cleanUrl)) {
    return "video";
  }

  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/.test(cleanUrl)) {
    return "image";
  }

  return fallback;
}

function formatDate(date: string) {
  if (!date) {
    return "Now";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function SocialApp({
  initialPosts,
  initialError = "",
}: {
  initialPosts: SocialPost[];
  initialError?: string;
}) {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [error, setError] = useState(initialError);
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creating, setCreating] = useState(false);

  const savedPosts = useMemo(
    () => posts.filter((post) => post.savedByMe).length,
    [posts]
  );

  function handleUploadSuccess(response: UploadResponse) {
    const url = response.url ?? "";

    setMediaUrl(url);
    setMediaType(getMediaType(url, "image"));
  }

  async function createPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session?.user) {
      setError("Sign in to post");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          mediaUrl,
          mediaType: getMediaType(mediaUrl, mediaType),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create post");
      }

      setPosts((current) => [data.post, ...current]);
      setCaption("");
      setMediaUrl("");
      setMediaType("image");
      setUploadProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setCreating(false);
    }
  }

  async function updatePost(postId: string, action: Interaction) {
    if (!session?.user) {
      setError("Sign in to react");
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/interaction`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update post");
      }

      setPosts((current) =>
        current.map((post) => (post.id === postId ? data.post : post))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    }
  }

  async function addComment(postId: string, text: string) {
    if (!session?.user) {
      setError("Sign in to comment");
      return;
    }

    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to add comment");
    }

    setPosts((current) =>
      current.map((post) => (post.id === postId ? data.post : post))
    );
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content">
      <nav className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-neutral text-neutral-content">
              <Clapperboard className="h-5 w-5" />
            </span>
            <span className="text-xl font-black tracking-normal">Reel</span>
          </Link>

          <div className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-base-300 bg-base-200 px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-base-content/50" />
            <span className="text-sm text-base-content/60">Search creators</span>
          </div>

          <div className="flex items-center gap-2">
            {status === "authenticated" ? (
              <>
                <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                  {session.user?.email}
                </span>
                <button
                  className="btn btn-ghost btn-square"
                  title="Sign out"
                  onClick={() => void signOut()}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-neutral btn-sm gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,640px)_300px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <a className="flex items-center gap-3 rounded-lg bg-base-100 px-3 py-3 font-semibold shadow-sm">
              <Home className="h-5 w-5" />
              Feed
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-3 text-base-content/70">
              <PlusSquare className="h-5 w-5" />
              Create
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-3 text-base-content/70">
              <Bookmark className="h-5 w-5" />
              Saved
            </a>
          </div>
        </aside>

        <section className="space-y-5">
          <form
            onSubmit={createPost}
            className="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-base-200">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {session?.user?.email
                    ? displayName(session.user.email)
                    : "Guest creator"}
                </p>
                <p className="text-sm text-base-content/60">
                  {status === "authenticated"
                    ? "Ready to publish"
                    : "Sign in to publish"}
                </p>
              </div>
            </div>

            <textarea
              className="textarea textarea-bordered min-h-24 w-full resize-none text-base"
              placeholder="Write a caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
            />

            <div className="mt-3 grid gap-3">
              <FileUpload
                fileType="mixed"
                onSuccess={handleUploadSuccess}
                onProgress={setUploadProgress}
              />

              {uploadProgress > 0 && uploadProgress < 100 && (
                <progress
                  className="progress progress-primary w-full"
                  value={uploadProgress}
                  max="100"
                />
              )}

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className="input input-bordered w-full"
                  placeholder="Media URL"
                  value={mediaUrl}
                  onChange={(event) => {
                    setMediaUrl(event.target.value);
                    setMediaType(getMediaType(event.target.value, mediaType));
                  }}
                />
                <div className="join">
                  <button
                    className={`btn join-item ${mediaType === "image" ? "btn-neutral" : ""}`}
                    type="button"
                    onClick={() => setMediaType("image")}
                  >
                    Photo
                  </button>
                  <button
                    className={`btn join-item ${mediaType === "video" ? "btn-neutral" : ""}`}
                    type="button"
                    onClick={() => setMediaType("video")}
                  >
                    Video
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-error">{error}</p>}

            <div className="mt-4 flex justify-end">
              <button
                className="btn btn-neutral gap-2"
                disabled={creating || !caption.trim() || !mediaUrl.trim()}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post
              </button>
            </div>
          </form>

          {posts.length === 0 ? (
            <div className="rounded-lg border border-base-300 bg-base-100 p-8 text-center">
              <p className="text-lg font-bold">No posts yet</p>
              <p className="mt-1 text-sm text-base-content/60">
                The first upload gets the spotlight.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onInteract={updatePost}
                onComment={addComment}
              />
            ))
          )}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-base-content/60">Profile</p>
              <p className="mt-1 truncate font-bold">
                {session?.user?.email ?? "Guest"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-base-200 p-3">
                <p className="text-lg font-black">{posts.length}</p>
                <p className="text-xs text-base-content/60">Posts</p>
              </div>
              <div className="rounded-lg bg-base-200 p-3">
                <p className="text-lg font-black">{savedPosts}</p>
                <p className="text-xs text-base-content/60">Saved</p>
              </div>
              <div className="rounded-lg bg-base-200 p-3">
                <p className="text-lg font-black">
                  {posts.reduce((total, post) => total + post.commentCount, 0)}
                </p>
                <p className="text-xs text-base-content/60">Comments</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function PostCard({
  post,
  onInteract,
  onComment,
}: {
  post: SocialPost;
  onInteract: (postId: string, action: Interaction) => Promise<void>;
  onComment: (postId: string, text: string) => Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [commentError, setCommentError] = useState("");

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    setCommenting(true);
    setCommentError("");

    try {
      await onComment(post.id, comment);
      setComment("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to comment");
    } finally {
      setCommenting(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm">
      <header className="flex items-center justify-between p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral text-neutral-content">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold">{displayName(post.authorEmail)}</p>
            <p className="text-sm text-base-content/60">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        <span className="badge badge-ghost capitalize">{post.mediaType}</span>
      </header>

      <div className="bg-neutral">
        {post.mediaType === "video" ? (
          <video
            className="aspect-[4/5] w-full bg-neutral object-contain"
            src={post.mediaUrl}
            poster={post.thumbnailUrl || undefined}
            controls
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="aspect-[4/5] w-full bg-neutral object-cover"
            src={post.mediaUrl}
            alt={post.caption}
          />
        )}
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <IconButton
              active={post.likedByMe}
              label="Like"
              count={post.likeCount}
              onClick={() => onInteract(post.id, "like")}
            >
              <Heart className="h-5 w-5" />
            </IconButton>
            <IconButton
              active={post.dislikedByMe}
              label="Dislike"
              count={post.dislikeCount}
              onClick={() => onInteract(post.id, "dislike")}
            >
              <ThumbsDown className="h-5 w-5" />
            </IconButton>
            <IconButton label="Comments" count={post.commentCount}>
              <MessageCircle className="h-5 w-5" />
            </IconButton>
          </div>
          <IconButton
            active={post.savedByMe}
            label="Save"
            count={post.saveCount}
            onClick={() => onInteract(post.id, "save")}
          >
            <Bookmark className="h-5 w-5" />
          </IconButton>
        </div>

        <p className="leading-relaxed">
          <span className="font-bold">{displayName(post.authorEmail)}</span>{" "}
          {post.caption}
        </p>

        {post.comments.length > 0 && (
          <div className="space-y-2 border-t border-base-300 pt-3">
            {post.comments.slice(-3).map((item) => (
              <p key={item.id} className="text-sm">
                <span className="font-semibold">{displayName(item.authorEmail)}</span>{" "}
                {item.text}
              </p>
            ))}
          </div>
        )}

        <form className="flex gap-2" onSubmit={submitComment}>
          <input
            className="input input-bordered input-sm min-w-0 flex-1"
            placeholder="Add a comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <button
            className="btn btn-neutral btn-sm btn-square"
            title="Post comment"
            disabled={commenting || !comment.trim()}
          >
            {commenting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        {commentError && <p className="text-sm text-error">{commentError}</p>}
      </div>
    </article>
  );
}

function IconButton({
  active,
  label,
  count,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  count?: number;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`btn btn-ghost btn-sm gap-2 ${active ? "text-primary" : ""}`}
      type="button"
      title={label}
      onClick={onClick}
    >
      {children}
      {typeof count === "number" && <span>{count}</span>}
    </button>
  );
}
