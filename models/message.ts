import mongoose, { Schema, model, models } from "mongoose";

export interface IMessage {
  _id?: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderEmail: string;
  recipient: mongoose.Types.ObjectId;
  recipientEmail: string;
  text: string;
  readByRecipient: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderEmail: { type: String, required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientEmail: { type: String, required: true },
    text: { type: String, required: true, maxlength: 1000 },
    readByRecipient: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = models?.Message || model<IMessage>("Message", messageSchema);

export default Message;
