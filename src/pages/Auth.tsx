import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const Auth = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [role, setRole] = useState<'applicant' | 'company'>('applicant');

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      // Check if there's a returnTo parameter
      if (returnTo) {
        const decodedReturnTo = decodeURIComponent(returnTo);
        navigate(decodedReturnTo);
        return;
      }
      
      // Check if user is a company user and redirect accordingly
      const checkUserTypeAndRedirect = async () => {
        try {
          const { data: companyUsers } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.id);

          const isCompany = companyUsers && companyUsers.length > 0;
          const hasIsCompanyMeta = user.user_metadata?.is_company === true || 
                                  user.user_metadata?.is_company === 'true';

          // If user has is_company metadata but no company_users entry
          if (hasIsCompanyMeta && !isCompany) {
            toast({
              title: "Registrierung unvollständig",
              description: "Bitte vervollständigen Sie Ihre Unternehmensregistrierung.",
            });
            navigate('/unternehmensregistrierung');
            return;
          }

          if (isCompany) {
            navigate('/unternehmen/startseite');
          } else {
            navigate('/mein-bereich');
          }
        } catch (error) {
          // If error checking company status, default to user dashboard
          navigate('/mein-bereich');
        }
      };

      checkUserTypeAndRedirect();
    }
  }, [user, isLoading, navigate, returnTo]);

  // Auth state cleanup utility
  const cleanupAuthState = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.log('Error cleaning auth state:', error);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "E-Mail ungültig",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        variant: "destructive"
      });
      return;
    }

    setIsAuthenticating(true);

    try {
      // Clean up auth state before login
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out failed:', err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = error.message;
        
        // Better error messages for common issues
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "E-Mail oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.";
        }
        
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Erfolgreich angemeldet",
          description: "Willkommen zurück!",
        });
        
        // Check if user is company user
        const { data: companyUsers } = await supabase
          .from('company_users')
          .select('company_id, role')
          .eq('user_id', data.user.id)
          .limit(1);
        
        const isCompany = companyUsers && companyUsers.length > 0;
        const hasIsCompanyMeta = data.user.user_metadata?.is_company === true || 
                                data.user.user_metadata?.is_company === 'true';
        
        // If user has is_company metadata but no company_users entry
        if (hasIsCompanyMeta && !isCompany) {
          toast({
            title: "Registrierung unvollständig",
            description: "Bitte vervollständigen Sie Ihre Unternehmensregistrierung.",
          });
          navigate('/unternehmensregistrierung?mode=complete');
          return;
        }
        
        // Check if there's a returnTo parameter (e.g., from job application)
        if (returnTo) {
          // Decode and navigate back to the original page
          const decodedReturnTo = decodeURIComponent(returnTo);
          navigate(decodedReturnTo);
          return;
        }
        
        // For company users, check if they need to complete company setup
        if (isCompany) {
          navigate('/unternehmen/startseite');
        } else {
          // Check if user has a profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();
          
          // Only redirect to dashboard if profile exists
          navigate(profile ? '/mein-bereich' : '/cv-generator');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(email)) {
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

    setIsAuthenticating(true);

    try {
      // Clean up auth state before signup
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out failed:', err);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile`,
          data: {
            role: role
          }
        }
      });

      if (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('User already registered')) {
          toast({
            title: "E-Mail bereits registriert",
            description: "Diese E-Mail-Adresse wird bereits verwendet. Bitte logge dich ein oder verwende eine andere E-Mail-Adresse.",
            variant: "destructive"
          });
          setActiveTab('login');
          setEmail('');
          return;
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "Das Passwort muss mindestens 6 Zeichen lang sein.";
        } else if (error.message.includes('Signup requires a valid password')) {
          errorMessage = "Bitte geben Sie ein gültiges Passwort ein.";
        }

        toast({
          title: "Registrierung fehlgeschlagen", 
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        // For company registrations, redirect to company signup
        if (role === 'company') {
          toast({
            title: "Bitte nutzen Sie die Firmen-Registrierung",
            description: "Sie werden weitergeleitet...",
          });
          setTimeout(() => navigate('/unternehmensregistrierung'), 1000);
          return;
        }

        // For applicant registrations
        if (data.user.email_confirmed_at) {
          toast({
            title: "Registrierung erfolgreich",
            description: "Jetzt können Sie Ihren Lebenslauf erstellen!",
          });
          window.location.href = '/cv-generator';
        } else {
          toast({
            title: "Registrierung erfolgreich", 
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
      setIsAuthenticating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="auth-page min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
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
          
          <h1 className="text-3xl font-bold">Anmelden oder Registrieren</h1>
          <p className="text-muted-foreground">
            Erstellen Sie ein kostenloses Konto oder melden Sie sich an
          </p>

          {/* Role Switcher */}
          <div className="flex justify-center mt-4">
            <ToggleGroup type="single" value={role} onValueChange={(v) => v && setRole(v as 'applicant'|'company')}>
              <ToggleGroupItem value="applicant" className="min-w-[140px]">Bewerber</ToggleGroupItem>
              <ToggleGroupItem value="company" className="min-w-[140px]">Unternehmen</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Auth Forms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Anmelden</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4 mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-Mail-Adresse</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ihre@email.com"
                      disabled={isAuthenticating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ihr Passwort"
                        disabled={isAuthenticating}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isAuthenticating}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4 mr-2" />
                    )}
                    {isAuthenticating ? 'Anmelden...' : 'Anmelden'}
                  </Button>

                  {/* Secondary CTA based on role */}
                  <div className="text-center text-sm text-muted-foreground">
                    {role === 'company' ? (
                      <>
                        Noch kein Unternehmenskonto?{' '}
                        <button type="button" className="underline" onClick={() => navigate('/unternehmensregistrierung')}>Jetzt erstellen</button>
                      </>
                    ) : (
                      <>
                        Noch kein Konto?{' '}
                        <button type="button" className="underline" onClick={() => navigate('/cv-generator')}>Jetzt erstellen</button>
                      </>
                    )}
                  </div>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-Mail-Adresse</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ihre@email.com"
                      disabled={isAuthenticating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mindestens 8 Zeichen"
                        disabled={isAuthenticating}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isAuthenticating}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Passwort wiederholen"
                        disabled={isAuthenticating}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isAuthenticating}
                      >
                        {showConfirmPassword ? (
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
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {isAuthenticating ? 'Registrieren...' : 'Jetzt Lebenslauf erstellen'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Mit der Anmeldung stimmen Sie unseren{' '}
            <Link to="/agb" className="underline hover:text-foreground">
              AGB
            </Link>{' '}
            und{' '}
            <Link to="/datenschutz" className="underline hover:text-foreground">
              Datenschutzbestimmungen
            </Link>{' '}
            zu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;