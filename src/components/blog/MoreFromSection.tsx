import React from 'react';
import { Link } from 'react-router-dom';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function MoreFromSection() {
  const { data: posts } = useBlogPosts({ limit: 3 });

  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-24 border-t border-gray-100 pt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Weitere Artikel</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="group"
          >
            {post.featured_image && (
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-gray-100 mb-4">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-600 transition-colors mb-2">
              {post.title}
            </h3>
            {post.published_at && (
              <time className="text-sm text-gray-400">
                {format(new Date(post.published_at), 'd. MMMM yyyy', { locale: de })}
              </time>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

