import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";
import { BranchSelector } from "@/components/Company/BranchSelector";
import { TargetGroupSelector } from "@/components/Company/TargetGroupSelector";
import { PriceCalculator } from "@/components/Company/PriceCalculator";

interface OnboardingData {
  // Company Info
  companyName: string;
  companySize: string;
  location: string; // Format: City, Country
  website: string;
  contactPerson: string;
  phone: string;
  
  // Business Details
  industries: string[];
  targetGroups: string[];
  
  // Auth (at the end)
  email: string; // also used as primary contact email
  password: string;
  confirmPassword: string;
}

export default function CompanyOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    companyName: "",
    companySize: "",
    location: "",
    website: "",
    contactPerson: "",
    phone: "",
    industries: [],
    targetGroups: [],
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const companySizes = [
    "1-10",
    "11-25", 
    "26-50",
    "51-100",
    "101-250",
    "250+"
  ];

  const updateData = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.companyName.trim()) newErrors.companyName = "Unternehmensname ist erforderlich";
    if (!data.companySize) newErrors.companySize = "Unternehmensgröße ist erforderlich";
    if (!data.location.trim()) newErrors.location = "Standort ist erforderlich";
    if (data.location && !data.location.includes(',')) newErrors.location = "Bitte Stadt und Land angeben (z.B. Berlin, Deutschland)";
    if (!data.contactPerson.trim()) newErrors.contactPerson = "Ansprechpartner ist erforderlich";
    if (!data.phone.trim()) newErrors.phone = "Telefonnummer ist erforderlich";
    if (data.industries.length === 0) newErrors.industries = "Mindestens eine Branche auswählen";
    if (data.targetGroups.length === 0) newErrors.targetGroups = "Mindestens eine Zielgruppe auswählen";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.email.trim()) newErrors.email = "E-Mail ist erforderlich";
    if (!data.password) newErrors.password = "Passwort ist erforderlich";
    if (data.password !== data.confirmPassword) newErrors.confirmPassword = "Passwörter stimmen nicht überein";
    if (!agreedToTerms) newErrors.terms = "Nutzungsbedingungen müssen akzeptiert werden";
    if (!agreedToPrivacy) newErrors.privacy = "Datenschutzerklärung muss akzeptiert werden";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Continue = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    } else {
      toast({ title: "Bitte korrigieren Sie die Fehler", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      toast({ title: "Bitte korrigieren Sie die Fehler", variant: "destructive" });
      return;
    }

    // Parse city and country from location
    const [cityRaw, countryRaw] = data.location.split(',').map((s) => s?.trim());
    const city = cityRaw || '';
    const country = countryRaw || '';

    if (!city || !country) {
      setErrors((prev) => ({ ...prev, location: "Bitte Stadt und Land angeben (z.B. Berlin, Deutschland)" }));
      toast({ title: "Standort unvollständig", description: "Bitte Stadt und Land angeben.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Duplicate company check by primary email
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .ilike('primary_email', data.email)
        .maybeSingle();

      if (existingCompany) {
        toast({
          title: 'Unternehmen existiert bereits',
          description: 'Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail.',
          variant: 'destructive'
        });
        return;
      }

      // Create user account first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: `${window.location.origin}/company/dashboard` }
      });
      if (authError) throw new Error(`Registrierung fehlgeschlagen: ${authError.message}`);
      if (!authData.user) throw new Error('Benutzer konnte nicht erstellt werden');

      // Retry helper with exponential backoff
      const attemptCreate = async (attempt = 1): Promise<string> => {
        try {
          const { data: companyId, error } = await supabase.rpc('create_company_account', {
            p_name: data.companyName,
            p_primary_email: data.email,
            p_industry: data.industries.join(', '),
            p_city: city,
            p_country: country,
            p_size_range: data.companySize,
            p_contact_person: data.contactPerson,
            p_phone: data.phone,
            p_website: data.website || null,
            p_created_by: authData.user!.id
          });
          if (error) throw error;
          if (!companyId) throw new Error('Keine Firmen-ID zurückgegeben');
          return companyId as unknown as string;
        } catch (err: any) {
          if (attempt >= 3) throw err;
          const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms, 2000ms
          await new Promise((r) => setTimeout(r, delay));
          return attemptCreate(attempt + 1);
        }
      };

      // Create company via RPC
      const companyId = await attemptCreate(1);

      // Verify round-trip
      const { data: stored, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      if (fetchError) throw fetchError;

      const expected = {
        name: data.companyName,
        primary_email: data.email,
        industry: data.industries.join(', '),
        main_location: city,
        country: country,
        size_range: data.companySize,
        contact_person: data.contactPerson,
        phone: data.phone,
        website_url: data.website || null
      };

      const needsCorrection = Object.entries(expected).some(([k, v]) => (stored as any)[k] !== v);
      if (needsCorrection) {
        const { error: fixError } = await supabase
          .from('companies')
          .update(expected)
          .eq('id', companyId);
        if (fixError) throw fixError;
      }

      toast({
        title: 'Unternehmen erfolgreich erstellt!',
        description: 'Weiterleitung zum Dashboard...'
      });

      navigate('/unternehmen/startseite');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      // Offline/Network handling: persist payload for retry
      const pending = {
        ts: Date.now(),
        payload: { ...data }
      };
      try { localStorage.setItem('company_onboarding_pending', JSON.stringify(pending)); } catch {}

      toast({ 
        title: 'Fehler beim Erstellen', 
        description: 'Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Endlich passende Mitarbeiter finden</h1>
              <p className="text-muted-foreground">Lege jetzt los - kostenfrei. Keine Kreditkarte erforderlich.</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {currentStep === 1 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="space-y-6">
                  {/* Company Basic Info */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Unternehmensdaten</h2>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Unternehmensname *</Label>
                        <Input
                          id="companyName"
                          value={data.companyName}
                          onChange={(e) => updateData('companyName', e.target.value)}
                          placeholder="Ihr Unternehmensname"
                          className={errors.companyName ? "border-destructive" : ""}
                        />
                        {errors.companyName && (
                          <p className="text-sm text-destructive">{errors.companyName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companySize">Unternehmensgröße *</Label>
                        <Select value={data.companySize} onValueChange={(value) => updateData('companySize', value)}>
                          <SelectTrigger className={errors.companySize ? "border-destructive" : ""}>
                            <SelectValue placeholder="Wählen Sie die Größe" />
                          </SelectTrigger>
                          <SelectContent>
                            {companySizes.map(size => (
                              <SelectItem key={size} value={size}>{size} Mitarbeiter</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.companySize && (
                          <p className="text-sm text-destructive">{errors.companySize}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Standort *</Label>
                        <Input
                          id="location"
                          value={data.location}
                          onChange={(e) => updateData('location', e.target.value)}
                          placeholder="Stadt, Land (z.B. Berlin, Deutschland)"
                          className={errors.location ? "border-destructive" : ""}
                        />
                        {errors.location && (
                          <p className="text-sm text-destructive">{errors.location}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website (optional)</Label>
                        <Input
                          id="website"
                          value={data.website}
                          onChange={(e) => updateData('website', e.target.value)}
                          placeholder="https://www.ihr-unternehmen.de"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Ansprechpartner *</Label>
                        <Input
                          id="contactPerson"
                          value={data.contactPerson}
                          onChange={(e) => updateData('contactPerson', e.target.value)}
                          placeholder="Vollständiger Name"
                          className={errors.contactPerson ? "border-destructive" : ""}
                        />
                        {errors.contactPerson && (
                          <p className="text-sm text-destructive">{errors.contactPerson}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon *</Label>
                        <Input
                          id="phone"
                          value={data.phone}
                          onChange={(e) => updateData('phone', e.target.value)}
                          placeholder="+49 30 1234567"
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Branch Selection */}
                  <BranchSelector
                    selectedBranches={data.industries}
                    onSelectionChange={(branches) => updateData('industries', branches)}
                    error={errors.industries}
                  />

                  {/* Target Groups */}
                  <TargetGroupSelector
                    selectedGroups={data.targetGroups}
                    onSelectionChange={(groups) => updateData('targetGroups', groups)}
                    error={errors.targetGroups}
                  />

                  <Button 
                    onClick={handleStep1Continue}
                    className="w-full h-12 text-lg font-semibold"
                    size="lg"
                  >
                    Account erstellen
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column - Price Calculator */}
            <div className="lg:col-span-1">
              <PriceCalculator
                selectedGroups={data.targetGroups}
                selectedBranches={data.industries}
                companyName={data.companyName}
                companySize={data.companySize}
              />
            </div>
          </div>
        ) : (
          /* Step 2 - Authentication */
          <div className="max-w-md mx-auto">
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Nächster Schritt</h2>
                <p className="text-muted-foreground">Account-Erstellung mit E-Mail oder Google</p>
              </div>

              <div className="space-y-4">
                <Button variant="outline" className="w-full h-12" disabled>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Fortfahren mit Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ODER</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail-Adresse *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => updateData('email', e.target.value)}
                      placeholder="unternehmen@beispiel.de"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={data.password}
                      onChange={(e) => updateData('password', e.target.value)}
                      placeholder="Mindestens 6 Zeichen"
                      className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={data.confirmPassword}
                      onChange={(e) => updateData('confirmPassword', e.target.value)}
                      placeholder="Passwort wiederholen"
                      className={errors.confirmPassword ? "border-destructive" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* GDPR & Terms Checkboxes */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      Ich akzeptiere die{" "}
                      <span className="text-primary cursor-pointer underline">
                        Nutzungsbedingungen
                      </span>
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-destructive ml-6">{errors.terms}</p>
                  )}

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={agreedToPrivacy}
                      onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="privacy" className="text-sm leading-relaxed">
                      Ich akzeptiere die{" "}
                      <span className="text-primary cursor-pointer underline">
                        Datenschutzerklärung
                      </span>
                    </Label>
                  </div>
                  {errors.privacy && (
                    <p className="text-sm text-destructive ml-6">{errors.privacy}</p>
                  )}
                </div>

                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="w-full h-12 text-lg font-semibold mt-6"
                  size="lg"
                >
                  {loading ? "Unternehmen wird erstellt..." : "Unternehmen erstellen"}
                </Button>

                <div className="bg-blue-100 border border-blue-400 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-800">
                    <strong>Hinweis:</strong> Nach der Registrierung erhalten Sie eine E-Mail zur Bestätigung. 
                    Sie können jedoch bereits sofort mit Ihrem Unternehmensprofil beginnen.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Mit dem Start erklärst du dich mit unseren Nutzungsbedingungen einverstanden.
                </p>

                <div className="text-center mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(1)}
                    className="text-sm"
                  >
                    ← Zurück zu den Unternehmensdaten
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}