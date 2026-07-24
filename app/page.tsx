import SocialApp from "./components/SocialApp";
import { authOptions } from "@/lib/auth";
import { connectToDatabase, hasDatabaseUri } from "@/lib/db";
import { serializePost } from "@/lib/posts";
import Post from "@/models/post";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

async function getInitialFeed() {
  if (!hasDatabaseUri()) {
    return {
      posts: [],
      error: "Add MONGODB_URI to .env to save and load posts.",
    };
  }

  try {
    const session = await getServerSession(authOptions);

    await connectToDatabase();
    const posts = await Post.find({}).sort({ createdAt: -1 }).lean();

    return {
      posts: posts.map((post) => serializePost(post, session?.user?.id)),
      error: "",
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "development") {
      console.error("Failed to load home feed", error);
    }

    return { posts: [], error: "Feed is offline" };
  }
}

export default async function Home() {
  const feed = await getInitialFeed();

  return <SocialApp initialPosts={feed.posts} initialError={feed.error} />;
}
