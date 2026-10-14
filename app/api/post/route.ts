import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const MAX_IMAGES_PER_POST = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: Request) {
  let savedImagePaths: string[] = [];

  try {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: number;
    try {
      const decoded = jwt.verify(token, secretKey);
      const decodedUserId =
        typeof decoded === "string" ? undefined : decoded.userId;
      userId = Number(decodedUserId);
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error("Invalid user ID in token");
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid multipart form data" },
        { status: 400 },
      );
    }

    const contentValue = formData.get("content");
    const visibilityValue = formData.get("isPublic");
    const imageValues = formData.getAll("images");

    if (typeof contentValue !== "string" || !contentValue.trim()) {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 },
      );
    }

    if (
      visibilityValue !== null &&
      visibilityValue !== "true" &&
      visibilityValue !== "false"
    ) {
      return NextResponse.json(
        { error: "Post visibility is invalid" },
        { status: 400 },
      );
    }

    if (imageValues.length > MAX_IMAGES_PER_POST) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_IMAGES_PER_POST} images` },
        { status: 400 },
      );
    }

    if (imageValues.some((value) => !(value instanceof File))) {
      return NextResponse.json(
        { error: "Uploaded images are invalid" },
        { status: 400 },
      );
    }

    const imageFiles = imageValues.filter(
      (value): value is File => value instanceof File,
    );
    for (const image of imageFiles) {
      if (image.size === 0 || !IMAGE_EXTENSIONS[image.type]) {
        return NextResponse.json(
          { error: "Images must be non-empty JPEG, PNG, WebP, or GIF files" },
          { status: 400 },
        );
      }
      if (image.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "Each image must be 5 MB or smaller" },
          { status: 400 },
        );
      }
    }

    const uploadDirectory = path.join(process.cwd(), "public", "images");
    const imageCreateData: { url: string }[] = [];

    if (imageFiles.length > 0) {
      await mkdir(uploadDirectory, { recursive: true });

      for (const image of imageFiles) {
        const filename = `${randomUUID()}${IMAGE_EXTENSIONS[image.type]}`;
        const imagePath = path.join(uploadDirectory, filename);
        await writeFile(imagePath, Buffer.from(await image.arrayBuffer()), {
          flag: "wx",
        });
        savedImagePaths.push(imagePath);
        imageCreateData.push({ url: filename });
      }
    }

    const newPost = await prisma.post.create({
      data: {
        content: contentValue.trim(),
        isPublic: visibilityValue !== "false",
        userId,
        images: {
          create: imageCreateData,
        },
      },
      include: {
        user: { select: { id: true, name: true, img: true } },
        images: true,
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    await Promise.all(
      savedImagePaths.map((imagePath) =>
        rm(imagePath, { force: true }).catch((cleanupError: unknown) => {
          console.error("Failed to remove unused post image:", cleanupError);
        }),
      ),
    );
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
