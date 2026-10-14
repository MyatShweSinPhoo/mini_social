import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
