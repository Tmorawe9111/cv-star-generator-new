import React, { useEffect, useState } from 'react';
import { X, Bell, UserCheck, BriefcaseBusiness } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Guten Morgen';
  if (hour >= 12 && hour < 15) return 'Guten Mittag';
  if (hour >= 15 && hour < 18) return 'Guten Nachmittag';
  if (hour >= 18 && hour < 22) return 'Guten Abend';
  return 'Gute Nacht'; // 22:00 - 4:59
};

interface WelcomePopupProps {
  type?: 'user' | 'company';
  companyId?: string;
}

export function WelcomePopup({ type = 'user', companyId }: WelcomePopupProps) {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeStats, setWelcomeStats] = useState({ jobs: 0, contacts: 0, notifications: 0 });

  useEffect(() => {
    if (!user) return;
    
    // Check if already shown this session
    const sessionKey = `welcome_shown_${user.id}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }
    
    // Mark as shown for this session
    sessionStorage.setItem(sessionKey, 'true');
    setShowWelcome(true);
    
    const fetchStats = async () => {
      if (type === 'user') {
        // User stats
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        const { count: contactCount } = await supabase
          .from('user_connections')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('status', 'pending');
        
        const { count: jobCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending');
        
        setWelcomeStats({
          notifications: notifCount || 0,
          contacts: contactCount || 0,
          jobs: jobCount || 0
        });
      } else if (type === 'company' && companyId) {
        // Company stats
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        const { count: applicationsCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'pending');
        
        const { count: followCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', companyId)
          .eq('status', 'pending');
        
        setWelcomeStats({
          notifications: notifCount || 0,
          contacts: followCount || 0,
          jobs: applicationsCount || 0
        });
      }
    };
    
    fetchStats();
    
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [user, type, companyId]);

  if (!showWelcome || !user) return null;

  const firstName = user.user_metadata?.vorname || user.user_metadata?.first_name || 'du';

  return (
    <div 
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => setShowWelcome(false)}
    >
      <div 
        className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 md:p-8 w-full max-w-sm md:max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowWelcome(false); }}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        {/* Greeting - centered and larger */}
        <div className="text-center mb-6">
          <div className="text-4xl md:text-5xl mb-3">👋</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {getGreeting()}, {firstName}!
          </h2>
          <p className="text-sm md:text-base text-gray-500">Schön, dass du da bist</p>
        </div>
        
        {(welcomeStats.jobs > 0 || welcomeStats.contacts > 0 || welcomeStats.notifications > 0) && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium text-center">Seit deiner letzten Anmeldung:</p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {welcomeStats.jobs > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-full text-sm font-medium">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {type === 'company' 
                    ? `${welcomeStats.jobs} Bewerbung${welcomeStats.jobs > 1 ? 'en' : ''}`
                    : `${welcomeStats.jobs} Jobanfrage${welcomeStats.jobs > 1 ? 'n' : ''}`
                  }
                </div>
              )}
              {welcomeStats.contacts > 0 && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-full text-sm font-medium">
                  <UserCheck className="h-4 w-4" />
                  {type === 'company'
                    ? `${welcomeStats.contacts} Follow-Anfrage${welcomeStats.contacts > 1 ? 'n' : ''}`
                    : `${welcomeStats.contacts} Kontaktanfrage${welcomeStats.contacts > 1 ? 'n' : ''}`
                  }
                </div>
              )}
              {welcomeStats.notifications > 0 && (
                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-full text-sm font-medium">
                  <Bell className="h-4 w-4" />
                  {welcomeStats.notifications} Benachrichtigung{welcomeStats.notifications > 1 ? 'en' : ''}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Progress bar for auto-dismiss */}
        <div className="mt-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full"
            style={{ 
              width: '100%',
              animation: 'shrink 5s linear forwards'
            }} 
          />
        </div>
      </div>
    </div>
  );
}

