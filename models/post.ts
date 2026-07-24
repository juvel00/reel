import mongoose, { Schema, model, models } from "mongoose";

export type MediaType = "image" | "video";

export interface IComment {
  _id?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorEmail: string;
  text: string;
  createdAt?: Date;
}

export interface IPost {
  _id?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorEmail: string;
  caption: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: MediaType;
  likes: mongoose.Types.ObjectId[];
  dislikes: mongoose.Types.ObjectId[];
  saves: mongoose.Types.ObjectId[];
  comments: IComment[];
  createdAt?: Date;
  updatedAt?: Date;
}

const commentSchema = new Schema<IComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorEmail: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorEmail: { type: String, required: true },
    caption: { type: String, required: true, maxlength: 2200 },
    mediaUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video"], required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    saves: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

const Post = models?.Post || model<IPost>("Post", postSchema);

export default Post;
