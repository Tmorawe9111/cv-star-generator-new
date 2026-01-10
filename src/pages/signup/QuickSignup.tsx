import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CVGeneratorModal } from '@/components/modals/CVGeneratorModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BRANCHES } from '@/lib/branches';
import { LocationAutocomplete } from '@/components/Company/LocationAutocomplete';
import confetti from 'canvas-confetti';

const QUICK_SIGNUP_STORAGE_KEY = 'quick_signup_data';

interface QuickSignupData {
  vorname: string;
  nachname: string;
  plz: string;
  ort: string;
  email: string;
  branche: string;
  status: string;
}

const QuickSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<QuickSignupData>({
    vorname: '',
    nachname: '',
    plz: '',
    ort: '',
    email: '',
    branche: '',
    status: '',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationInputValue, setLocationInputValue] = useState('');
  const [showCVModal, setShowCVModal] = useState(false);
  const [acceptedAGB, setAcceptedAGB] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  };

  const parseLocation = (locationStr: string): { plz: string; ort: string } => {
    const match = locationStr.match(/^(\d{5})\s+(.+)$/);
    if (match) {
      return { plz: match[1], ort: match[2] };
    }
    // Fallback: If it's just a number, treat as PLZ
    if (/^\d{5}$/.test(locationStr)) {
      return { plz: locationStr, ort: '' };
    }
    // If it's text, treat as city
    return { plz: '', ort: locationStr };
  };

  const handleLocationChange = (value: string) => {
    setLocationInputValue(value);
    const parsed = parseLocation(value);
    setFormData(prev => ({
      ...prev,
      plz: parsed.plz,
      ort: parsed.ort,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.vorname || !formData.nachname || !formData.plz || !formData.ort || 
        !formData.email || !password || !confirmPassword || !formData.branche || !formData.status) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive"
      });
      return;
    }

    if (!acceptedAGB || !acceptedPrivacy) {
      toast({
        title: "Fehler",
        description: "Bitte akzeptieren Sie die AGB und Datenschutzbestimmungen.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "E-Mail ungültig",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        variant: "destructive"
      });
      return;
    }

    if (!validatePassword(password)) {
      toast({
        title: "Passwort zu schwach",
        description: "Passwort muss mindestens 8 Zeichen, einen Großbuchstaben und eine Zahl enthalten.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwörter stimmen nicht überein",
        description: "Bitte überprüfen Sie Ihre Passwort-Eingabe.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean up auth state before signup
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out failed:', err);
      }

      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/cv-generator`,
          data: {
            role: 'applicant',
            is_company: false,
          }
        }
      });

      if (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('User already registered')) {
          toast({
            title: "E-Mail bereits registriert",
            description: "Diese E-Mail-Adresse wird bereits verwendet. Bitte loggen Sie sich ein.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Registrierung fehlgeschlagen",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        // Create profile immediately with available data
        const profileData = {
          id: data.user.id,
          vorname: formData.vorname.trim(),
          nachname: formData.nachname.trim(),
          email: formData.email.trim(),
          plz: formData.plz.trim(),
          ort: formData.ort.trim(),
          branche: formData.branche,
          status: formData.status,
          profile_complete: false, // Will be set to true after CV completion
          profile_published: false,
        };

        console.log('[QuickSignup] Creating/updating profile with data:', profileData);

        // Use UPSERT (INSERT ... ON CONFLICT DO UPDATE) to handle existing profiles
        const { error: profileError, data: profileInsertData } = await supabase
          .from('profiles')
          .upsert(profileData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation/update error:', profileError);
          toast({
            title: "Profil konnte nicht erstellt werden",
            description: profileError.message || "Bitte versuchen Sie es erneut.",
            variant: "destructive"
          });
          return;
        }

        console.log('[QuickSignup] Profile created/updated successfully:', profileInsertData);

        // Store quick signup data in localStorage for CV generator
        const quickSignupData = {
          vorname: formData.vorname,
          nachname: formData.nachname,
          plz: formData.plz,
          ort: formData.ort,
          branche: formData.branche,
          status: formData.status,
          email: formData.email,
        };
        localStorage.setItem(QUICK_SIGNUP_STORAGE_KEY, JSON.stringify(quickSignupData));

        // Trigger Slack notification (non-blocking)
        try {
          await supabase.functions.invoke('slack-signup-notify', {
            body: {
              kind: 'user',
              test: false,
              source: 'QuickSignup.profileCreated',
              user: {
                firstName: formData.vorname,
                lastName: formData.nachname,
                industry: formData.branche,
                zip: formData.plz,
                city: formData.ort,
                status: formData.status,
              },
            },
          });
        } catch (error) {
          // Never block signup UX on Slack failures
          console.error('Slack notification failed:', error);
        }

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        toast({
          title: "Profil erstellt! 🎉",
          description: "Willkommen bei bevisible!",
        });

        // Show dashboard for 5 seconds
        setShowDashboard(true);
        navigate('/mein-bereich');

        // After 5 seconds, open CV Generator Modal
        setTimeout(() => {
          setShowCVModal(true);
        }, 5000);
        
        // If email not confirmed, show additional toast
        if (!data.user.email_confirmed_at) {
          setTimeout(() => {
            toast({
              title: "E-Mail bestätigen",
              description: "Bitte überprüfen Sie Ihre E-Mails und bestätigen Sie Ihre E-Mail-Adresse.",
            });
          }, 6000);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-md h-full flex flex-col">
        {/* Header - Compact */}
        <div className="text-center space-y-1 mb-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-1 h-8 text-xs px-2"
            size="sm"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Zurück
          </Button>
          
          <h1 className="text-xl sm:text-2xl font-bold">Jetzt anmelden</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Profil in wenigen Schritten erstellen
          </p>
        </div>

        {/* Form - Scrollable if needed, but optimized for no-scroll */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
            <CardTitle className="text-center text-base sm:text-lg">Registrierung</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
              {/* Vorname & Nachname - Side by side on larger screens */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="vorname" className="text-xs sm:text-sm">Vorname *</Label>
                  <Input
                    id="vorname"
                    type="text"
                    value={formData.vorname}
                    onChange={(e) => setFormData(prev => ({ ...prev, vorname: e.target.value }))}
                    placeholder="Max"
                    disabled={isSubmitting}
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nachname" className="text-xs sm:text-sm">Nachname *</Label>
                  <Input
                    id="nachname"
                    type="text"
                    value={formData.nachname}
                    onChange={(e) => setFormData(prev => ({ ...prev, nachname: e.target.value }))}
                    placeholder="Mustermann"
                    disabled={isSubmitting}
                    required
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* PLZ & Ort */}
              <div className="space-y-1">
                <Label htmlFor="location" className="text-xs sm:text-sm">PLZ & Ort *</Label>
                <div className="[&_input]:h-9 [&_input]:text-sm">
                  <LocationAutocomplete
                    value={locationInputValue}
                    onChange={handleLocationChange}
                    placeholder="PLZ eingeben"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs sm:text-sm">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ihre@email.com"
                  disabled={isSubmitting}
                  required
                  className="h-9 text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs sm:text-sm">Passwort *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 Zeichen, Großbuchstabe, Zahl"
                    disabled={isSubmitting}
                    required
                    className="h-9 text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label htmlFor="confirm-password" className="text-xs sm:text-sm">Passwort bestätigen *</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    disabled={isSubmitting}
                    required
                    className="h-9 text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Branche & Status - Side by side on larger screens */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="branche" className="text-xs sm:text-sm">Branche *</Label>
                  <Select
                    value={formData.branche}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, branche: value }))}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Branche" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCHES.map((branch) => (
                        <SelectItem key={branch.key} value={branch.key}>
                          {branch.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs sm:text-sm">Art *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Art" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schueler">Schüler:in</SelectItem>
                      <SelectItem value="azubi">Auszubildender</SelectItem>
                      <SelectItem value="fachkraft">Fachkraft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AGB & Datenschutz Checkboxes */}
              <div className="space-y-2 pt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agb"
                    checked={acceptedAGB}
                    onCheckedChange={(checked) => setAcceptedAGB(checked === true)}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                  <Label htmlFor="agb" className="text-xs leading-tight cursor-pointer">
                    Ich akzeptiere die{' '}
                    <a href="/agb" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                      AGB
                    </a>
                    {' '}*
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={acceptedPrivacy}
                    onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                  <Label htmlFor="privacy" className="text-xs leading-tight cursor-pointer">
                    Ich akzeptiere die{' '}
                    <a href="/datenschutz" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                      Datenschutzbestimmungen
                    </a>
                    {' '}*
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 text-sm font-semibold mt-2" 
                disabled={isSubmitting || !acceptedAGB || !acceptedPrivacy}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrieren...
                  </>
                ) : (
                  'Jetzt registrieren'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* CV Generator Modal - opens after successful signup */}
      <CVGeneratorModal
        open={showCVModal}
        onClose={() => {
          // Only allow closing if user explicitly wants to
          if (window.confirm('Möchtest du wirklich abbrechen? Du kannst dein Profil später vervollständigen.')) {
            setShowCVModal(false);
            navigate('/mein-bereich');
          }
        }}
        onComplete={() => {
          // Profile is complete, close modal and navigate
          setShowCVModal(false);
          // Navigation happens in modal's handleComplete
        }}
      />
    </div>
  );
};

export default QuickSignup;
export { QUICK_SIGNUP_STORAGE_KEY };

