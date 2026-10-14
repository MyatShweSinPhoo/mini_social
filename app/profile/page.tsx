import ProfileCard from "../component/profile/ProfileCard";
import PostCard from "../component/postCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import Navbar from "../component/navBar/nav";

export const instant = false;

export default async function ProfilePage() {
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
      const decodedUserId = (decoded as any).userId;
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
      img: true,
      bio: true,
      posts: {
        orderBy: {
          create_at: "desc",
        },
        select: {
          id: true,
          userId: true,
          content: true,
          create_at: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="bg-slate-950 p-6 space-y-6 mx-50">
      <Navbar />

      {/* Profile Card Component */}
      <ProfileCard
        user={{
          name: user.name || "No Name",
          email: user.email,
          img: user.img,
          bio: user.bio,
        }}
      />

      {/* User's Posts Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center justify-between">
          <span>My Posts</span>
          <span className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
            {user.posts.length} {user.posts.length === 1 ? "Post" : "Posts"}
          </span>
        </h2>

        {user.posts.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-slate-400">You haven't posted anything yet.</p>
          </div>
        ) : (
          user.posts.map((post: any) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                content: post.content,
                create_at: post.create_at,
                userId: post.userId ?? user.id,
                likes: post.likes,
                comments: post.comments,
              }}
              user={{
                id: user.id, // 👈 Profile link ချိတ်ရန် id ထည့်ပေးပါ
                name: user.name,
                img: user.img,
              }}
              currentUserId={userId}
            />
          ))
        )}
      </div>
    </main>
  );
}
