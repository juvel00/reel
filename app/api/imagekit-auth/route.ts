import ImageKit from "imagekit";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (
      !process.env.NEXT_PUBLIC_PUBLIC_KEY ||
      !process.env.IMAGEKIT_PRIVATE_KEY ||
      !process.env.NEXT_PUBLIC_URL_ENDPOINT
    ) {
      return NextResponse.json(
        { error: "ImageKit environment variables are missing" },
        { status: 500 }
      );
    }

    const imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT,
    });

    return NextResponse.json(imagekit.getAuthenticationParameters());
  } catch {
    return NextResponse.json({ error: "ImageKit Auth failed" }, { status: 500 });
  }
}
