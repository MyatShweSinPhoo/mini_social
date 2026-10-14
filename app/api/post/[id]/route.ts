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

// 🗑️ DELETE Post API
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const postId = Number(id);

    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: number;
    try {
      const decoded = jwt.verify(token, secretKey);
      const decodedUserId =
        typeof decoded === "string" ? undefined : decoded.userId;
      userId = Number(decodedUserId);
      if (isNaN(userId) || userId <= 0) throw new Error();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Post ပိုင်ရှင် ဟုတ်မဟုတ် စစ်ဆေးခြင်း
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { images: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Storage ထဲမှ ပုံဖိုင်များကို ဖျက်ဆືခြင်း
    const uploadDirectory = path.join(process.cwd(), "public");
    for (const image of post.images) {
      try {
        // image.url သည် "/images/filename.jpg" ဖြစ်နေသောကြောင့် ဖြုတ်ထုတ်ရန်
        const relativePath = image.url.startsWith("/")
          ? image.url.slice(1)
          : image.url;
        const filePath = path.join(uploadDirectory, relativePath);
        await rm(filePath, { force: true });
      } catch (err) {
        console.error("Failed to delete image file:", err);
      }
    }

    // Database မှ Post ကို ဖျက်ခြင်း
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}

// ✏️ UPDATE (PUT) Post API
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const postId = Number(id);

    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: number;
    try {
      const decoded = jwt.verify(token, secretKey);
      const decodedUserId =
        typeof decoded === "string" ? undefined : decoded.userId;
      userId = Number(decodedUserId);
      if (isNaN(userId) || userId <= 0) throw new Error();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Existing Post ကို စစ်ဆေးခြင်း
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { images: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const deletedImageIdsValue = formData.get("deletedImageIds");
    const imageValues = formData.getAll("images");

    if (contentValue !== null && typeof contentValue !== "string") {
      return NextResponse.json(
        { error: "Post content must be text" },
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

    // ဖျက်လိုသော ပုံ IDs များကို Parse လုပ်ခြင်း
    let deletedImageIds: number[] = [];
    if (deletedImageIdsValue && typeof deletedImageIdsValue === "string") {
      try {
        deletedImageIds = JSON.parse(deletedImageIdsValue).map(Number);
      } catch {
        return NextResponse.json(
          { error: "Invalid deletedImageIds format" },
          { status: 400 },
        );
      }
    }

    // ပုံအသစ်များအတွက် Validation စစ်ဆေးခြင်း
    if (imageValues.some((value) => !(value instanceof File))) {
      return NextResponse.json(
        { error: "Uploaded images are invalid" },
        { status: 400 },
      );
    }

    const imageFiles = imageValues.filter(
      (value): value is File => value instanceof File,
    );

    // ကျန်ရှိမည့် ပုံအရေအတွက်ကို တွက်ချက်ခြင်း (Existing - Deleted + New)
    const remainingImagesCount = existingPost.images.filter(
      (img) => !deletedImageIds.includes(img.id),
    ).length;

    if (remainingImagesCount + imageFiles.length > MAX_IMAGES_PER_POST) {
      return NextResponse.json(
        {
          error: `You can have up to ${MAX_IMAGES_PER_POST} images per post in total`,
        },
        { status: 400 },
      );
    }

    const content =
      typeof contentValue === "string"
        ? contentValue.trim()
        : existingPost.content;
    if (!content && remainingImagesCount === 0 && imageFiles.length === 0) {
      return NextResponse.json(
        { error: "Post content or at least one image is required" },
        { status: 400 },
      );
    }

    for (const image of imageFiles) {
      if (image.size === 0) {
        return NextResponse.json(
          { error: "An uploaded image is empty" },
          { status: 400 },
        );
      }
      if (!IMAGE_EXTENSIONS[image.type]) {
        return NextResponse.json(
          { error: "Images must be JPEG, PNG, WebP, or GIF files" },
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
    const savedImagePaths: string[] = [];

    try {
      await mkdir(uploadDirectory, { recursive: true });

      // 1. ပုံအသစ်များကို Server သို့ သိမ်းဆည်းရန် Prepare လုပ်ခြင်း
      const newImageCreateData = [];
      for (const image of imageFiles) {
        const filename = `${randomUUID()}${IMAGE_EXTENSIONS[image.type]}`;
        const imagePath = path.join(uploadDirectory, filename);
        const imageUrl = `/images/${filename}`;

        await writeFile(imagePath, Buffer.from(await image.arrayBuffer()), {
          flag: "wx",
        });
        savedImagePaths.push(imagePath);
        newImageCreateData.push({ url: imageUrl });
      }

      // 2. Database တွင် ပုံဟောင်းများကို ဖျက်ပြီး ပုံအသစ်များ ထည့်ခြင်းနှင့် Content update လုပ်ခြင်း
      if (deletedImageIds.length > 0) {
        const imagesToDelete = existingPost.images.filter((img) =>
          deletedImageIds.includes(img.id),
        );

        // Storage မှ ပုံဟောင်းဖိုင်များကို ဖျက်ခြင်း
        for (const img of imagesToDelete) {
          try {
            const relPath = img.url.startsWith("/")
              ? img.url.slice(1)
              : img.url;
            await rm(path.join(process.cwd(), "public", relPath), {
              force: true,
            });
          } catch {}
        }

        // DB မှ ဖျက်ခြင်း
        await prisma.postImage.deleteMany({
          where: { id: { in: deletedImageIds } },
        });
      }

      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          content,
          isPublic:
            visibilityValue !== null ? visibilityValue !== "false" : undefined,
          images: {
            create: newImageCreateData,
          },
        },
        include: {
          user: { select: { id: true, name: true, img: true } },
          images: { orderBy: { id: "asc" } },
          likes: true,
          comments: {
            include: {
              user: { select: { id: true, name: true, img: true } },
            },
          },
        },
      });

      return NextResponse.json(updatedPost, { status: 200 });
    } catch (error) {
      // Error ဖြစ်ပါက တင်ထားပြီးသား ပုံအသစ်များကို Rollback လုပ်ခြင်း (Clean up)
      await Promise.all(
        savedImagePaths.map((imagePath) =>
          rm(imagePath, { force: true }).catch(() => {}),
        ),
      );
      throw error;
    }
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}
