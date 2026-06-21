"use client"; // This component must be a client component

import {
  upload,
} from "@imagekit/next";
import type { UploadResponse } from "@imagekit/next";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface FileUploadProps {
  onSuccess: (res: UploadResponse) => void;
  onProgress?: (progress: number) => void;
  fileType?: "image" | "video";
}

const FileUpload = ({ onSuccess, onProgress, fileType }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    if (fileType === "video") {
      if (!file.type.startsWith("video/")) {
        setError("Please upload a valid video file");
        return false;
      }
    }
    if (fileType !== "video" && !file.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return false;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100 MB");
      return false;
    }
    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || !validateFile(file)) return;

    setUploading(true);
    setError(null);

    try {
      const authRes = await fetch("/api/imagekit-auth");
      if (!authRes.ok) {
        throw new Error("Failed to fetch upload auth");
      }

      const auth = await authRes.json();

      const res = await upload({
        file,
        fileName: file.name,
        publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY!,
        signature: auth.signature,
        expire: auth.expire,
        token: auth.token,
        onProgress: (event) => {
          if(event.lengthComputable && onProgress){
            const percent = (event.loaded / event.total) * 100;
            onProgress(Math.round(percent))
          }
        },
      });
      onSuccess(res)
    } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        setError(message);
        console.error("Upload failed", error)
    } finally {
        setUploading(false)
    }
  };

  return (
    <>
      <input
        type="file"
        accept={fileType === "video" ? "video/*" : "image/*"}
        onChange={handleFileChange}
      />
      {error && <span>{error}</span>}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Loader2 className="animate-spin w-4 h-4"></Loader2>
          <span>Loading....</span>
        </div>
      )}
    </>
  );
};

export default FileUpload;























// "use client";

// import { useRef, useState } from "react";
// import { upload } from "@imagekit/next";
// import { Loader2 } from "lucide-react";
// import { UploadResponse } from "@imagekit/next";


// interface FileUploadProps{
//   onSuccess: (res:UploadResponse)=>void
//   onProgress?: (progress:number)=>void
//   fileType? : "image" | "video"
// }

// async function getUploadAuth() {
//   const response = await fetch("/api/imagekit-auth");

//   if (!response.ok) {
//     throw new Error("Authentication failed");
//   }

//   return response.json() as Promise<{
//     signature: string;
//     expire: number;
//     token: string;
//   }>;
// }

// export default function UploadFile({
//   onSuccess,
//   onProgress,
//   fileType="image"
// }:FileUploadProps, response:UploadResponse) {
//   const inputRef = useRef<HTMLInputElement>(null);
//   const [url, setUrl] = useState("");
//   const [error, setError] = useState<string|null>("");
//   const [isUploading, setIsUploading] = useState(false);

//   const handleFileChange = async (
//     event: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     setError("");
//     setIsUploading(true);
//     onSuccess(response)

//     try {
//       const auth = await getUploadAuth();
//       const result = await upload({
//         file,
//         fileName: file.name,
//         useUniqueFileName: true,
//         publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY!,
//         ...auth,
//       });

//       setUrl(result.url ?? "");
//     } catch (err) {
//       console.error(err);
//       setError(err instanceof Error ? err.message : "Upload failed");
//     } finally {
//       setIsUploading(false);
//       if (inputRef.current) {
//         inputRef.current.value = "";
//       }
//     }
//   };

//   return (
//     <div>
//       <input
//         ref={inputRef}
//         type="file"
//         accept="image/*,video/*"
//         disabled={isUploading}
//         onChange={handleFileChange}
//       />

//       {isUploading && <p>Uploading...</p>}
//       {error && <p>{error}</p>}

//       {url && (
//         <div>
//           <p>Uploaded:</p>
//           <a href={url} target="_blank" rel="noreferrer">
//             {url}
//           </a>
//         </div>
//       )}
//     </div>
//   );
// }
