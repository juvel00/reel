import { authOptions } from "@/lib/auth";
import { connectToDatabase, hasDatabaseUri } from "@/lib/db";
import { serializeMessage } from "@/lib/social";
import Message from "@/models/message";
import Notification from "@/models/notification";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    if (!hasDatabaseUri()) {
      return NextResponse.json({ messages: [], unreadCount: 0 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const messages = await Message.find({
      $or: [{ sender: session.user.id }, { recipient: session.user.id }],
    })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();
    const unreadCount = messages.filter(
      (message) =>
        message.recipient?.toString() === session.user.id &&
        !message.readByRecipient
    ).length;

    return NextResponse.json({
      messages: messages.map((message) =>
        serializeMessage(message, session.user.id)
      ),
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to fetch messages", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasDatabaseUri()) {
      return NextResponse.json(
        { error: "Add MONGODB_URI to .env before sending messages" },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientEmail, text } = (await request.json()) as {
      recipientEmail?: string;
      text?: string;
    };
    const normalizedEmail = recipientEmail?.trim().toLowerCase();
    const trimmedText = text?.trim();

    if (!normalizedEmail || !trimmedText) {
      return NextResponse.json(
        { error: "Recipient email and message are required" },
        { status: 400 }
      );
    }

    if (normalizedEmail === session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot message yourself" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const recipient = await User.findOne({ email: normalizedEmail });

    if (!recipient?._id) {
      return NextResponse.json(
        { error: "No user found with that email" },
        { status: 404 }
      );
    }

    const message = await Message.create({
      sender: session.user.id,
      senderEmail: session.user.email,
      recipient: recipient._id,
      recipientEmail: recipient.email,
      text: trimmedText,
    });

    await Notification.create({
      recipient: recipient._id,
      actor: session.user.id,
      actorEmail: session.user.email,
      type: "message",
      text: `${session.user.email} sent you a message`,
      message: message._id,
    });

    return NextResponse.json(
      { message: serializeMessage(message.toObject(), session.user.id) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to send message", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    if (!hasDatabaseUri()) {
      return NextResponse.json({ messages: [], unreadCount: 0 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    await Message.updateMany(
      { recipient: session.user.id, readByRecipient: false },
      { $set: { readByRecipient: true } }
    );

    const messages = await Message.find({
      $or: [{ sender: session.user.id }, { recipient: session.user.id }],
    })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    return NextResponse.json({
      messages: messages.map((message) =>
        serializeMessage(message, session.user.id)
      ),
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Failed to update messages", error);
    return NextResponse.json(
      { error: "Failed to update messages" },
      { status: 500 }
    );
  }
}
