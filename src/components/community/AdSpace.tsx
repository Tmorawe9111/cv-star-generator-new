import React from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  badge?: string; // e.g., "Sponsored", "Anzeige", "Neu"
  category?: string;
}

interface AdSpaceProps {
  links?: AdLink[];
  title?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
  position?: 'left' | 'right';
}

/**
 * Flexible Ad Space Component
 * Displays advertisements and links in the community feed
 */
export const AdSpace: React.FC<AdSpaceProps> = ({
  links = [],
  title = 'Werbung',
  className,
  variant = 'default',
  position = 'right'
}) => {
  // Default links if none provided (can be replaced with API call)
  const defaultLinks: AdLink[] = [
    {
      id: '1',
      title: 'Premium Mitgliedschaft',
      url: '/premium',
      description: 'Erhalte Zugang zu exklusiven Features',
      badge: 'Anzeige',
      category: 'Membership'
    },
    {
      id: '2',
      title: 'Karriere-Webinar',
      url: '/webinar',
      description: 'Lerne von Experten',
      badge: 'Neu',
      category: 'Event'
    },
    {
      id: '3',
      title: 'Job-Alerts aktivieren',
      url: '/jobs/alerts',
      description: 'Verpasse keine neuen Stellen',
      badge: 'Sponsored',
      category: 'Feature'
    }
  ];

  const displayLinks = links.length > 0 ? links : defaultLinks;

  if (displayLinks.length === 0) {
    return null;
  }

  return (
    <div className={cn('w-full', className)}>
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-border/50">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>

        {/* Links List */}
        <div className="space-y-3">
          {displayLinks.map((link, index) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'block group transition-all duration-200',
                variant === 'compact' ? 'p-2' : 'p-3',
                'rounded-lg border border-border/50 bg-background/50',
                'hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Image or Icon */}
                {link.imageUrl ? (
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={link.imageUrl}
                      alt={link.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {link.title}
                    </h4>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                  
                  {link.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {link.description}
                    </p>
                  )}

                  {/* Badge and Category */}
                  <div className="flex items-center gap-2 mt-2">
                    {link.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {link.badge}
                      </span>
                    )}
                    {link.category && (
                      <span className="text-[10px] text-muted-foreground">
                        {link.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground text-center">
            Werbung • Externe Links
          </p>
        </div>
      </Card>
    </div>
  );
};

/**
 * Horizontal Ad Banner Component
 * For displaying ads between feed posts
 */
interface AdBannerProps {
  link: AdLink;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ link, className }) => {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block group transition-all duration-200',
        'rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 to-accent/5',
        'hover:border-primary/50 hover:shadow-md',
        className
      )}
    >
      <div className="p-4 flex items-center gap-4">
        {link.imageUrl && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
            <img
              src={link.imageUrl}
              alt={link.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {link.title}
            </h4>
            {link.badge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {link.badge}
              </span>
            )}
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
          </div>
          
          {link.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {link.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
};

