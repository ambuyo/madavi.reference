import { usePosts } from "../hooks/usePosts";
import type { Post } from "../lib/sanity/types";

export function BlogPostsList() {
  const { posts, loading, error } = usePosts();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Loading blog posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading posts: {error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No blog posts available</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {posts.map((post: Post) => (
        <article key={post.slug} className="border-b pb-6 last:border-0">
          <a href={`/blog/${post.slug}`} className="group">
            <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600">
              {post.data.title}
            </h2>
          </a>
          {post.data.image?.url && (
            <img
              src={typeof post.data.image.url === "string" ? post.data.image.url : post.data.image.url.src}
              alt={post.data.image.alt || post.data.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          )}
          <p className="text-gray-600 mb-2">{post.data.description}</p>
          <time className="text-sm text-gray-500">
            {new Date(post.data.pubDate).toLocaleDateString()}
          </time>
        </article>
      ))}
    </div>
  );
}
