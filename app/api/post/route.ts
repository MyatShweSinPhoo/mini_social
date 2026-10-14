import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string | number;
    };
    const currentUserId = Number(decoded.userId);

    const formData = await req.formData();
    const content = (formData.get("content") as string) || "";
    const isPublicValue = formData.get("isPublic") === "false" ? false : true;
    const imageFiles = formData.getAll("images") as File[];

    const savedImageNames: string[] = [];

    const uploadDir = path.join(process.cwd(), "public", "images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of imageFiles) {
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = uniqueSuffix + "-" + file.name.replace(/\s+/g, "_");
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);
        savedImageNames.push(filename);
      }
    }

    const imageCreateData = savedImageNames.map((filename) => ({
      url: filename,
    }));

    const newPost = await prisma.post.create({
      data: {
        content,
        isPublic: isPublicValue,
        userId: currentUserId,
        images: {
          create: imageCreateData, // 👈 Relational table ထဲသို့ ပုံများထည့်သွင်းခြင်း
        },
      },
      include: {
        user: { select: { id: true, name: true, img: true } },
        images: true,
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
