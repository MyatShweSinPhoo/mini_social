"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PostCardProps {
  post: {
    id: number;
    content: string;
    images?: { id: number; url: string }[];
    isPublic?: boolean;
    create_at: Date;
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
  }, [currentUserId, post.likes, post.comments]);

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

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/post/delete/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("Failed to update post");
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
      const res = await fetch(`/api/post/delete/${post.id}`, {
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

  const imageList = post.images ?? [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden transition mb-4">
      {/* Post Header */}
      {post.images && post.images.length > 0 && <p>exist</p>}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Link
            href={user.id ? `/profile/${user.id}` : "#"}
            className="shrink-0"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow overflow-hidden">
              {user.img ? (
                <img
                  src={user.img}
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
              <h3 className="text-sm font-semibold text-slate-100 truncate hover:underline">
                {user.name}
              </h3>
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">
                {post.create_at && !isNaN(new Date(post.create_at).getTime())
                  ? new Date(post.create_at).toLocaleDateString()
                  : ""}
              </span>
              <span className="text-[10px] text-slate-500">
                {post.isPublic !== false ? "🌐 Public" : "🔒 Private"}
              </span>
            </div>
          </div>
        </div>

        {Number(currentUserId) === Number(post.userId) && (
          <div className="relative ml-2 shrink-0">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-slate-400 hover:text-white w-8 h-8 rounded-full hover:bg-slate-800 transition flex items-center justify-center font-bold text-lg"
            >
              ⋮
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-28 bg-slate-950 border border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 transition"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-800 transition border-t border-slate-800"
                >
                  {isDeleting ? "Deleting..." : "🗑️ Delete"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content & Images */}
      <div className="px-4 py-3 space-y-3">
        {isEditing ? (
          <form onSubmit={handleUpdateSubmit} className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-sm text-white focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <>
            {post.content && (
              <p className="text-slate-200 text-sm md:text-base whitespace-pre-wrap">
                {post.content}
              </p>
            )}

            {/* Images Grid */}
            {imageList && imageList.length > 0 && (
              <div
                className={`grid gap-2 mt-3 ${imageList.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
              >
                {imageList.map((img: any, index: number) => (
                  <div
                    key={img.id || index}
                    className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950"
                  >
                    <img
                      src={`/images/${img.url}`}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-48 object-cover hover:scale-105 transition duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Footer */}
      <div className="px-4 py-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 bg-slate-950/40">
        <button
          onClick={handleLikeToggle}
          className={`flex items-center space-x-1.5 ${liked ? "text-blue-400 font-bold" : ""}`}
        >
          <span>{liked ? "💙 Liked" : "👍 Like"}</span>
          {likeCount > 0 && <span>({likeCount})</span>}
        </button>
        <button onClick={() => setShowComments(!showComments)}>
          💬 {comments.length} Comments
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-3">
          {comments
            .filter((c: any) => !c.parentId)
            .map((comment: any) => (
              <div
                key={comment.id}
                className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-400">
                    {comment.user?.name || "User"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500">
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                    {Number(comment.userId) === Number(currentUserId) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-300">{comment.content}</p>

                <button
                  onClick={() =>
                    setReplyingToId(
                      replyingToId === comment.id ? null : comment.id,
                    )
                  }
                  className="text-blue-400 hover:underline text-[11px]"
                >
                  Reply
                </button>

                {comments
                  .filter((r: any) => r.parentId === comment.id)
                  .map((reply: any) => (
                    <div
                      key={reply.id}
                      className="ml-4 mt-2 bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-300">
                          {reply.user?.name || "User"}
                        </span>
                        {Number(reply.userId) === Number(currentUserId) && (
                          <button
                            onClick={() => handleDeleteComment(reply.id)}
                            className="text-red-400 text-[10px]"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-slate-300">{reply.content}</p>
                    </div>
                  ))}

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
                      className="flex-1 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
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
                className="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs"
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
