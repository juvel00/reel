import mongoose from "mongoose";
import type { IMessage } from "@/models/message";
import type { INotification } from "@/models/notification";

type IdLike = mongoose.Types.ObjectId | string | undefined;

type LeanNotification = Omit<INotification, "recipient" | "actor" | "post" | "message"> & {
  _id?: IdLike;
  recipient: IdLike;
  actor: IdLike;
  post?: IdLike;
  message?: IdLike;
};

type LeanMessage = Omit<IMessage, "sender" | "recipient"> & {
  _id?: IdLike;
  sender: IdLike;
  recipient: IdLike;
};

function toStringId(value: IdLike) {
  return value?.toString() ?? "";
}

export function serializeNotification(notification: LeanNotification) {
  return {
    id: toStringId(notification._id),
    recipientId: toStringId(notification.recipient),
    actorId: toStringId(notification.actor),
    actorEmail: notification.actorEmail,
    type: notification.type,
    text: notification.text,
    postId: toStringId(notification.post),
    messageId: toStringId(notification.message),
    read: notification.read,
    createdAt: notification.createdAt?.toString() ?? "",
  };
}

export function serializeMessage(message: LeanMessage, viewerId: string) {
  const senderId = toStringId(message.sender);
  const recipientId = toStringId(message.recipient);

  return {
    id: toStringId(message._id),
    senderId,
    senderEmail: message.senderEmail,
    recipientId,
    recipientEmail: message.recipientEmail,
    text: message.text,
    sentByMe: senderId === viewerId,
    readByRecipient: message.readByRecipient,
    createdAt: message.createdAt?.toString() ?? "",
  };
}

export type SerializedNotification = ReturnType<typeof serializeNotification>;
export type SerializedMessage = ReturnType<typeof serializeMessage>;
