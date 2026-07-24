import mongoose from "mongoose";
import type { IPost } from "@/models/post";

type LeanComment = {
  _id?: mongoose.Types.ObjectId | string;
  author?: mongoose.Types.ObjectId | string;
  authorEmail: string;
  text: string;
  createdAt?: Date | string;
};

type LeanPost = Omit<IPost, "comments"> & {
  _id?: mongoose.Types.ObjectId | string;
  author: mongoose.Types.ObjectId | string;
  comments: LeanComment[];
};

function toStringId(value: mongoose.Types.ObjectId | string | undefined) {
  return value?.toString() ?? "";
}

function includesUser(
  ids: Array<mongoose.Types.ObjectId | string> | undefined,
  userId?: string
) {
  if (!userId || !ids) {
    return false;
  }

  return ids.some((id) => id.toString() === userId);
}

export function serializePost(post: LeanPost, userId?: string) {
  return {
    id: toStringId(post._id),
    authorId: toStringId(post.author),
    authorEmail: post.authorEmail,
    caption: post.caption,
    mediaUrl: post.mediaUrl,
    thumbnailUrl: post.thumbnailUrl ?? "",
    mediaType: post.mediaType,
    likeCount: post.likes?.length ?? 0,
    dislikeCount: post.dislikes?.length ?? 0,
    saveCount: post.saves?.length ?? 0,
    commentCount: post.comments?.length ?? 0,
    likedByMe: includesUser(post.likes, userId),
    dislikedByMe: includesUser(post.dislikes, userId),
    savedByMe: includesUser(post.saves, userId),
    createdAt: post.createdAt?.toString() ?? "",
    comments:
      post.comments?.map((comment) => ({
        id: toStringId(comment._id),
        authorId: toStringId(comment.author),
        authorEmail: comment.authorEmail,
        text: comment.text,
        createdAt: comment.createdAt?.toString() ?? "",
      })) ?? [],
  };
}

export type SerializedPost = ReturnType<typeof serializePost>;
