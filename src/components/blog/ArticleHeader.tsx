import React from 'react';
import { Facebook, Twitter, Mail, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ArticleHeaderProps {
  label: string;
  date: string | null;
  title: string;
}

export function ArticleHeader({ label, date, title }: ArticleHeaderProps) {
  const formattedDate = date
    ? format(new Date(date), 'd. MMMM yyyy', { locale: de })
    : '';

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = title;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'mail':
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
      case 'link':
        navigator.clipboard.writeText(url);
        break;
    }
  };

  return (
    <header className="flex flex-col gap-6">
      {/* Meta Row */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
          {label}
        </span>
        {formattedDate && (
          <time className="text-gray-500 font-medium">{formattedDate}</time>
        )}
      </div>

      {/* Huge Title */}
      <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] font-bold text-gray-900 tracking-tight">
        {title}
      </h1>

      {/* Social Toolbar (Apple Style: Minimalist icons) */}
      <div className="flex items-center gap-6 mt-2">
        <button
          onClick={() => handleShare('facebook')}
          className="text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Auf Facebook teilen"
        >
          <Facebook size={18} />
        </button>
        <button
          onClick={() => handleShare('twitter')}
          className="text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Auf Twitter teilen"
        >
          <Twitter size={18} />
        </button>
        <button
          onClick={() => handleShare('mail')}
          className="text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Per E-Mail teilen"
        >
          <Mail size={18} />
        </button>
        <button
          onClick={() => handleShare('link')}
          className="text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Link kopieren"
        >
          <LinkIcon size={18} />
        </button>
      </div>
    </header>
  );
}

