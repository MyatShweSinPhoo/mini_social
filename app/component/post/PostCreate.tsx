"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePostForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setHasError(false);

    try {
      const trimmedContent = content.trim();
      if (!trimmedContent && images.length === 0) {
        throw new Error("Post content or image is required");
      }

      const formData = new FormData();
      formData.append("content", trimmedContent);
      formData.append("isPublic", String(isPublic));

      images.forEach((image) => {
        formData.append("images", image);
      });

      const res = await fetch("/api/post", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessage("Post created successfully!");
      setContent("");
      setImages([]);
      setIsPublic(true);
      router.refresh();
    } catch (err: unknown) {
      setHasError(true);
      setMessage(err instanceof Error ? err.message : "Could not create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-4 bg-slate-900 border border-slate-800 shadow-xl rounded-xl space-y-4 text-white mb-6"
    >
      {message && (
        <p
          className={`text-sm text-center ${hasError ? "text-red-400" : "text-blue-400"}`}
        >
          {message}
        </p>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition"
        rows={4}
      />

      {/* Public / Private Selection */}
      <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
        <span className="text-xs text-slate-400">Post Visibility:</span>
        <select
          value={isPublic ? "public" : "private"}
          onChange={(e) => setIsPublic(e.target.value === "public")}
          className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 focus:outline-none"
        >
          <option value="public">🌐 Public</option>
          <option value="private">🔒 Private</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Upload Images (Multiple allowed)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              setImages(Array.from(e.target.files));
            }
          }}
          className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 text-sm shadow-md"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}
