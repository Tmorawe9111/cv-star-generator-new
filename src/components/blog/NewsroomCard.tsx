import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

// Optimierte Bildkomponente mit Lazy Loading und Error Handling
function BlogImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Optimiere Supabase Storage URLs für bessere Performance
  const optimizedSrc = src?.includes('supabase.co/storage') 
    ? `${src}?width=1200&quality=80` 
    : src;

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      {error ? (
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-gray-400 text-xs">Bild konnte nicht geladen werden</span>
        </div>
      ) : (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`${className || ''} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
}

interface NewsroomCardProps {
  article: {
    id: string;
    slug: string;
    title: string;
    excerpt?: string | null;
    featured_image?: string | null;
    category?: string | null;
    published_at?: string | null;
    industry_sector?: string | null;
  };
  variant?: 'hero' | 'standard' | 'compact';
}

export function NewsroomCard({ article, variant = 'standard' }: NewsroomCardProps) {
  const isHero = variant === 'hero';
  const date = article.published_at 
    ? format(new Date(article.published_at), 'd. MMMM yyyy', { locale: de })
    : '';

  const getCategoryLabel = () => {
    if (article.category) return article.category.toUpperCase();
    if (article.industry_sector) {
      const labels: Record<string, string> = {
        pflege: 'PFLEGE',
        handwerk: 'HANDWERK',
        industrie: 'INDUSTRIE',
      };
      return labels[article.industry_sector] || '';
    }
    return 'KARRIERE';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`group flex flex-col ${isHero ? 'md:grid md:grid-cols-12 md:gap-12 items-center' : ''}`}
    >
      {/* IMAGE CONTAINER - Apple Style: Full Bleed, rounded-2xl */}
      <Link
        to={`/blog/${article.slug}`}
        className={`relative overflow-hidden rounded-[20px] bg-gray-100 ${
          isHero ? 'md:col-span-8 w-full aspect-[16/9]' : 'aspect-[3/2] w-full'
        }`}
      >
        {article.featured_image ? (
          <BlogImage
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Kein Bild</span>
          </div>
        )}
      </Link>

      {/* TEXT CONTAINER - Apple Style: Viel Whitespace, klare Hierarchie */}
      <div className={`mt-6 ${isHero ? 'md:col-span-4 md:mt-0' : ''}`}>
        {/* Category Label - Apple "Eyebrow" Style */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            {getCategoryLabel()}
          </span>
        </div>

        {/* Title */}
        <Link to={`/blog/${article.slug}`}>
          <h3
            className={`font-bold leading-tight text-gray-900 group-hover:text-gray-600 transition-colors ${
              isHero
                ? 'text-3xl md:text-5xl lg:text-5xl mb-4'
                : 'text-xl md:text-2xl mb-2'
            }`}
          >
            {article.title}
          </h3>
        </Link>

        {/* Excerpt (Nur bei Hero oder Standard) */}
        {(isHero || variant === 'standard') && article.excerpt && (
          <p className="text-gray-500 font-medium leading-relaxed mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {/* Date - Apple Style */}
        {date && (
          <time className="text-sm font-semibold text-gray-400">{date}</time>
        )}
      </div>
    </motion.div>
  );
}

