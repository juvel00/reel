"use client";

import type { UploadResponse } from "@imagekit/next";
import {
  Bell,
  Bookmark,
  Clapperboard,
  Heart,
  Home,
  Inbox,
  Loader2,
  LogIn,
  LogOut,
  MessageCircle,
  PlusSquare,
  Search,
  Send,
  ThumbsDown,
  UserRound,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import FileUpload from "./UploadFile";

type MediaType = "image" | "video";
type Interaction = "like" | "dislike" | "save";
type Panel = "notifications" | "messages" | null;

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

type SocialNotification = {
  id: string;
  actorEmail: string;
  type: "like" | "dislike" | "save" | "comment" | "message";
  text: string;
  read: boolean;
  createdAt: string;
};

type SocialMessage = {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  text: string;
  sentByMe: boolean;
  readByRecipient: boolean;
  createdAt: string;
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
  initialNotifications,
  initialMessages,
  initialNotificationUnreadCount,
  initialMessageUnreadCount,
  initialError = "",
}: {
  initialPosts: SocialPost[];
  initialNotifications: SocialNotification[];
  initialMessages: SocialMessage[];
  initialNotificationUnreadCount: number;
  initialMessageUnreadCount: number;
  initialError?: string;
}) {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [notifications, setNotifications] =
    useState<SocialNotification[]>(initialNotifications);
  const [messages, setMessages] = useState<SocialMessage[]>(initialMessages);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(
    initialNotificationUnreadCount
  );
  const [messageUnreadCount, setMessageUnreadCount] = useState(
    initialMessageUnreadCount
  );
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [error, setError] = useState(initialError);
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creating, setCreating] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const savedPosts = useMemo(
    () => posts.filter((post) => post.savedByMe).length,
    [posts]
  );

  function requireSignIn(action: string) {
    if (!session?.user) {
      setError(`Sign in to ${action}`);
      return false;
    }

    return true;
  }

  function openComposer() {
    if (!requireSignIn("post")) {
      return;
    }

    setComposerOpen(true);
  }

  async function openPanel(panel: Panel) {
    if (!panel || !requireSignIn(panel === "messages" ? "message" : "view alerts")) {
      return;
    }

    setActivePanel((current) => (current === panel ? null : panel));

    if (panel === "notifications") {
      const response = await fetch("/api/notifications", { method: "PATCH" });
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications ?? []);
        setNotificationUnreadCount(data.unreadCount ?? 0);
      }
    }

    if (panel === "messages") {
      const response = await fetch("/api/messages", { method: "PATCH" });
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages ?? []);
        setMessageUnreadCount(data.unreadCount ?? 0);
      }
    }
  }

  function handleUploadSuccess(response: UploadResponse) {
    const url = response.url ?? "";

    setMediaUrl(url);
    setMediaType(getMediaType(url, "image"));
  }

  async function createPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!requireSignIn("post")) {
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
      setComposerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setCreating(false);
    }
  }

  async function updatePost(postId: string, action: Interaction) {
    if (!requireSignIn("react")) {
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
    if (!requireSignIn("comment")) {
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

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!requireSignIn("message")) {
      return;
    }

    setSendingMessage(true);
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail, text: messageText }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send message");
      }

      setMessages((current) => [data.message, ...current]);
      setRecipientEmail("");
      setMessageText("");
      setActivePanel("messages");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
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

          <div className="flex items-center gap-1">
            <BadgeButton label="Create post" onClick={openComposer}>
              <PlusSquare className="h-5 w-5" />
            </BadgeButton>
            <BadgeButton
              label="Notifications"
              count={notificationUnreadCount}
              onClick={() => void openPanel("notifications")}
            >
              <Bell className="h-5 w-5" />
            </BadgeButton>
            <BadgeButton
              label="Messages"
              count={messageUnreadCount}
              onClick={() => void openPanel("messages")}
            >
              <Inbox className="h-5 w-5" />
            </BadgeButton>
            {status === "authenticated" ? (
              <>
                <span className="hidden max-w-36 truncate px-2 text-sm font-medium sm:block">
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
            <button className="flex w-full items-center gap-3 rounded-lg bg-base-100 px-3 py-3 font-semibold shadow-sm">
              <Home className="h-5 w-5" />
              Feed
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base-content/70"
              onClick={openComposer}
            >
              <PlusSquare className="h-5 w-5" />
              Create
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base-content/70"
              onClick={() => void openPanel("notifications")}
            >
              <Bell className="h-5 w-5" />
              Alerts
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base-content/70"
              onClick={() => void openPanel("messages")}
            >
              <Inbox className="h-5 w-5" />
              Messages
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base-content/70">
              <Bookmark className="h-5 w-5" />
              Saved
            </button>
          </div>
        </aside>

        <section className="space-y-5">
          {error && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-base-content">
              {error}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="rounded-lg border border-base-300 bg-base-100 p-8 text-center">
              <p className="text-lg font-bold">No posts yet</p>
              <p className="mt-1 text-sm text-base-content/60">
                Click the plus icon to publish the first post.
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
          <SidePanel
            activePanel={activePanel}
            notifications={notifications}
            messages={messages}
            recipientEmail={recipientEmail}
            messageText={messageText}
            sendingMessage={sendingMessage}
            onRecipientEmailChange={setRecipientEmail}
            onMessageTextChange={setMessageText}
            onSendMessage={sendMessage}
            onClose={() => setActivePanel(null)}
            fallbackProfile={session?.user?.email ?? "Guest"}
            postsCount={posts.length}
            savedPosts={savedPosts}
          />
        </aside>
      </div>

      {activePanel && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100 p-4 shadow-2xl xl:hidden">
          <SidePanel
            activePanel={activePanel}
            notifications={notifications}
            messages={messages}
            recipientEmail={recipientEmail}
            messageText={messageText}
            sendingMessage={sendingMessage}
            onRecipientEmailChange={setRecipientEmail}
            onMessageTextChange={setMessageText}
            onSendMessage={sendMessage}
            onClose={() => setActivePanel(null)}
            fallbackProfile={session?.user?.email ?? "Guest"}
            postsCount={posts.length}
            savedPosts={savedPosts}
          />
        </div>
      )}

      {composerOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/70 p-4">
          <form
            onSubmit={createPost}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-base-300 bg-base-100 p-4 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-base-200">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">
                    {session?.user?.email
                      ? displayName(session.user.email)
                      : "Guest creator"}
                  </p>
                  <p className="text-sm text-base-content/60">Create a post</p>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-square"
                type="button"
                title="Close composer"
                onClick={() => setComposerOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
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

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setComposerOpen(false)}
              >
                Cancel
              </button>
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
        </div>
      )}
    </main>
  );
}

function SidePanel({
  activePanel,
  notifications,
  messages,
  recipientEmail,
  messageText,
  sendingMessage,
  onRecipientEmailChange,
  onMessageTextChange,
  onSendMessage,
  onClose,
  fallbackProfile,
  postsCount,
  savedPosts,
}: {
  activePanel: Panel;
  notifications: SocialNotification[];
  messages: SocialMessage[];
  recipientEmail: string;
  messageText: string;
  sendingMessage: boolean;
  onRecipientEmailChange: (value: string) => void;
  onMessageTextChange: (value: string) => void;
  onSendMessage: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  fallbackProfile: string;
  postsCount: number;
  savedPosts: number;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-base-content/60">
            {activePanel === "messages"
              ? "Messages"
              : activePanel === "notifications"
                ? "Notifications"
                : "Profile"}
          </p>
          <p className="mt-1 truncate font-bold">{fallbackProfile}</p>
        </div>
        {activePanel && (
          <button
            className="btn btn-ghost btn-square btn-sm"
            title="Close panel"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!activePanel && (
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-base-200 p-3">
            <p className="text-lg font-black">{postsCount}</p>
            <p className="text-xs text-base-content/60">Posts</p>
          </div>
          <div className="rounded-lg bg-base-200 p-3">
            <p className="text-lg font-black">{savedPosts}</p>
            <p className="text-xs text-base-content/60">Saved</p>
          </div>
        </div>
      )}

      {activePanel === "notifications" && (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="rounded-lg bg-base-200 p-4 text-sm text-base-content/60">
              No notifications yet.
            </p>
          ) : (
            notifications.map((item) => (
              <div key={item.id} className="rounded-lg bg-base-200 p-3">
                <p className="text-sm font-semibold">{item.text}</p>
                <p className="mt-1 text-xs text-base-content/60">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {activePanel === "messages" && (
        <div className="space-y-4">
          <form className="space-y-2" onSubmit={onSendMessage}>
            <input
              className="input input-bordered input-sm w-full"
              placeholder="Recipient email"
              type="email"
              value={recipientEmail}
              onChange={(event) => onRecipientEmailChange(event.target.value)}
            />
            <textarea
              className="textarea textarea-bordered min-h-20 w-full resize-none"
              placeholder="Write a message"
              value={messageText}
              onChange={(event) => onMessageTextChange(event.target.value)}
            />
            <button
              className="btn btn-neutral btn-sm w-full gap-2"
              disabled={
                sendingMessage || !recipientEmail.trim() || !messageText.trim()
              }
            >
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send message
            </button>
          </form>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="rounded-lg bg-base-200 p-4 text-sm text-base-content/60">
                No messages yet.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg p-3 ${
                    message.sentByMe
                      ? "bg-neutral text-neutral-content"
                      : "bg-base-200"
                  }`}
                >
                  <p className="text-xs opacity-70">
                    {message.sentByMe
                      ? `To ${message.recipientEmail}`
                      : `From ${message.senderEmail}`}
                  </p>
                  <p className="mt-1 text-sm">{message.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
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
            <p className="text-sm text-base-content/60">
              {formatDate(post.createdAt)}
            </p>
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
                <span className="font-semibold">
                  {displayName(item.authorEmail)}
                </span>{" "}
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

function BadgeButton({
  label,
  count,
  onClick,
  children,
}: {
  label: string;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="btn btn-ghost btn-square relative"
      type="button"
      title={label}
      onClick={onClick}
    >
      {children}
      {Boolean(count) && (
        <span className="badge badge-primary badge-xs absolute right-1 top-1">
          {count}
        </span>
      )}
    </button>
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
