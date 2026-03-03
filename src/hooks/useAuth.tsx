import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileRow } from '@/types/profile';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  profile: ProfileRow | null;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  profile: null,
  refetchProfile: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    let abortController = new AbortController();
    let loadProfileTimeout: NodeJS.Timeout | null = null;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Clear any pending profile loads
        if (loadProfileTimeout) {
          clearTimeout(loadProfileTimeout);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // When user signs in, set login timestamp in sessionStorage
        // This will be used to show SuggestedConnectionsModal on every login
        if (event === 'SIGNED_IN' && session?.user) {
          const loginTimestampKey = `login_timestamp_${session.user.id}`;
          const loginTimestamp = Date.now().toString();
          sessionStorage.setItem(loginTimestampKey, loginTimestamp);
          // Clear the "shown" flag so modal appears again
          const shownForLoginKey = `suggested_connections_shown_for_login_${session.user.id}`;
          sessionStorage.removeItem(shownForLoginKey);
        }
        
        // Load profile when user is authenticated (no delay for faster loading)
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (abortController.signal.aborted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch((error) => {
      if (error?.name !== 'AbortError') {
        console.error('Session error:', error);
        toast.error('Sitzung konnte nicht geladen werden. Bitte Seite neu laden.');
      }
      setIsLoading(false);
    });

    return () => {
      if (loadProfileTimeout) {
        clearTimeout(loadProfileTimeout);
      }
      abortController.abort();
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      // Load ALL profile fields using select('*') to ensure we get everything from the database
      // This matches how CVPrintPage loads profile data and ensures all CV generator data is available
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // Silently ignore abort errors
        if (error.message.includes('aborted') || error.message.includes('Fetch is aborted')) {
          return;
        }
        console.error('Error loading profile:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Try loading with minimal fields if full query fails due to missing columns
        if (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('column')) {
          console.warn('Some columns may not exist, trying minimal query...');
          try {
            const { data: minimalProfile, error: minimalError } = await supabase
              .from('profiles')
              .select('id, vorname, nachname, email, avatar_url, profile_complete, account_created, created_at, updated_at')
              .eq('id', userId)
              .maybeSingle();
            
            if (minimalError) {
              console.error('Minimal query also failed:', minimalError);
              setProfile(null);
            } else if (minimalProfile) {
              console.warn('Loaded profile with minimal fields');
              setProfile(minimalProfile);
              return;
            } else {
              console.warn('Profile not found in database');
              setProfile(null);
            }
          } catch (fallbackError) {
            console.error('Fallback query failed:', fallbackError);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } else if (profile) {
        // CRITICAL: Sync email from auth.users to profiles table
        // This ensures the email in profiles always matches auth.users
        const currentUser = await supabase.auth.getUser();
        if (currentUser.data?.user?.email && profile.email !== currentUser.data.user.email) {
          console.warn('Email mismatch detected! Syncing email from auth.users to profiles:', {
            profileEmail: profile.email,
            authEmail: currentUser.data.user.email,
            userId: userId
          });
          
          // Update profile email to match auth.users
          const { error: syncError } = await supabase
            .from('profiles')
            .update({ 
              email: currentUser.data.user.email.toLowerCase().trim(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (syncError) {
            console.error('Error syncing email:', syncError);
          } else {
            // Update local profile with synced email
            profile.email = currentUser.data.user.email.toLowerCase().trim();
            console.log('✅ Email synced successfully');
          }
        }
        
        // Only set profile if data exists
        // Debug: Log loaded profile data
        console.log('✅ Profile loaded from database:', {
          id: profile.id,
          vorname: profile.vorname,
          nachname: profile.nachname,
          berufserfahrung: profile.berufserfahrung,
          schulbildung: profile.schulbildung,
          faehigkeiten: profile.faehigkeiten,
          sprachen: profile.sprachen,
          uebermich: profile.uebermich,
          branche: profile.branche,
          status: profile.status,
          headline: profile.headline,
          cover_image_url: profile.cover_image_url,
          cv_url: profile.cv_url,
          account_created: profile.account_created,
          profile_complete: profile.profile_complete,
          geburtsdatum: profile.geburtsdatum,
          schule: profile.schule,
          geplanter_abschluss: profile.geplanter_abschluss,
          ausbildungsberuf: profile.ausbildungsberuf,
          aktueller_beruf: profile.aktueller_beruf,
        });
        setProfile(profile);
      } else {
        // Profile not found - check if this is a company user (expected behavior)
        // or a regular user (potential issue)
        try {
          const { data: companyUser } = await supabase
            .from('company_users')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (companyUser) {
            // This is a company user - no profile is expected, silently set to null
            setProfile(null);
          } else {
            // This is a regular user without a profile - log warning
            console.warn('Profile not found for user:', userId, '- This may indicate a missing profile for a job seeker');
            setProfile(null);
          }
        } catch (checkError) {
          // If we can't check, just set to null and log warning
          console.warn('Profile not found for user:', userId);
          setProfile(null);
        }
      }
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
        return;
      }
      console.error('Unexpected error loading profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      profile,
      refetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};