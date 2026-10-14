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
      id: true,
      posts: {
        orderBy: {
          create_at: "desc",
        },
        select: {
          id: true,
          userId: true,
          content: true,
          create_at: true,
          isPublic: true,
          images: {
            orderBy: { id: "asc" },
          },
          likes: { select: { userId: true } },
          comments: {
            orderBy: { create_at: "asc" },
            select: {
              id: true,
              content: true,
              create_at: true,
              user: { select: { name: true, img: true } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="w-full min-h-screen bg-white text-black pb-12">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
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
          <h2 className="text-xl font-bold text-black flex items-center justify-between">
            <span>My Posts</span>
            <span className="text-sm bg-white text-black px-3 py-1 rounded-full border border-gray-300">
              {user.posts.length} {user.posts.length === 1 ? "Post" : "Posts"}
            </span>
          </h2>

          {user.posts.length === 0 ? (
            <div className="w-full bg-white border border-gray-300 p-6 rounded-2xl text-center shadow-md mt-6">
              <p className="text-slate-400 text-sm">
                You haven't posted anything yet.
              </p>
            </div>
          ) : (
            user.posts.map((post: any) => (
              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  content: post.content,
                  create_at: post.create_at,
                  userId: post.userId,
                  isPublic: post.isPublic,
                  images: post.images,
                  likes: post.likes,
                  comments: post.comments,
                }}
                user={{
                  id: user.id,
                  name: user.name || "User",
                  img: user.img,
                }}
                currentUserId={userId}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
