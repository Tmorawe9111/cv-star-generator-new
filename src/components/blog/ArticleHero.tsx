import React, { useState } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';

interface ArticleHeroProps {
  src: string | null | undefined;
  caption?: string | null;
  alt?: string;
}

export function ArticleHero({ src, caption, alt = '' }: ArticleHeroProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!src) return null;

  // Optimiere Supabase Storage URLs für bessere Performance
  const optimizedSrc = src?.includes('supabase.co/storage') 
    ? `${src}?width=1600&quality=85` 
    : src;

  return (
    <figure>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] bg-gray-100 shadow-sm">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
        {error ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Bild konnte nicht geladen werden</span>
          </div>
        ) : (
          <img
            src={optimizedSrc}
            alt={alt}
            className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </div>
      {/* Caption Row with Arrow - Apple Style */}
      {caption && (
        <figcaption className="mt-4 flex items-start justify-between text-sm text-gray-500 border-b border-gray-100 pb-4">
          <span>{caption}</span>
          <div className="p-1 bg-gray-100 rounded-full">
            <ArrowDown size={14} className="text-gray-500" />
          </div>
        </figcaption>
      )}
    </figure>
  );
}

