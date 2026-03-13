import { useAuth } from '@/hooks/useAuth';
import { useReferralCode } from '@/hooks/useReferralCode';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Share2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function Referrals() {
  const { user } = useAuth();
  const { stats, isLoading } = useReferralCode();
  const navigate = useNavigate();

  const referralCode = user?.id ? `USER_${user.id.slice(0, 8).toUpperCase()}` : '';
  const shareUrl = referralCode ? `${window.location.origin}/cv-generator?ref=${referralCode}` : '';

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link kopiert!', description: 'Der Einladungslink wurde in die Zwischenablage kopiert.' });
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Einladungen</h1>
        <p className="mb-8 text-gray-600">
          Lade Freund:innen und Kolleg:innen ein und werde sichtbar – gemeinsam sind wir stärker.
        </p>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">Deine Einladungen</span>
            </div>
            {!isLoading && (
              <div className="flex items-center gap-2">
                {stats.is_contest_eligible && <Trophy className="h-5 w-5 text-primary" />}
                <span className="font-semibold text-primary">{stats.successful_referrals}</span>
              </div>
            )}
          </div>
          {!isLoading && stats.is_contest_eligible && (
            <Badge className="mb-4 w-full justify-center bg-primary text-primary-foreground py-2">
              Teilnahmeberechtigt für Gewinnspiel!
            </Badge>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-2 font-semibold text-gray-900">Code teilen & gewinnen</h2>
          <p className="mb-4 text-sm text-gray-600">
            Teile deinen persönlichen Link – wer sich darüber registriert und ein Profil anlegt, zählt für dich.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
            <Button onClick={copyLink} size="sm" className="shrink-0">
              <Copy className="h-4 w-4 mr-2" />
              Kopieren
            </Button>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              if (navigator.share && shareUrl) {
                navigator.share({
                  title: 'BeVisiblle – Karrierenetzwerk',
                  text: 'Erstelle dein Profil bei BeVisiblle und vernetze dich mit Unternehmen!',
                  url: shareUrl,
                });
              } else {
                copyLink();
              }
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Link teilen
          </Button>
        </Card>

        <Button variant="ghost" className="mt-6" onClick={() => navigate(-1)}>
          ← Zurück
        </Button>
      </div>
    </div>
  );
}
