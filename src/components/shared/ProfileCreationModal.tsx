import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, Eye, EyeOff, Clock } from 'lucide-react';
import { toast as showToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCVForm } from '@/contexts/CVFormContext';
import { useAuth } from '@/hooks/useAuth';
import { checkProfileUniqueness } from '@/lib/profile-validation';
import { isPrivateEmail } from "@/lib/email-policy";

interface ProfileCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledEmail: string;
  formData: any;
}

export const ProfileCreationModal = ({ 
  isOpen, 
  onClose, 
  prefilledEmail, 
  formData 
}: ProfileCreationModalProps) => {
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [datenschutzAccepted, setDatenschutzAccepted] = useState(false);
  const [agbAccepted, setAgbAccepted] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { setAutoSyncEnabled } = useCVForm();
  const { refetchProfile } = useAuth();

  // Auth state cleanup utility
  const cleanupAuthState = () => {
    try {
      // Remove all Supabase auth keys from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      // Remove from sessionStorage if in use
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.log('Error cleaning auth state:', error);
    }
  };

  // Email validation utility
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Bitte geben Sie eine gültige E-Mail-Adresse ein";
    }
    if (!isPrivateEmail(email)) {
      return "Bitte nutze eine private E‑Mail-Adresse (z.B. gmail, web.de, gmx). Firmen-E-Mails sind nur für Unternehmensaccounts.";
    }
    return null;
  };

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitSeconds > 0) {
      const timer = setTimeout(() => {
        setRateLimitSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitSeconds]);

  const validatePassword = (password: string) => {
    if (password.length < 8) return "Passwort muss mindestens 8 Zeichen haben";
    if (!/[A-Z]/.test(password)) return "Passwort muss einen Großbuchstaben enthalten";
    if (!/[0-9]/.test(password)) return "Passwort muss eine Zahl enthalten";
    return null;
  };

  const handleCreateProfile = async () => {
    console.log(`[${new Date().toISOString()}] ProfileCreationModal: handleCreateProfile called`);
    console.log(`[${new Date().toISOString()}] ProfileCreationModal: Form data received:`, formData);
    console.log(`[${new Date().toISOString()}] ProfileCreationModal: Email:`, email);
    console.log(`[${new Date().toISOString()}] ProfileCreationModal: Password length:`, password?.length || 0);
    
    // Validate Datenschutz & AGB acceptance
    if (!datenschutzAccepted || !agbAccepted) {
      showToast.error('Bitte akzeptiere die Datenschutzerklärung und AGBs.');
      return;
    }
    
    // Try to get CV data from localStorage as fallback if formData is empty or incomplete
    let effectiveFormData = formData;
    if (!formData?.vorname || !formData?.nachname) {
      const savedCVData = localStorage.getItem('cvFormData');
      if (savedCVData) {
        try {
          const parsedCVData = JSON.parse(savedCVData);
          console.log(`[${new Date().toISOString()}] ProfileCreationModal: Using localStorage CV data as fallback:`, parsedCVData);
          effectiveFormData = { ...parsedCVData, ...formData }; // Merge with preference to passed formData
        } catch (error) {
          console.error('Error parsing localStorage CV data:', error);
        }
      }
    }
    
    // Additional debugging for CV data
    console.log(`[${new Date().toISOString()}] ProfileCreationModal: CV Data Analysis:`, {
      hasVorname: !!effectiveFormData?.vorname,
      hasNachname: !!effectiveFormData?.nachname,
      hasOrt: !!effectiveFormData?.ort,
      hasEmail: !!effectiveFormData?.email,
      hasBranche: !!effectiveFormData?.branche,
      hasStatus: !!effectiveFormData?.status,
      hasSchulbildung: !!effectiveFormData?.schulbildung && effectiveFormData.schulbildung.length > 0,
      hasBerufserfahrung: !!effectiveFormData?.berufserfahrung && effectiveFormData.berufserfahrung.length > 0,
      hasSprachen: !!effectiveFormData?.sprachen && effectiveFormData.sprachen.length > 0,
      hasFaehigkeiten: !!effectiveFormData?.faehigkeiten && effectiveFormData.faehigkeiten.length > 0,
      hasUeberMich: !!effectiveFormData?.ueber_mich || !!effectiveFormData?.ueberMich,
      actualVorname: effectiveFormData?.vorname,
      actualNachname: effectiveFormData?.nachname,
      actualBranche: effectiveFormData?.branche,
      actualStatus: effectiveFormData?.status
    });

    if (!email || !password) {
      showToast.error("Bitte füllen Sie alle Felder aus.");
      return;
    }

    // Check if profile image exists
    if (!effectiveFormData.profilbild && !effectiveFormData.avatar_url) {
      showToast.error("Bitte lade zuerst ein Profilbild hoch (Schritt 2).");
      return;
    }

    // Client-side email validation
    const emailError = validateEmail(email);
    if (emailError) {
      showToast.error(emailError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      showToast.error(passwordError);
      return;
    }

    console.log(`[${new Date().toISOString()}] ProfileCreationModal: Starting profile creation process`);
    
    // Disable auto-sync during profile creation to prevent race conditions
    setAutoSyncEnabled(false);
    console.log(`[${new Date().toISOString()}] ProfileCreationModal: Auto-sync disabled`);

    setIsCreating(true);

    try {
      // First try to create the account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile`,
          data: {
            role: "applicant",
            is_company: false,
          },
        },
      });

      if (authError) {
        console.error('Signup error:', authError);
        
        // Handle rate limiting specifically
        if (authError.message.includes('For security purposes') || authError.message.includes('rate')) {
          const match = authError.message.match(/(\d+)\s*seconds?/);
          const seconds = match ? parseInt(match[1]) : 60;
          setRateLimitSeconds(seconds);
          
          showToast.error(`Bitte warten Sie ${seconds} Sekunden und versuchen Sie es erneut.`);
          return;
        }

        // If user already exists, try to sign in
        if (authError.message.includes('User already registered')) {
          console.log('User exists, trying to sign in...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            console.error('Sign in error:', signInError);
            showToast.error("E-Mail oder Passwort ist falsch, oder der Account ist noch nicht bestätigt.");
            return;
          }

          if (signInData.user) {
            console.log('User signed in successfully:', signInData.user.id);
            // Continue with existing user
            var user = signInData.user;
          } else {
            showToast.error("Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
            return;
          }
        } else {
          // Handle other auth errors
          showToast.error(`Fehler beim Account erstellen: ${authError.message}`);
          return;
        }
      } else {
        // New user created successfully
        if (authData.user) {
          console.log('New user created:', authData.user.id);
          var user = authData.user;

          // Fire-and-forget Slack notification (only for true new signups)
          try {
            void supabase.functions.invoke('slack-signup-notify', {
              body: {
                kind: 'user',
                test: false,
                source: 'ProfileCreationModal.signUp',
                user: {
                  firstName: effectiveFormData?.vorname,
                  lastName: effectiveFormData?.nachname,
                  industry: effectiveFormData?.branche,
                  zip: effectiveFormData?.plz,
                  city: effectiveFormData?.ort,
                  status: effectiveFormData?.status,
                },
              },
            });
          } catch {
            // Never block signup UX on Slack failures
          }
          
          // If user is not confirmed, show message but continue
          if (!authData.session) {
            console.log('User created but not confirmed, continuing...');
          }
        } else {
          showToast.error("Account konnte nicht erstellt werden.");
          return;
        }
      }

      console.log('Processing user:', user.id);
        
        // Now we have an authenticated user, create/update profile
        console.log('Creating/updating profile for authenticated user:', user.id);
        
        // Check if email or phone number already exists (excluding current user)
        const { emailExists, phoneExists } = await checkProfileUniqueness(
          email,
          effectiveFormData.telefon,
          user.id
        );
        
        if (emailExists) {
          showToast.error('Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet.');
          return;
        }
        
        if (phoneExists) {
          showToast.error('Diese Telefonnummer wird bereits von einem anderen Benutzer verwendet.');
          return;
        }
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
          
        if (!existingProfile) {
          console.log('Creating new profile...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: email,
              account_created: true
            });
            
          if (insertError) {
            console.error('Profile creation failed:', insertError);
            showToast.error(insertError.message || "Das Profil konnte nicht erstellt werden. Bitte versuchen Sie es erneut.");
            return;
          }
          console.log('Profile created successfully');
        } else {
          console.log('Profile already exists:', existingProfile);
        }
        
        // Handle file uploads first
        let avatarUrl = typeof effectiveFormData.profilbild === 'string' ? effectiveFormData.profilbild : null;
        let coverImageUrl = typeof effectiveFormData.cover_image === 'string' ? effectiveFormData.cover_image : null;
        let cvUrl = null;

        try {
          // Upload profile image if it's a File
          if (effectiveFormData.profilbild instanceof File) {
            const { uploadProfileImage } = await import('@/lib/supabase-storage');
            const uploadResult = await uploadProfileImage(effectiveFormData.profilbild);
            avatarUrl = uploadResult.url;
          }

          // Upload cover image if it's a File  
          if (effectiveFormData.cover_image instanceof File) {
            const { uploadCoverImage } = await import('@/lib/supabase-storage');
            const uploadResult = await uploadCoverImage(effectiveFormData.cover_image);
            coverImageUrl = uploadResult.url;
          }

          // Generate and upload CV PDF
          if (effectiveFormData.vorname && effectiveFormData.nachname) {
            const { generateCVFilename } = await import('@/lib/pdf-generator');
            const { generateCVFromHTML, uploadCV } = await import('@/lib/supabase-storage');
            
            // Find CV preview element
            const cvElement = document.querySelector('[data-cv-preview]') as HTMLElement;
            if (cvElement) {
              const filename = generateCVFilename(effectiveFormData.vorname, effectiveFormData.nachname);
              const cvFile = await generateCVFromHTML(cvElement, filename);
              const uploadResult = await uploadCV(cvFile);
              cvUrl = uploadResult.url;
            }
          }
        } catch (uploadError) {
          console.warn('File upload error:', uploadError);
          // Continue with profile creation even if uploads fail
        }

        // Helper functions for profile data
        const getBrancheTitle = () => {
          switch (effectiveFormData.branche) {
            case 'handwerk': return 'Handwerk';
            case 'it': return 'IT';
            case 'gesundheit': return 'Gesundheit';
            case 'buero': return 'Büro';
            case 'verkauf': return 'Verkauf';
            case 'gastronomie': return 'Gastronomie';
            case 'bau': return 'Bau';
            default: return '';
          }
        };

        const getStatusTitle = () => {
          switch (effectiveFormData.status) {
            case 'schueler': return 'Schüler:in';
            case 'azubi': return 'Azubi';
            case 'ausgelernt': return 'Ausgelernte Fachkraft';
            default: return '';
          }
        };

        
        // Generate AI-powered bio from form data
        const bioText = [
          effectiveFormData.ueberMich,
          effectiveFormData.kenntnisse && `Kenntnisse: ${effectiveFormData.kenntnisse}`,
          effectiveFormData.motivation && `Motivation: ${effectiveFormData.motivation}`,
          effectiveFormData.praktische_erfahrung && `Praktische Erfahrung: ${effectiveFormData.praktische_erfahrung}`
        ].filter(Boolean).join('\n\n');
        
        console.log(`[${new Date().toISOString()}] ProfileCreationModal: Generated bio text:`, bioText);
        
        // Prepare profile update data
        const profileData = {
          email: email.trim().toLowerCase(),
          vorname: effectiveFormData.vorname,
          nachname: effectiveFormData.nachname,
              geburtsdatum: effectiveFormData.geburtsdatum ? 
                (effectiveFormData.geburtsdatum instanceof Date ? 
                  effectiveFormData.geburtsdatum.toISOString().split('T')[0] : 
                  effectiveFormData.geburtsdatum
                ) : null,
          strasse: effectiveFormData.strasse,
          hausnummer: effectiveFormData.hausnummer,
          plz: effectiveFormData.plz,
          ort: effectiveFormData.ort,
          telefon: effectiveFormData.telefon,
          avatar_url: avatarUrl,
          cover_image_url: coverImageUrl,
          cv_url: cvUrl,
          headline: effectiveFormData.headline || `${getStatusTitle()} ${effectiveFormData.branche ? `in ${getBrancheTitle()}` : ''}`,
          bio: bioText || effectiveFormData.ueberMich || effectiveFormData.ueber_mich,
          branche: effectiveFormData.branche || null,
          status: effectiveFormData.status || null,
          schule: effectiveFormData.schule,
          geplanter_abschluss: effectiveFormData.geplanter_abschluss,
          abschlussjahr: effectiveFormData.abschlussjahr,
          ausbildungsberuf: effectiveFormData.ausbildungsberuf,
          ausbildungsbetrieb: effectiveFormData.ausbildungsbetrieb,
          startjahr: effectiveFormData.startjahr,
          voraussichtliches_ende: effectiveFormData.voraussichtliches_ende,
          abschlussjahr_ausgelernt: effectiveFormData.abschlussjahr_ausgelernt,
          aktueller_beruf: effectiveFormData.aktueller_beruf,
          sprachen: effectiveFormData.sprachen || [],
          faehigkeiten: effectiveFormData.faehigkeiten || [],
          schulbildung: effectiveFormData.schulbildung || [],
          berufserfahrung: effectiveFormData.berufserfahrung || [],
          layout: effectiveFormData.layout || 1,
          uebermich: effectiveFormData.ueberMich || effectiveFormData.ueber_mich,
          kenntnisse: effectiveFormData.kenntnisse,
          motivation: effectiveFormData.motivation,
          praktische_erfahrung: effectiveFormData.praktische_erfahrung,
          has_drivers_license: effectiveFormData.has_drivers_license || false,
          has_own_vehicle: effectiveFormData.has_own_vehicle || false,
          target_year: effectiveFormData.target_year,
          visibility_industry: effectiveFormData.visibility_industry || [],
          visibility_region: effectiveFormData.visibility_region || [],
          einwilligung: effectiveFormData.einwilligung || false,
          profile_complete: true,
          profile_published: false,
          updated_at: new Date().toISOString()
        };

         console.log('ProfileCreationModal: Effective form data:', effectiveFormData);
         console.log('ProfileCreationModal: Effective form data keys:', Object.keys(effectiveFormData || {}));
         console.log('ProfileCreationModal: Updating profile with data:', profileData);

        // Update the profile with retry mechanism
        let retryCount = 0;
        const maxRetries = 3;
        let profileUpdateSuccess = false;

        while (retryCount < maxRetries && !profileUpdateSuccess) {
          try {
            console.log(`[${new Date().toISOString()}] ProfileCreationModal: Profile update attempt ${retryCount + 1}/${maxRetries}`);
            
            const { data: updatedProfile, error: profileError } = await supabase
              .from('profiles')
              .update(profileData)
              .eq('id', user.id)
              .select()
              .single();

            if (profileError) {
              throw profileError;
            }

            console.log(`[${new Date().toISOString()}] ProfileCreationModal: Profile updated successfully:`, updatedProfile);
            profileUpdateSuccess = true;
            
            // Re-enable auto-sync after successful profile creation
            setAutoSyncEnabled(true);
            console.log(`[${new Date().toISOString()}] ProfileCreationModal: Auto-sync re-enabled after successful profile creation`);

            // Clear CV form data from localStorage since it's now in the profile
            localStorage.removeItem('cvFormData');
            localStorage.removeItem('cvLayoutEditMode');
            localStorage.removeItem('creating-profile');
            
            showToast.success("Profil erfolgreich erstellt!");
            
            // Refresh the profile in auth context and navigate
            await refetchProfile();
            onClose();
            
            // Navigate back to job page if returnTo is set, otherwise to profile
            if (returnTo) {
              const decodedReturnTo = decodeURIComponent(returnTo);
              navigate(decodedReturnTo);
            } else {
              navigate('/profile');
            }
            
          } catch (error) {
            retryCount++;
            console.error(`[${new Date().toISOString()}] ProfileCreationModal: Profile update attempt ${retryCount} failed:`, error);
            
            if (retryCount < maxRetries) {
              console.log(`[${new Date().toISOString()}] ProfileCreationModal: Retrying in 1 second...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              setAutoSyncEnabled(true); // Re-enable auto-sync on final failure
              showToast.error(`Fehler beim Profil aktualisieren: ${(error as any).message}`);
              return;
            }
          }
        }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ProfileCreationModal: Unexpected error:`, error);
      setAutoSyncEnabled(true); // Re-enable auto-sync on error
      showToast.error((error as any)?.message || "Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[9999] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 border border-border/50 bg-background p-6 md:p-8 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl md:text-2xl font-bold">Profil erstellen</DialogTitle>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Erstelle jetzt dein Profil und werde von Arbeitgebern gefunden
          </p>
        </DialogHeader>
        
        <div className="space-y-5">
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre@email.com"
              className="h-11 text-base"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Passwort</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                className="h-11 text-base pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mindestens 8 Zeichen, ein Großbuchstabe und eine Zahl
            </p>
          </div>
          
          {rateLimitSeconds > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <Clock className="h-4 w-4 inline mr-2 text-orange-600" />
              <span className="text-sm text-orange-700">
                Bitte warten Sie noch {rateLimitSeconds} Sekunden
              </span>
            </div>
          )}
          
          {/* Datenschutz & AGB Checkboxes */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="modal-datenschutz"
                checked={datenschutzAccepted}
                onCheckedChange={(checked) => setDatenschutzAccepted(!!checked)}
              />
              <Label 
                htmlFor="modal-datenschutz" 
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                Ich habe die <a href="/datenschutz" target="_blank" className="text-primary underline hover:text-primary/80">Datenschutzerklärung</a> gelesen und akzeptiere diese.
              </Label>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="modal-agb"
                checked={agbAccepted}
                onCheckedChange={(checked) => setAgbAccepted(!!checked)}
              />
              <Label 
                htmlFor="modal-agb" 
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                Ich akzeptiere die <a href="/agb" target="_blank" className="text-primary underline hover:text-primary/80">Allgemeinen Geschäftsbedingungen (AGB)</a>.
              </Label>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={handleCreateProfile} 
              disabled={isCreating || !datenschutzAccepted || !agbAccepted || rateLimitSeconds > 0}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Erstelle Profil...
                </>
              ) : rateLimitSeconds > 0 ? (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  Bitte warten ({rateLimitSeconds}s)
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Profil erstellen
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogPrimitive.Content>
    </Dialog>
  );
};