import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Copy, Check, Share2, Sparkles, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FirstEmployeeCTAProps {
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
}

export function FirstEmployeeCTA({ companyId, companyName, companyLogo }: FirstEmployeeCTAProps) {
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/firma/${companyId}?ref=colleague`;
  const shareText = `Hey! Ich bin jetzt auf BeVisiblle und habe ${companyName} verknüpft. Komm auch dazu und vernetze dich mit dem Team! 🚀`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: 'Link kopiert!',
        description: 'Teile den Link mit deinen Kollegen.',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${companyName} auf BeVisiblle`,
          text: shareText,
          url: inviteLink,
        });
      } catch (error) {
        // User cancelled or error
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="py-8 px-6 text-center">
        <div className="relative inline-block mb-4">
          <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
            <AvatarImage src={companyLogo || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
              <Building2 className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Du bist der Erste hier! 🎉
        </h3>
        <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">
          Hol dein Team dazu und baut gemeinsam das {companyName}-Netzwerk auf BeVisiblle auf.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Team einladen
          </Button>
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Kopiert!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Link kopieren
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-primary/20">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            <span>Sobald 3+ Kollegen dabei sind, wird das Firmenprofil freigeschaltet</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

