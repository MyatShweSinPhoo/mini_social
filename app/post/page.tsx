import CreatePostForm from "../component/post/PostCreate";

export default function CreatePostPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-black">
          Community Feed
        </h1>
        <CreatePostForm />
      </div>
    </main>
  );
}
