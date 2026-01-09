import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CVGeneratorModal } from '@/components/modals/CVGeneratorModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BRANCHES } from '@/lib/branches';
import { LocationAutocomplete } from '@/components/Company/LocationAutocomplete';

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
        // Store quick signup data in localStorage for onboarding
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

        toast({
          title: "Registrierung erfolgreich",
          description: "Vervollständige jetzt dein Profil!",
        });

        // Open CV Generator Modal instead of redirecting
        setShowCVModal(true);
        
        // If email not confirmed, show additional toast
        if (!data.user.email_confirmed_at) {
          toast({
            title: "E-Mail bestätigen",
            description: "Bitte überprüfen Sie Ihre E-Mails und bestätigen Sie Ihre E-Mail-Adresse.",
          });
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Startseite
          </Button>
          
          <h1 className="text-3xl font-bold">Schnellregistrierung</h1>
          <p className="text-muted-foreground">
            Erstellen Sie Ihr Profil in wenigen Schritten
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Registrierung</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vorname */}
              <div className="space-y-2">
                <Label htmlFor="vorname">Vorname *</Label>
                <Input
                  id="vorname"
                  type="text"
                  value={formData.vorname}
                  onChange={(e) => setFormData(prev => ({ ...prev, vorname: e.target.value }))}
                  placeholder="Max"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Nachname */}
              <div className="space-y-2">
                <Label htmlFor="nachname">Nachname *</Label>
                <Input
                  id="nachname"
                  type="text"
                  value={formData.nachname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nachname: e.target.value }))}
                  placeholder="Mustermann"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* PLZ & Ort */}
              <div className="space-y-2">
                <Label htmlFor="location">PLZ & Ort *</Label>
                <LocationAutocomplete
                  value={locationInputValue}
                  onChange={handleLocationChange}
                  placeholder="PLZ eingeben"
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ihre@email.com"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Passwort *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mindestens 8 Zeichen"
                    disabled={isSubmitting}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                <p className="text-xs text-muted-foreground">
                  Passwort muss mindestens 8 Zeichen, einen Großbuchstaben und eine Zahl enthalten.
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Passwort bestätigen *</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    disabled={isSubmitting}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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

              {/* Branche */}
              <div className="space-y-2">
                <Label htmlFor="branche">Branche *</Label>
                <Select
                  value={formData.branche}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, branche: value }))}
                  disabled={isSubmitting}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Branche wählen" />
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

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Art *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={isSubmitting}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Art wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schueler">Schüler:in</SelectItem>
                    <SelectItem value="azubi">Auszubildender</SelectItem>
                    <SelectItem value="fachkraft">Fachkraft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
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

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Mit der Registrierung stimmen Sie unseren{' '}
                  <a href="/agb" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                    AGB
                  </a>{' '}
                  und{' '}
                  <a href="/datenschutz" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                    Datenschutzbestimmungen
                  </a>{' '}
                  zu.
                </p>
              </div>
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

