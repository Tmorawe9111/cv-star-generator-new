import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Calendar, FileText, ChartBar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { openPostComposer } from "@/lib/event-bus";

export const ComposerTeaser: React.FC = () => {
  const { profile } = useAuth();

  return (
    <Card
      role="button"
      aria-label="Neuen Beitrag erstellen"
      onClick={openPostComposer}
      className="p-2 w-full hover-scale cursor-pointer rounded-none md:rounded-lg border-0 md:border"
    >
      <div className="flex items-start gap-2">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} alt={`${profile?.vorname ?? 'Unbekannt'} Avatar`} />
          <AvatarFallback>
            {profile?.vorname && profile?.nachname
              ? `${profile.vorname[0]}${profile.nachname[0]}`
              : "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="w-full px-4 py-2 rounded-full border border-input hover:border-primary/30 bg-background text-muted-foreground text-sm transition-colors">
            Neuer Beitrag
          </div>

          {/* Quick actions */}
          <div className="mt-2 flex items-center gap-0.5">
            <Button type="button" variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-muted/50" onClick={openPostComposer}>
              <ImageIcon className="h-4 w-4 mr-1.5 text-primary" /> Bild
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-muted/50" onClick={openPostComposer}>
              <Calendar className="h-4 w-4 mr-1.5 text-primary" /> Event
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ComposerTeaser;
