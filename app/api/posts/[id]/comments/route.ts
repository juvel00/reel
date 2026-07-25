import { authOptions } from "@/lib/auth";
import { connectToDatabase, hasDatabaseUri } from "@/lib/db";
import { serializePost } from "@/lib/posts";
import Notification from "@/models/notification";
import Post from "@/models/post";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!hasDatabaseUri()) {
      return NextResponse.json(
        { error: "Add MONGODB_URI to .env before commenting" },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { text } = (await request.json()) as { text?: string };
    const trimmedText = text?.trim();

    if (!trimmedText) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    await connectToDatabase();
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    post.comments.push({
      author: session.user.id,
      authorEmail: session.user.email,
      text: trimmedText,
    });

    await post.save();

    if (post.author?.toString() !== session.user.id) {
      await Notification.create({
        recipient: post.author,
        actor: session.user.id,
        actorEmail: session.user.email,
        type: "comment",
        text: `${session.user.email} commented on your post`,
        post: post._id,
      });
    }

    return NextResponse.json({
      post: serializePost(post.toObject(), session.user.id),
    });
  } catch (error) {
    console.error("Failed to add comment", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
