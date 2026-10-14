import PostCard from "./component/postCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import Navbar from "./component/navBar/nav";
import CreatePostForm from "./component/post/PostCreate";

export const instant = false;

interface HomePageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

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
      isPublic: true,
      ...(query.trim()
        ? {
            OR: [
              { content: { contains: query } },
              { user: { name: { contains: query } } },
            ],
          }
        : {}),
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
      images: {
        orderBy: { id: "asc" },
      },
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
    <main className="w-full min-h-screen bg-slate-50 text-slate-900 pb-12">
      <Navbar />

      {/* အလယ်ခေါင်တွင် max-w-xl ဖြင့် ပို့စ်တင်ရန်နှင့် ဖိဒ်များ အချိုးကျပေါ်စေရန် */}
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        <CreatePostForm />

        {query.trim() && (
          <p className="text-xs text-slate-500 px-2">
            Search results for:{" "}
            <span className="text-slate-900 font-semibold">
              &quot;{query}&quot;
            </span>{" "}
            ({otherPosts.length} found)
          </p>
        )}

        <div className="space-y-4">
          {otherPosts.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <p className="text-slate-700 font-medium">No posts available</p>
              <p className="text-slate-400 text-sm">
                {query.trim()
                  ? "No posts match your search query."
                  : "When other users create posts, they will appear here."}
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
                  isPublic: post.isPublic,
                  images: post.images,
                  likes: post.likes,
                  comments: post.comments,
                }}
                user={{
                  id: post.user.id,
                  name: post.user.name || "User",
                  img: post.user.img,
                }}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
