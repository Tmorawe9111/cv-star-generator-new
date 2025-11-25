import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, UserMinus } from 'lucide-react';

type Props = {
  companyId: string;
  profileId: string;
  mode?: 'profile-to-company' | 'company-to-profile';
  initialFollowing?: boolean;
  initialStatus?: 'pending' | 'accepted';
  initialBell?: 'off' | 'highlights' | 'all';
  onChange?: (state: { following: boolean; status?: 'pending' | 'accepted'; bell: 'off' | 'highlights' | 'all' }) => void;
};

export default function FollowButton({
  companyId,
  profileId,
  mode = 'profile-to-company',
  initialFollowing = false,
  initialStatus = 'accepted',
  initialBell = 'highlights',
  onChange
}: Props) {
  const { toast } = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [status, setStatus] = useState<'pending' | 'accepted'>(initialStatus);
  const [bellOpen, setBellOpen] = useState(false);
  const [bell, setBell] = useState<'off' | 'highlights' | 'all'>(initialBell);
  const [loading, setLoading] = useState(false);

  // Check actual follow status on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('id, status')
          .eq('follower_id', mode === 'profile-to-company' ? profileId : companyId)
          .eq('followee_id', mode === 'profile-to-company' ? companyId : profileId)
          .eq('follower_type', mode === 'profile-to-company' ? 'profile' : 'company')
          .eq('followee_type', mode === 'profile-to-company' ? 'company' : 'profile')
          .maybeSingle();
        
        if (!error && data) {
          setFollowing(true);
          setStatus(data.status as 'pending' | 'accepted');
        } else {
          setFollowing(false);
          setStatus('accepted');
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [profileId, companyId, mode]);

  const follow = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_type: mode === 'profile-to-company' ? 'profile' : 'company',
          follower_id: mode === 'profile-to-company' ? profileId : companyId,
          followee_type: mode === 'profile-to-company' ? 'company' : 'profile',
          followee_id: mode === 'profile-to-company' ? companyId : profileId,
          status: mode === 'company-to-profile' ? 'pending' : 'accepted'
        });
      
      if (error) throw error;
      
      setFollowing(true);
      const newStatus = mode === 'company-to-profile' ? 'pending' : 'accepted';
      setStatus(newStatus);
      onChange?.({ following: true, status: newStatus, bell });
      
      const message = mode === 'company-to-profile' 
        ? 'Folge-Anfrage an Azubi gesendet!'
        : 'Unternehmen folgen erfolgreich!';
      toast({ description: message });
    } catch (error) {
      console.error('Error following:', error);
      toast({ 
        variant: 'destructive',
        description: 'Fehler beim Folgen'
      });
    } finally {
      setLoading(false);
    }
  };

  const unfollow = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', mode === 'profile-to-company' ? profileId : companyId)
        .eq('followee_id', mode === 'profile-to-company' ? companyId : profileId)
        .eq('follower_type', mode === 'profile-to-company' ? 'profile' : 'company')
        .eq('followee_type', mode === 'profile-to-company' ? 'company' : 'profile');
      
      if (error) throw error;
      
      setFollowing(false);
      setStatus('accepted');
      onChange?.({ following: false, status: 'accepted', bell });
      
      const message = mode === 'company-to-profile' 
        ? 'Folge-Anfrage zurückgezogen'
        : 'Unternehmen entfolgt';
      toast({ description: message });
    } catch (error) {
      console.error('Error unfollowing:', error);
      toast({ 
        variant: 'destructive',
        description: 'Fehler beim Entfolgen'
      });
    } finally {
      setLoading(false);
    }
  };

  const setBellPref = async (next: 'off' | 'highlights' | 'all') => {
    setBell(next); // optimistic update
    try {
      // For now, just update locally - bell prefs can be implemented later
      onChange?.({ following, status, bell: next });
      toast({ description: 'Benachrichtigungseinstellungen aktualisiert' });
    } catch (error) {
      console.error('Error setting bell preference:', error);
      // Revert optimistic update
      setBell(initialBell);
      toast({ 
        variant: 'destructive',
        description: 'Fehler beim Speichern der Benachrichtigungseinstellungen'
      });
    }
  };

  if (!following) {
    const buttonText = mode === 'company-to-profile' 
      ? (loading ? 'Sende Anfrage...' : 'Folgen') 
      : (loading ? 'Folge …' : 'Folgen');
    
    return (
      <Button
        onClick={follow}
        disabled={loading}
        className="bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground hover:opacity-90"
      >
        {buttonText}
      </Button>
    );
  }

  // Show status for company-to-profile follows
  if (mode === 'company-to-profile' && status === 'pending') {
    return (
      <div className="relative inline-flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          Anfrage gesendet
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={unfollow}
          className="gap-2"
        >
          <UserMinus className="h-4 w-4" />
          Zurückziehen
        </Button>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setBellOpen(v => !v)}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        {bell === 'all' ? 'Alle' : bell === 'highlights' ? 'Highlights' : 'Aus'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={unfollow}
        className="gap-2"
      >
        <UserMinus className="h-4 w-4" />
        {mode === 'company-to-profile' ? 'Entfolgen' : 'Entfolgen'}
      </Button>

      {bellOpen && (
        <div className="absolute right-0 top-11 z-10 w-48 rounded-xl border bg-background p-2 shadow-lg">
          {(['off', 'highlights', 'all'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => { setBellOpen(false); setBellPref(opt); }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                bell === opt ? 'font-semibold bg-accent' : ''
              }`}
            >
              {opt === 'off' ? 'Aus' : opt === 'highlights' ? 'Highlights' : 'Alle'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}