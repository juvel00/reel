import { authOptions } from "@/lib/auth";
import { connectToDatabase, hasDatabaseUri } from "@/lib/db";
import { serializePost } from "@/lib/posts";
import Notification from "@/models/notification";
import Post from "@/models/post";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type Interaction = "like" | "dislike" | "save";
type IdValue = mongoose.Types.ObjectId | string;

function toggleId(values: IdValue[], userId: string) {
  const exists = values.some((value) => value?.toString() === userId);

  return exists
    ? values.filter((value) => value?.toString() !== userId)
    : [...values, new mongoose.Types.ObjectId(userId)];
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!hasDatabaseUri()) {
      return NextResponse.json(
        { error: "Add MONGODB_URI to .env before reacting to posts" },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { action } = (await request.json()) as { action?: Interaction };

    if (!action || !["like", "dislike", "save"].includes(action)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await connectToDatabase();
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const wasActive =
      action === "like"
        ? post.likes.some((value: IdValue) => value?.toString() === session.user.id)
        : action === "dislike"
          ? post.dislikes.some(
              (value: IdValue) => value?.toString() === session.user.id
            )
          : post.saves.some(
              (value: IdValue) => value?.toString() === session.user.id
            );

    if (action === "like") {
      post.likes = toggleId(post.likes, session.user.id);
      post.dislikes = post.dislikes.filter(
        (value: IdValue) => value?.toString() !== session.user.id
      );
    }

    if (action === "dislike") {
      post.dislikes = toggleId(post.dislikes, session.user.id);
      post.likes = post.likes.filter(
        (value: IdValue) => value?.toString() !== session.user.id
      );
    }

    if (action === "save") {
      post.saves = toggleId(post.saves, session.user.id);
    }

    await post.save();

    if (
      !wasActive &&
      session.user.email &&
      post.author?.toString() !== session.user.id
    ) {
      const labels = {
        like: "liked your post",
        dislike: "disliked your post",
        save: "saved your post",
      };

      await Notification.create({
        recipient: post.author,
        actor: session.user.id,
        actorEmail: session.user.email,
        type: action,
        text: `${session.user.email} ${labels[action]}`,
        post: post._id,
      });
    }

    return NextResponse.json({
      post: serializePost(post.toObject(), session.user.id),
    });
  } catch (error) {
    console.error("Failed to update interaction", error);
    return NextResponse.json(
      { error: "Failed to update interaction" },
      { status: 500 }
    );
  }
}
