import Link from "next/link";
import Image from "next/image";
interface UserProfile {
  name: string;
  email: string;
  img: string | null;
  bio: string | null;
}

export default function ProfileCard({ user }: { user: UserProfile }) {
  const imageSrc = user.img
    ? user.img.startsWith("/")
      ? user.img
      : `/profile/${user.img}`
    : "/profile/profile.jpg";

  return (
    <div className="max-w-md mx-auto bg-slate-800 p-6 rounded-xl shadow-md text-white mt-10">
      <Image
        src={imageSrc}
        width={160}
        height={160}
        className="mb-4 size-40 rounded-full object-cover"
        alt={`${user.name}'s profile picture`}
      />
      <div className="space-y-3">
        <p>
          <strong>Name:</strong> {user.name || "No name set"}
        </p>
        <p>
          <strong>Email:</strong> {user.email || "-"}
        </p>
        <p>
          <strong>Bio:</strong> {user.bio || "-"}
        </p>
        <div className="pt-4 border-t border-slate-800">
          <Link
            href="/profile/edit"
            className="inline-block text-indigo-400 hover:text-indigo-300 font-medium text-sm transition"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
