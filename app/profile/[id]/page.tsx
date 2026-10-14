import PostCard from "../../component/postCard";
import ProfileCard from "../../component/profile/ProfileCard";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import jwt from "jsonwebtoken";
import Navbar from "@/app/component/navBar/nav";
export const instant = false;
interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  await connection();
  const resolvedParams = await params;
  const targetUserId = Number(resolvedParams.id);

  if (isNaN(targetUserId)) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: number = 0;

  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        userId: number;
      };
      currentUserId = Number(decoded.userId);
    } catch {
      // Token invalid ignore
    }
  }

  const profileUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      img: true,
      bio: true,
      posts: {
        orderBy: { create_at: "desc" },
        select: {
          id: true,
          content: true,
          create_at: true,
          userId: true,
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

  if (!profileUser) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p>User not found.</p>
      </main>
    );
  }

  return (
    <main className="bg-slate-950 p-6 space-y-6 mx-50">
      <Navbar />
      <ProfileCard
        user={{
          name: profileUser.name || "No Name",
          email: profileUser.email,
          img: profileUser.img,
          bio: profileUser.bio,
        }}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center justify-between">
          <span>{profileUser.name}&apos;s Posts</span>
          <span className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
            {profileUser.posts.length}{" "}
            {profileUser.posts.length === 1 ? "Post" : "Posts"}
          </span>
        </h2>

        {profileUser.posts.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-slate-400">
              This user hasn&apos;t posted anything yet.
            </p>
          </div>
        ) : (
          profileUser.posts.map((post: any) => (
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
                name: profileUser.name || "User",
                img: profileUser.img,
              }}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </main>
  );
}
