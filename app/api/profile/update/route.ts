import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string | number;
    };
    const userId =
      typeof decoded.userId === "string"
        ? parseInt(decoded.userId)
        : decoded.userId;

    // FormData ကို လက်ခံခြင်း
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const file = formData.get("img") as File | null;

    let imagePath = undefined;

    // ပုံအသစ် တင်လာမှသာ Folder ထဲ သိမ်းမည်
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Unique ဖြစ်မယ့် ပုံနာမည် ဖန်တီးခြင်း
      const filename = `${userId}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public", "profile");

      // public/profile ဖိုင်တွဲ မရှိသေးရင် အလိုအလျောက် ဆောက်ပေးမည်
      await mkdir(uploadDir, { recursive: true });

      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);

      imagePath = `${filename}`; // Database ထဲ သိမ်းမည့် Path
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(imagePath !== undefined && { img: imagePath }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        img: true,
      },
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: updatedUser,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Update profile error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
