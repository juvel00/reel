"use client";

import { upload } from "@imagekit/next";
import type { UploadResponse } from "@imagekit/next";
import { ImagePlus, Loader2, Video } from "lucide-react";
import { useState } from "react";

interface FileUploadProps {
  onSuccess: (res: UploadResponse) => void;
  onProgress?: (progress: number) => void;
  fileType?: "image" | "video" | "mixed";
}

const FileUpload = ({
  onSuccess,
  onProgress,
  fileType = "mixed",
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    if (fileType === "video" && !file.type.startsWith("video/")) {
      setError("Please upload a valid video file");
      return false;
    }

    if (fileType === "image" && !file.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return false;
    }

    if (
      fileType === "mixed" &&
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
    ) {
      setError("Please upload a valid photo or video file");
      return false;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100 MB");
      return false;
    }

    return true;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !validateFile(file)) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      if (!process.env.NEXT_PUBLIC_PUBLIC_KEY) {
        throw new Error("ImageKit public key is missing");
      }

      const authRes = await fetch("/api/imagekit-auth");
      if (!authRes.ok) {
        throw new Error("Failed to fetch upload auth");
      }

      const auth = await authRes.json();

      const res = await upload({
        file,
        fileName: file.name,
        publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY,
        signature: auth.signature,
        expire: auth.expire,
        token: auth.token,
        onProgress: (progressEvent) => {
          if (progressEvent.lengthComputable && onProgress) {
            const percent = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(Math.round(percent));
          }
        },
      });

      onSuccess(res);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const accept =
    fileType === "mixed"
      ? "image/*,video/*"
      : fileType === "video"
        ? "video/*"
        : "image/*";

  return (
    <div className="space-y-3">
      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-base-300 bg-base-100 p-6 text-center transition hover:border-primary hover:bg-primary/5">
        <input
          className="sr-only"
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={handleFileChange}
        />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-base-200 text-base-content">
          {fileType === "video" ? (
            <Video className="h-5 w-5" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </span>
        <span className="text-sm font-semibold">
          {uploading ? "Uploading media" : "Choose photo or video"}
        </span>
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
