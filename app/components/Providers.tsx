"use client";

import { ImageKitProvider } from "@imagekit/next";
import { SessionProvider } from "next-auth/react";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ImageKitProvider urlEndpoint={process.env.NEXT_PUBLIC_URL_ENDPOINT!}>
        {children}
      </ImageKitProvider>
    </SessionProvider>
  );
}
