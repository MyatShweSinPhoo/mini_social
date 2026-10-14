import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import Navbar from "@/app/component/navBar/nav";
import ProfileEditForm from "../../component/profile/ProfileEdit";
export const instant = false;
export default async function EditProfilePage() {
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  let userId: number | undefined;
  try {
    const decoded = jwt.verify(token, secretKey);
    if (typeof decoded !== "string") {
      const decodedUserId = decoded.userId;
      if (typeof decodedUserId === "number") {
        userId = decodedUserId;
      } else if (
        typeof decodedUserId === "string" &&
        /^\d+$/.test(decodedUserId)
      ) {
        userId = Number(decodedUserId);
      }
    }
  } catch {
    redirect("/auth/login");
  }

  if (userId === undefined || !Number.isSafeInteger(userId) || userId <= 0) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      bio: true,
      img: true,
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="w-full min-h-screen bg-slate-50 text-slate-900 pb-12">
      <Navbar />
      <ProfileEditForm user={user} />
    </main>
  );
}
