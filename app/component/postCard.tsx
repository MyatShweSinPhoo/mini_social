"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProfileImageSrc } from "@/lib/profile-image";

interface PostCardProps {
  post: {
    id: number;
    content: string;
    images?: { id: number; url: string }[];
    isPublic?: boolean;
    create_at: Date | string;
    userId: number;
    likes?: { userId: number }[];
    comments?: any[];
  };
  user: {
    id?: number;
    name: string;
    img: string | null;
  };
  currentUserId: number | null;
}

export default function PostCard({ post, user, currentUserId }: PostCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const [existingImages, setExistingImages] = useState(post.images ?? []);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const initialLikes = post.likes ?? [];
  const initialComments = post.comments ?? [];

  const [liked, setLiked] = useState(
    initialLikes.some((like) => Number(like.userId) === Number(currentUserId)),
  );
  const [likeCount, setLikeCount] = useState(initialLikes.length);
  const [comments, setComments] = useState(initialComments);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    setLiked(
      initialLikes.some(
        (like) => Number(like.userId) === Number(currentUserId),
      ),
    );
    setLikeCount(initialLikes.length);
    setComments(initialComments);
    setExistingImages(post.images ?? []);
  }, [currentUserId, post.likes, post.comments, post.images]);

  const handleLikeToggle = async () => {
    if (!currentUserId) {
      alert("Please login to like posts");
      return;
    }

    try {
      const res = await fetch(`/api/post/${post.id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleCommentSubmit = async (
    e: React.FormEvent,
    parentId: number | null = null,
  ) => {
    e.preventDefault();
    if (!currentUserId) {
      alert("Please login to comment");
      return;
    }

    const contentText = parentId ? replyContent : newComment;
    if (!contentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/post/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentText, parentId }),
      });

      if (res.ok) {
        const commentData = await res.json();
        setComments([...comments, commentData]);
        if (parentId) {
          setReplyingToId(null);
          setReplyContent("");
        } else {
          setNewComment("");
        }
      }
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments(comments.filter((c: any) => c.id !== commentId));
      } else {
        alert("You can only delete your own comment");
      }
    } catch (error) {
      console.error("Delete comment error:", error);
    }
  };

  const handleRemoveExistingImage = (id: number) => {
    setExistingImages(existingImages.filter((img) => img.id !== id));
    setDeletedImageIds([...deletedImageIds, id]);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editContent.trim() &&
      existingImages.length === 0 &&
      newFiles.length === 0
    ) {
      alert("Post content or at least one image is required");
      return;
    }

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("content", editContent);
      formData.append("deletedImageIds", JSON.stringify(deletedImageIds));
      newFiles.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(`/api/post/${post.id}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        setIsEditing(false);
        setNewFiles([]);
        setDeletedImageIds([]);
        router.refresh();
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data: unknown = await res.json();
          const error =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
              ? data.error
              : "Failed to update post";
          alert(error);
        } else {
          alert(`Failed to update post (HTTP ${res.status})`);
        }
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/post/${post.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete post");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto bg-slate-100 border border-slate-300 rounded-2xl shadow-sm overflow-hidden transition mb-4 text-slate-800">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Link
            href={user.id ? `/profile/${user.id}` : "#"}
            className="shrink-0"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden">
              {user.img ? (
                <img
                  src={getProfileImageSrc(user.img)}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={user.id ? `/profile/${user.id}` : "#"}>
              <h3 className="text-sm font-semibold text-slate-900 truncate hover:underline">
                {user.name}
              </h3>
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">
                {post.create_at && !isNaN(new Date(post.create_at).getTime())
                  ? new Date(post.create_at).toLocaleDateString()
                  : ""}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {post.isPublic !== false ? "🌐 Public" : "🔒 Private"}
              </span>
            </div>
          </div>
        </div>

        {Number(currentUserId) === Number(post.userId) && (
          <div className="relative ml-2 shrink-0">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-slate-600 hover:text-slate-900 w-8 h-8 rounded-full hover:bg-slate-200 transition flex items-center justify-center font-bold text-lg"
            >
              ⋮
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-28 bg-slate-200 border border-slate-300 rounded-xl shadow-md z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-slate-300 transition"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-100 transition border-t border-slate-300"
                >
                  {isDeleting ? "Deleting..." : "🗑️ Delete"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content & Images / Edit Form */}
      <div className="px-4 py-3 space-y-3">
        {isEditing ? (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-slate-200 border border-slate-300 p-3 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              rows={3}
            />

            {/* Existing Images Management */}
            {existingImages.length > 0 && (
              <div>
                <p className="text-[11px] text-slate-600 mb-2">
                  Existing Images (Click × to remove):
                </p>
                <div className="flex gap-2 flex-wrap">
                  {existingImages.map((img) => {
                    const normalizedUrl = img.url
                      .replace(/\\/g, "/")
                      .replace(/^\/+/, "")
                      .replace(/^public\//, "");
                    const imageSrc = /^https?:\/\//i.test(img.url)
                      ? img.url
                      : `/${normalizedUrl.startsWith("images/") ? normalizedUrl : `images/${normalizedUrl}`}`;

                    return (
                      <div
                        key={img.id}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-200"
                      >
                        <Image
                          src={imageSrc}
                          alt="Post image"
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.id)}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow hover:bg-rose-700"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add New Images */}
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">
                Add New Images:
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setNewFiles(Array.from(e.target.files));
                  }
                }}
                className="text-xs text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(post.content);
                  setExistingImages(post.images ?? []);
                  setNewFiles([]);
                  setDeletedImageIds([]);
                }}
                className="bg-slate-300 hover:bg-slate-400 text-slate-800 px-3 py-1.5 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs transition disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <>
            {post.content && (
              <p className="text-slate-800 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            )}

            {/* Images Grid */}
            {post.images && post.images.length > 0 && (
              <div
                className={`grid gap-2 mt-3 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
              >
                {post.images.map((img, index) => {
                  const normalizedUrl = img.url
                    .replace(/\\/g, "/")
                    .replace(/^\/+/, "")
                    .replace(/^public\//, "");
                  const imageSrc = /^https?:\/\//i.test(img.url)
                    ? img.url
                    : `/${normalizedUrl.startsWith("images/") ? normalizedUrl : `images/${normalizedUrl}`}`;

                  return (
                    <div
                      key={img.id}
                      className="rounded-xl overflow-hidden border border-slate-300 bg-slate-200 relative h-48"
                    >
                      <Image
                        src={imageSrc}
                        alt={`Post image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 500px"
                        className="object-cover hover:scale-105 transition duration-300"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Footer */}
      <div className="px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600 bg-slate-200/50">
        <button
          onClick={handleLikeToggle}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-300/50 transition ${
            liked
              ? "text-indigo-600 font-bold bg-indigo-100"
              : "hover:text-indigo-600"
          }`}
        >
          <span>{liked ? "💜 Liked" : "👍 Like"}</span>
          {likeCount > 0 && <span>({likeCount})</span>}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="hover:text-indigo-600 transition px-3 py-1.5 rounded-lg hover:bg-slate-300/50"
        >
          💬 {comments.length} Comments
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-slate-200/60 p-4 border-t border-slate-300 space-y-3">
          {comments
            .filter((c: any) => !c.parentId)
            .map((comment: any) => (
              <div
                key={comment.id}
                className="bg-slate-100 border border-slate-300 p-3 rounded-2xl text-xs space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-700">
                    {comment.user?.name || "User"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500">
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>
                <p className="text-slate-800">{comment.content}</p>

                <button
                  onClick={() =>
                    setReplyingToId(
                      replyingToId === comment.id ? null : comment.id,
                    )
                  }
                  className="text-indigo-600 hover:underline text-[11px] font-medium"
                >
                  Reply
                </button>

                {comments
                  .filter((r: any) => r.parentId === comment.id)
                  .map((reply: any) => (
                    <div
                      key={reply.id}
                      className="ml-4 mt-2 bg-slate-200 border border-slate-300 p-2.5 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-700">
                          {reply.user?.name || "User"}
                        </span>
                        {Number(reply.userId) === Number(currentUserId) && (
                          <button
                            onClick={() => handleDeleteComment(reply.id)}
                            className="text-rose-600 hover:underline text-[10px]"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-slate-800">{reply.content}</p>
                    </div>
                  ))}

                {(Number(comment.userId) === Number(currentUserId) ||
                  Number(currentUserId) === Number(post.userId)) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-rose-600 hover:underline text-[10px] ml-2"
                  >
                    Delete
                  </button>
                )}

                {replyingToId === comment.id && (
                  <form
                    onSubmit={(e) => handleCommentSubmit(e, comment.id)}
                    className="flex gap-2 mt-2"
                  >
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="flex-1 bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium"
                    >
                      Send
                    </button>
                  </form>
                )}
              </div>
            ))}

          {currentUserId ? (
            <form
              onSubmit={(e) => handleCommentSubmit(e, null)}
              className="flex gap-2 mt-3"
            >
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-slate-100 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-2xs"
              >
                Send
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-1">
              Please login to write a comment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
