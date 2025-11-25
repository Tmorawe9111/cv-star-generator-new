import React, { useState, useEffect } from 'react';
import { Home, Briefcase, MessageSquare, Search, User, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { subscribeVisibilityPromptOpened, subscribeVisibilityPromptClosed } from '@/lib/event-bus';

export const BOTTOM_NAV_HEIGHT = 56; // Instagram-style bottom navigation

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isVisibilityPromptOpen, setIsVisibilityPromptOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Fetch profile for avatar
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Listen for visibility prompt opened/closed events
  useEffect(() => {
    const unsubscribeOpened = subscribeVisibilityPromptOpened(() => {
      setIsVisibilityPromptOpen(true);
    });
    const unsubscribeClosed = subscribeVisibilityPromptClosed(() => {
      setIsVisibilityPromptOpen(false);
    });
    return () => {
      unsubscribeOpened();
      unsubscribeClosed();
    };
  }, []);

  // Don't render if visibility prompt is open
  if (isVisibilityPromptOpen) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="mx-auto max-w-screen-sm">
        <div className="grid grid-cols-5 items-center gap-0 py-1">
          {/* Home */}
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors duration-200",
              isActive('/dashboard')
                ? "text-black"
                : "text-gray-500"
            )}
            onClick={() => navigate('/dashboard')}
            aria-label="Home"
          >
            {isActive('/dashboard') ? (
              <Home className="h-6 w-6 fill-black stroke-black" />
            ) : (
              <Home className="h-6 w-6" />
            )}
          </button>

          {/* Jobs */}
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors duration-200",
              isActive('/community/jobs')
                ? "text-black"
                : "text-gray-500"
            )}
            onClick={() => navigate('/community/jobs')}
            aria-label="Jobs"
          >
            {isActive('/community/jobs') ? (
              <Briefcase className="h-6 w-6 fill-black stroke-black" />
            ) : (
              <Briefcase className="h-6 w-6" />
            )}
          </button>

          {/* Nachrichten */}
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors duration-200",
              isActive('/community/messages')
                ? "text-black"
                : "text-gray-500"
            )}
            onClick={() => navigate('/community/messages')}
            aria-label="Nachrichten"
          >
            {isActive('/community/messages') ? (
              <MessageSquare className="h-6 w-6 fill-black stroke-black" />
            ) : (
              <MessageSquare className="h-6 w-6" />
            )}
          </button>

          {/* Suche */}
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors duration-200",
              isActive('/marketplace')
                ? "text-black"
                : "text-gray-500"
            )}
            onClick={() => navigate('/marketplace')}
            aria-label="Suche"
          >
            {isActive('/marketplace') ? (
              <Search className="h-6 w-6 fill-black stroke-black" />
            ) : (
              <Search className="h-6 w-6" />
            )}
          </button>

          {/* Profilbild mit Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-opacity duration-200",
                  isActive('/profile') && "opacity-100"
                )}
                aria-label="Profil"
              >
                <Avatar className={cn(
                  "h-7 w-7 border-2 transition-all",
                  isActive('/profile') ? "border-black" : "border-transparent"
                )}>
                  <AvatarImage 
                    src={profile?.avatar_url || undefined} 
                    alt={`${profile?.first_name || ''} ${profile?.last_name || ''}`} 
                  />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                    {profile?.first_name?.[0] || profile?.last_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              side="top"
              className="w-48 bg-white border-gray-200 z-[400] mb-2"
            >
              <DropdownMenuItem 
                onClick={() => {
                  navigate('/profile');
                }}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Profil anzeigen
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => navigate('/settings')}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Einstellungen
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
