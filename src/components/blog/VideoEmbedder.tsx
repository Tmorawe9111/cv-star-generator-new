import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Video, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoEmbedderProps {
  videoUrl?: string;
  embedCode?: string;
  onVideoUrlChange: (url: string) => void;
  onEmbedCodeChange: (code: string) => void;
  className?: string;
}

export function VideoEmbedder({ videoUrl, embedCode, onVideoUrlChange, onEmbedCodeChange, className }: VideoEmbedderProps) {
  const extractVideoId = (url: string): string | null => {
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) return youtubeMatch[1];

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) return vimeoMatch[1];

    return null;
  };

  const getEmbedUrl = (url: string): string | null => {
    const videoId = extractVideoId(url);
    if (!videoId) return null;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return null;
  };

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label>Video URL (YouTube, Vimeo)</Label>
        <div className="flex gap-2">
          <Input
            value={videoUrl || ''}
            onChange={(e) => onVideoUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1"
          />
          {videoUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onVideoUrlChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {embedUrl && (
          <div className="mt-4 aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>

      <div>
        <Label>Oder Embed-Code direkt einfügen</Label>
        <Textarea
          value={embedCode || ''}
          onChange={(e) => onEmbedCodeChange(e.target.value)}
          placeholder='<iframe src="..." ...></iframe>'
          rows={4}
          className="font-mono text-sm"
        />
        {embedCode && (
          <div className="mt-4 rounded-lg overflow-hidden bg-muted p-4">
            <div dangerouslySetInnerHTML={{ __html: embedCode }} />
          </div>
        )}
      </div>
    </div>
  );
}

