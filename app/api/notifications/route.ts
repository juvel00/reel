import { authOptions } from "@/lib/auth";
import { connectToDatabase, hasDatabaseUri } from "@/lib/db";
import { serializeNotification } from "@/lib/social";
import Notification from "@/models/notification";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!hasDatabaseUri()) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const notifications = await Notification.find({
      recipient: session.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    const unreadCount = notifications.filter((item) => !item.read).length;

    return NextResponse.json({
      notifications: notifications.map(serializeNotification),
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to fetch notifications", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    if (!hasDatabaseUri()) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    await Notification.updateMany(
      { recipient: session.user.id, read: false },
      { $set: { read: true } }
    );

    const notifications = await Notification.find({
      recipient: session.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      notifications: notifications.map(serializeNotification),
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Failed to update notifications", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
