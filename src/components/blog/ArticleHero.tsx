import React from 'react';
import { ArrowDown } from 'lucide-react';

interface ArticleHeroProps {
  src: string | null | undefined;
  caption?: string | null;
  alt?: string;
}

export function ArticleHero({ src, caption, alt = '' }: ArticleHeroProps) {
  if (!src) return null;

  return (
    <figure>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] bg-gray-100 shadow-sm">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
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

