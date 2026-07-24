import { connectToDatabase } from "@/lib/db";
import { hasDatabaseUri } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { serializePost } from "@/lib/posts";
import Post, { type MediaType } from "@/models/post";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    if (!hasDatabaseUri()) {
      return NextResponse.json({ posts: [] });
    }

    const session = await getServerSession(authOptions);

    await connectToDatabase();
    const posts = await Post.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      posts: posts.map((post) => serializePost(post, session?.user?.id)),
    });
  } catch (error) {
    console.error("Failed to fetch posts", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasDatabaseUri()) {
      return NextResponse.json(
        { error: "Add MONGODB_URI to .env before creating posts" },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      caption?: string;
      mediaUrl?: string;
      thumbnailUrl?: string;
      mediaType?: MediaType;
    };

    if (!body.caption || !body.mediaUrl || !body.mediaType) {
      return NextResponse.json(
        { error: "Caption, media URL, and media type are required" },
        { status: 400 }
      );
    }

    if (!["image", "video"].includes(body.mediaType)) {
      return NextResponse.json({ error: "Unsupported media type" }, { status: 400 });
    }

    await connectToDatabase();
    const post = await Post.create({
      author: session.user.id,
      authorEmail: session.user.email,
      caption: body.caption.trim(),
      mediaUrl: body.mediaUrl,
      thumbnailUrl: body.thumbnailUrl,
      mediaType: body.mediaType,
    });

    return NextResponse.json(
      { post: serializePost(post.toObject(), session.user.id) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create post", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
