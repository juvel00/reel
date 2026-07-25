import mongoose, { Schema, model, models } from "mongoose";

export type NotificationType = "like" | "dislike" | "save" | "comment" | "message";

export interface INotification {
  _id?: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  actorEmail: string;
  type: NotificationType;
  text: string;
  post?: mongoose.Types.ObjectId;
  message?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorEmail: { type: String, required: true },
    type: {
      type: String,
      enum: ["like", "dislike", "save", "comment", "message"],
      required: true,
    },
    text: { type: String, required: true, maxlength: 280 },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
    message: { type: Schema.Types.ObjectId, ref: "Message" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification =
  models?.Notification ||
  model<INotification>("Notification", notificationSchema);

export default Notification;
