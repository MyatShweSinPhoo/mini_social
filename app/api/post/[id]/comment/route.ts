import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const postId = Number(id);

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string | number;
    };
    const currentUserId = Number(decoded.userId);

    const { content, parentId } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: currentUserId,
        parentId: parentId ? Number(parentId) : null,
      },
      include: {
        user: { select: { id: true, name: true, img: true } },
      },
    });

    return NextResponse.json(comment, { status: 200 });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
