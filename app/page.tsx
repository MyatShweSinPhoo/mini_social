import PostCard from "./component/postCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import Navbar from "./component/navBar/nav";
import CreatePostForm from "./component/post/PostCreate";
export const instant = false;

export default async function HomePage() {
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
    if (typeof decoded !== "string" && "userId" in decoded) {
      const decodedUserId: unknown = decoded.userId;
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

  const currentUserId = userId;

  const otherPosts = await prisma.post.findMany({
    where: {
      userId: {
        not: userId,
      },
      isPublic: true, // 👈 အခြားသူများ၏ Public post များကိုသာ ပြရန် (Private များကို မပြရန်)
    },
    orderBy: {
      create_at: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          img: true,
        },
      },
      images: true, // 👈 ဒီနေရာတွင် images ကို ဖြည့်စွက်ပေးပါ (ပုံများပေါ်လာရန်)
      likes: true,
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              img: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="bg-slate-950 p-6 space-y-6 mx-50">
      <Navbar />
      <CreatePostForm />
      <div className="space-y-4">
        {otherPosts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <p className="text-slate-300 font-medium">No posts available</p>
            <p className="text-slate-500 text-sm">
              When other users create posts, they will appear here.
            </p>
          </div>
        ) : (
          otherPosts.map((post: any) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                content: post.content,
                create_at: post.create_at,
                userId: post.userId,
                likes: post.likes,
                comments: post.comments,
              }}
              user={{
                id: post.user.id, // 👈 id ကို ပေးပို့လိုက်ခြင်းဖြင့် TypeScript Error ရှင်းသွားပါမည်
                name: post.user.name || "User",
                img: post.user.img,
              }}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </main>
  );
}
