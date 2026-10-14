"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfileImageSrc } from "@/lib/profile-image";

interface UserProps {
  user: {
    name: string;
    email: string;
    bio: string | null;
    img: string | null;
  };
}

export default function ProfileEditForm({ user }: UserProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");

  // Database ကလာတဲ့ Path ကို Preview ပြရန် (ဥပမာ: /profile/1-abc.jpg)
  const [imagePreview, setImagePreview] = useState(
    user.img ? getProfileImageSrc(user.img) : "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null); // ပုံဖိုင်အစစ်

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imagePreview.startsWith("blob:")) {
      return;
    }

    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setHasError(false);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);

      if (imageFile) {
        formData.append("img", imageFile);
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(
          `Profile update failed (${res.status}): server returned an unexpected response`,
        );
      }

      const data = (await res.json()) as {
        error?: string;
        user?: { img: string | null };
      };

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setImageFile(null);
      setImagePreview(data.user?.img ? getProfileImageSrc(data.user.img) : "");
      setMessage("Profile updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      setHasError(true);
      setMessage(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex justify-center mb-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-black my-5"
      >
        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

        {message && (
          <p
            className={`mb-4 text-sm ${
              hasError ? "text-red-400" : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-indigo-500 mb-3 flex items-center justify-center">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-slate-400 text-xs">No Image</span>
            )}
          </div>

          <label className="cursor-pointer bg-white hover:bg-gray-300 text-sm py-2 px-4 rounded border border-gray-300 transition">
            Choose New Image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-2">
            Email (Cannot be changed)
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full p-2 rounded bg-white text-slate-400 cursor-not-allowed border border-gray-400 shadow-2xs"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-white border border-gray-300 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-2 rounded bg-white border border-gray-300 focus:outline-none focus:border-indigo-500"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition p-2 rounded font-semibold text-white"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
