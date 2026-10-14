import Link from "next/link";
import Image from "next/image";

interface UserProfile {
  name: string;
  email: string;
  img: string | null;
  bio: string | null;
}

export default function ProfileCard({ user }: { user: UserProfile }) {
  const getImageUrl = (img: string | null) => {
    if (!img) return "/public/profile/profile.jpg";
    // if (img.startsWith("http://") || img.startsWith("https://")) return img;

    const cleanImg = img.replace(/^profile\//, "").replace(/^\/+/, "");
    return `/profile/${cleanImg}`;
  };

  const imageSrc = getImageUrl(user.img);

  return (
    <div className="max-w-md mx-auto bg-gray p-6 rounded-xl shadow-md  mt-10">
      <div className="flex justify-center mb-4">
        <Image
          src={imageSrc}
          width={160}
          height={160}
          className="size-40 rounded-full object-cover border-2 border-slate-700"
          alt={`${user.name}'s profile picture`}
          unoptimized
        />
      </div>
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
        <div className="pt-4 border-t border-slate-700">
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
