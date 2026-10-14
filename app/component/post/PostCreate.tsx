"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_IMAGES_PER_POST = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export default function CreatePostForm() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false); // 👈 အစပိုင်းတွင် ပုံစံအသေး (Collapsed) ဖြင့် ပြရန်
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(
    () => () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    },
    [imagePreviews],
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImages = Array.from(e.currentTarget.files ?? []);
    if (selectedImages.length + images.length > MAX_IMAGES_PER_POST) {
      setHasError(true);
      setMessage(`You can upload up to ${MAX_IMAGES_PER_POST} images per post`);
      e.currentTarget.value = "";
      return;
    }

    const invalidImage = selectedImages.find(
      (image) =>
        !ALLOWED_IMAGE_TYPES.has(image.type) || image.size > MAX_IMAGE_SIZE,
    );
    if (invalidImage) {
      setHasError(true);
      setMessage(
        "Choose JPEG, PNG, WebP, or GIF images that are 5 MB or smaller",
      );
      e.currentTarget.value = "";
      return;
    }

    setHasError(false);
    setMessage("");

    const updatedImages = [...images, ...selectedImages];
    const updatedPreviews = [
      ...imagePreviews,
      ...selectedImages.map((image) => URL.createObjectURL(image)),
    ];

    setImages(updatedImages);
    setImagePreviews(updatedPreviews);
    e.currentTarget.value = "";
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

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

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(
          `Could not create post (${res.status}): the server returned an unexpected response`,
        );
      }

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessage("Post created successfully!");
      setContent("");
      setImages([]);
      setImagePreviews([]);
      setIsPublic(true);
      setIsExpanded(false); // တင်ပြီးပါက ပုံစံအသေးသို့ ပြန်သွားမည်
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
      className="max-w-xl mx-auto p-4 bg-gray border border-gray-300 shadow-xl rounded-2xl space-y-3 text-black mb-6"
    >
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-3 bg-white border border-gray-300 rounded-xl px-4 py-3 cursor-pointer transition"
        >
          <span className="text-slate-400 text-sm">What's on your mind?</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-300 pb-2.5">
            <h3 className="font-semibold text-xs text-black">Create Post</h3>
            <div className="flex items-center space-x-2">
              <select
                value={isPublic ? "public" : "private"}
                onChange={(e) => setIsPublic(e.target.value === "public")}
                className="bg-gray border border-gray-300 text-[11px] text-black rounded-lg px-2 py-1 focus:outline-none hover:bg-slate-300 transition cursor-pointer"
              >
                <option value="public">🌐 Public</option>
                <option value="private">🔒 Private</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setContent("");
                  setImages([]);
                  setImagePreviews([]);
                }}
                className="text-black hover:text-white text-xs px-1.5 py-0.5 rounded bg-gray"
              >
                ✕
              </button>
            </div>
          </div>

          {message && (
            <p
              className={`text-medium text-center py-3 rounded-lg ${
                hasError
                  ? "bg-red-950/50 text-red-400"
                  : "bg-gray-200 text-blue-400"
              }`}
            >
              {message}
            </p>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-black placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
            autoFocus
          />

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {imagePreviews.map((preview, index) => (
                <div
                  key={preview}
                  className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-28"
                >
                  <img
                    src={preview}
                    alt={`Upload preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1.5 right-1.5 bg-gray-900/80 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold transition shadow"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="text-center">
            <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-400 text-black px-2.5 py-3 rounded-lg text-[11px] font-medium transition text-center">
              <span>📷 Photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={
                  imagePreviews.length < MAX_IMAGES_PER_POST
                    ? handleImageChange
                    : undefined
                }
                className="hidden"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading || (!content.trim() && images.length === 0)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed text-xs shadow-md"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      )}
    </form>
  );
}
