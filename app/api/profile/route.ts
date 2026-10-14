import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secretKey = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secretKey) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    console.error("JWT_SECRET is not defined in environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  let userId: number;
  try {
    const decoded = jwt.verify(token, secretKey);
    const decodedUserId =
      typeof decoded === "string" ? undefined : decoded.userId;
    if (
      typeof decodedUserId !== "number" ||
      !Number.isSafeInteger(decodedUserId) ||
      decodedUserId <= 0
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = decodedUserId;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 },
    );
  }

  const name = formData.get("name");
  const bio = formData.get("bio");
  const image = formData.get("img");

  if (typeof name !== "string" || !name.trim() || typeof bio !== "string") {
    return NextResponse.json(
      { error: "Name or bio is invalid" },
      { status: 400 },
    );
  }

  const imageExtensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  let imageUrl: string | undefined;
  let imagePath: string | undefined;

  try {
    if (image !== null) {
      if (!(image instanceof File) || image.size === 0) {
        return NextResponse.json(
          { error: "The uploaded image is invalid" },
          { status: 400 },
        );
      }

      const extension = imageExtensions[image.type];
      if (!extension) {
        return NextResponse.json(
          { error: "Upload a JPEG, PNG, WebP, or GIF image" },
          { status: 400 },
        );
      }

      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image must be 5 MB or smaller" },
          { status: 400 },
        );
      }

      const filename = `${randomUUID()}${extension}`;
      const uploadDirectory = path.join(process.cwd(), "public", "profile");
      imagePath = path.join(uploadDirectory, filename);
      await mkdir(uploadDirectory, { recursive: true });
      await writeFile(imagePath, Buffer.from(await image.arrayBuffer()), {
        flag: "wx",
      });
      imageUrl = `/profile/${filename}`;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        bio: bio || null,
        ...(imageUrl ? { img: imageUrl } : {}),
      },
      select: {
        name: true,
        email: true,
        bio: true,
        img: true,
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    if (imagePath) {
      await unlink(imagePath).catch((cleanupError: unknown) => {
        console.error("Failed to remove unused profile image:", cleanupError);
      });
    }
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
