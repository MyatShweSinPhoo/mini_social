import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface RouteParams {
  params: Promise<{ commentId: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { commentId } = await params;
    const id = Number(commentId);

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string | number;
    };
    const currentUserId = Number(decoded.userId);

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Comment ပိုင်ရှင် (Owner) သာလျှင် ဖျက်ခွင့်ရှိသည်
    // if (Number(comment.userId) !== currentUserId) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    await prisma.comment.delete({ where: { id } });
    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
