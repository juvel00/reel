import SocialApp from "./components/SocialApp";
import { authOptions } from "@/lib/auth";
import { connectToDatabase, hasDatabaseUri } from "@/lib/db";
import { serializePost } from "@/lib/posts";
import { serializeMessage, serializeNotification } from "@/lib/social";
import Message from "@/models/message";
import Notification from "@/models/notification";
import Post from "@/models/post";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

async function getInitialFeed() {
  if (!hasDatabaseUri()) {
    return {
      posts: [],
      notifications: [],
      messages: [],
      notificationUnreadCount: 0,
      messageUnreadCount: 0,
      error: "Add MONGODB_URI to .env to save and load posts.",
    };
  }

  try {
    const session = await getServerSession(authOptions);

    await connectToDatabase();
    const posts = await Post.find({}).sort({ createdAt: -1 }).lean();
    const notifications = session?.user?.id
      ? await Notification.find({ recipient: session.user.id })
          .sort({ createdAt: -1 })
          .limit(30)
          .lean()
      : [];
    const messages = session?.user?.id
      ? await Message.find({
          $or: [{ sender: session.user.id }, { recipient: session.user.id }],
        })
          .sort({ createdAt: -1 })
          .limit(60)
          .lean()
      : [];

    return {
      posts: posts.map((post) => serializePost(post, session?.user?.id)),
      notifications: notifications.map(serializeNotification),
      messages: session?.user?.id
        ? messages.map((message) => serializeMessage(message, session.user.id))
        : [],
      notificationUnreadCount: notifications.filter((item) => !item.read).length,
      messageUnreadCount: session?.user?.id
        ? messages.filter(
            (message) =>
              message.recipient?.toString() === session.user.id &&
              !message.readByRecipient
          ).length
        : 0,
      error: "",
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "development") {
      console.error("Failed to load home feed", error);
    }

    return {
      posts: [],
      notifications: [],
      messages: [],
      notificationUnreadCount: 0,
      messageUnreadCount: 0,
      error: "Feed is offline",
    };
  }
}

export default async function Home() {
  const feed = await getInitialFeed();

  return (
    <SocialApp
      initialPosts={feed.posts}
      initialNotifications={feed.notifications}
      initialMessages={feed.messages}
      initialNotificationUnreadCount={feed.notificationUnreadCount}
      initialMessageUnreadCount={feed.messageUnreadCount}
      initialError={feed.error}
    />
  );
}
