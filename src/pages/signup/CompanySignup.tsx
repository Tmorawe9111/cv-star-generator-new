import React, { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Mail, Phone, Globe, User, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CompanySignupFooter from "./CompanySignupFooter";
import { LocationAutocomplete } from "@/components/Company/LocationAutocomplete";
import { saveCompanyLocation } from "@/lib/location-utils";

function CompanySignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [usePassword, setUsePassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [allowUpdates, setAllowUpdates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get plan from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlan = urlParams.get('plan') || 'free';

  // Form state
  const [form, setForm] = useState({
    companyName: "",
    legalForm: "",
    industry: "",
    size: "",
    website: "",
    country: "DE", // Default: Deutschland
    city: "",
    adminFirst: "",
    adminLast: "",
    phone: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const isStep1Valid = () => {
    const required = ["companyName", "size", "country", "city", "adminFirst", "adminLast", "phone"] as const;
    const allFilled = required.every((k) => String(form[k]).trim().length > 0);
    return allFilled && agreeTerms && (form.country === 'DE' || form.country === 'AT' || form.country === 'CH');
  };

  const isStep2Valid = () => {
    const emailOk = /.+@.+\..+/.test(form.email);
    if (usePassword) {
      return (
        emailOk &&
        form.password.length >= 8 &&
        form.password === form.passwordConfirm
      );
    }
    return emailOk;
  };

  const onContinue = () => {
    if (step === 1 && isStep1Valid()) setStep(2);
  };

  const onBack = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async () => {
    if (!isStep2Valid()) return;
    setIsSubmitting(true);

    try {
      if (usePassword) {
        // Password-based signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/company/dashboard`,
            data: {
              first_name: form.adminFirst,
              last_name: form.adminLast,
              role: 'company-admin',
              is_company: true
            }
          }
        });

        if (authError) {
          toast({
            title: "Fehler bei der Registrierung",
            description: authError.message,
            variant: "destructive"
          });
          return;
        }

        // Use the database function to create company and link user
        if (authData.user) {
          // Map country code to full name
          const countryNames: Record<string, string> = {
            'DE': 'Deutschland',
            'AT': 'Österreich',
            'CH': 'Schweiz'
          };
          const countryName = countryNames[form.country] || form.country;

          const { data: companyId, error: companyError } = await supabase
            .rpc('create_company_account', {
              p_name: form.companyName,
              p_primary_email: form.email,
              p_city: form.city,
              p_country: countryName,
              p_size_range: form.size,
              p_contact_person: `${form.adminFirst} ${form.adminLast}`,
              p_phone: form.phone,
              p_created_by: authData.user.id,
              p_website: form.website || null,
              p_industry: form.industry || null
            });

          if (companyError) {
            console.error('Company creation error:', companyError);
            toast({
              title: "Fehler",
              description: companyError.message || "Unternehmenskonto konnte nicht erstellt werden.",
              variant: "destructive"
            });
            return;
          }

          // Update company with plan info and save location with coordinates
          if (companyId) {
            await supabase
              .from('companies')
              .update({
                selected_plan_id: selectedPlan,
                onboarding_completed: false  // Ensure onboarding is not completed
              })
              .eq('id', companyId);
            
            // Save location with coordinates if city is provided
            if (form.city) {
              await saveCompanyLocation(companyId, form.city);
            }
          }
        }

        toast({
          title: "Erfolgreich registriert!",
          description: "Sie werden zum Dashboard weitergeleitet...",
        });
        
        setTimeout(() => {
          navigate('/company/dashboard');
        }, 1500);

      } else {
        // Magic link signup - save company data to localStorage to be processed after email confirmation
        const countryNames: Record<string, string> = {
          'DE': 'Deutschland',
          'AT': 'Österreich',
          'CH': 'Schweiz'
        };
        const countryName = countryNames[form.country] || form.country;
        
        localStorage.setItem('pending_company_signup', JSON.stringify({
          companyName: form.companyName,
          industry: form.industry,
          size: form.size,
          city: form.city,
          country: countryName,
          website: form.website,
          phone: form.phone,
          contactPerson: `${form.adminFirst} ${form.adminLast}`,
          selectedPlan: selectedPlan
        }));

        const { error } = await supabase.auth.signInWithOtp({
          email: form.email,
          options: {
            emailRedirectTo: `${window.location.origin}/company/dashboard`,
            data: {
              first_name: form.adminFirst,
              last_name: form.adminLast,
              role: 'company-admin',
              is_company: true
            }
          }
        });

        if (error) {
          toast({
            title: "Fehler beim Versenden",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Magic Link versendet!",
          description: "Bitte überprüfen Sie Ihren Posteingang.",
        });
        
        setStep(3);
      }
    } catch (error: any) {
      toast({
        title: "Unerwarteter Fehler",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header from Company Landing */}
      <header className="fixed top-4 left-0 right-0 z-50">
        <nav className="mx-auto max-w-5xl px-4">
          <div className="bg-white/90 backdrop-blur rounded-full shadow-sm border px-3 py-2 h-14">
            <div className="flex items-center justify-between gap-2 h-full">
              <Link to="/" className="flex items-center gap-2 pl-1">
                <img src="/assets/Logo_visiblle-2.svg" alt="BeVisiblle" className="h-8 w-8" />
                <span className="font-semibold text-base">
                  BeVisib<span className="text-primary">ll</span>e
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link to="/cv-generator" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Lebenslauf
                </Link>
                <Link to="/company" className="rounded-md px-3 py-2 text-sm font-medium text-[#5170ff] hover:bg-blue-50">
                  Unternehmen
                </Link>
                <Link to="/about" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Über uns
                </Link>
              </nav>

              <div className="flex items-center gap-2">
                <Link to="/auth" className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            {/* Left: Image & Content */}
            <div className="relative">
              <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  Recruiting, das zu <span className="text-[#5170ff]">Ihnen</span> passt.
                </h1>
                <p className="text-lg text-gray-600">
                  Erstellen Sie Ihr Unternehmensprofil, laden Sie Ihr Team ein und kontaktieren Sie passende Kandidat:innen direkt.
                </p>
              </div>
              <img 
                src="/assets/company-mainhero-2.png" 
                alt="Digitale Vernetzung" 
                className="w-full h-auto rounded-2xl"
              />
            </div>

            {/* Right: Form */}
            <div className="bg-white rounded-2xl shadow-xl border p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Jetzt registrieren</h2>
                <p className="text-sm text-gray-500 mt-1">2 Schritte · Ihre Angaben können später bearbeitet werden</p>
              </div>
              
              <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm">
                <ProgressDot active={step >= 1} label="Unternehmen" />
                <div className="h-px flex-1 bg-neutral-200" />
                <ProgressDot active={step >= 2} label="Bestätigung" />
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Firmenname" icon={<Building2 size={16} />}>
                      <Input className="pl-10" placeholder="z. B. Müller GmbH" value={form.companyName} onChange={update("companyName")} />
                    </Field>
                    <Field label="Rechtsform (optional)">
                      <Input placeholder="GmbH, AG, e. K." value={form.legalForm} onChange={update("legalForm")} />
                    </Field>
                    <Field label="Unternehmensgröße">
                      <Select onValueChange={(v) => setForm({ ...form, size: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1–10 Mitarbeiter</SelectItem>
                          <SelectItem value="11-25">11–25 Mitarbeiter</SelectItem>
                          <SelectItem value="26-50">26–50 Mitarbeiter</SelectItem>
                          <SelectItem value="51-100">51–100 Mitarbeiter</SelectItem>
                          <SelectItem value="101-250">101–250 Mitarbeiter</SelectItem>
                          <SelectItem value="250+">250+ Mitarbeiter</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Website (optional)" icon={<Globe size={16} />}>
                      <Input className="pl-10" placeholder="https://" value={form.website} onChange={update("website")} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Land">
                      <Select 
                        value={form.country} 
                        onValueChange={(value) => {
                          setForm({ ...form, country: value, city: "" }); // Reset city when country changes
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Land auswählen">
                            {form.country && (
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {form.country === 'DE' ? '🇩🇪' : form.country === 'AT' ? '🇦🇹' : '🇨🇭'}
                                </span>
                                <span>
                                  {form.country === 'DE' ? 'Deutschland' : form.country === 'AT' ? 'Österreich' : 'Schweiz'}
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DE">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🇩🇪</span>
                              <span>Deutschland</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="AT">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🇦🇹</span>
                              <span>Österreich</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="CH">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🇨🇭</span>
                              <span>Schweiz</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Stadt (PLZ & Ort)">
                      <LocationAutocomplete
                        value={form.city}
                        onChange={(value) => setForm({ ...form, city: value })}
                        placeholder={
                          form.country === 'DE' 
                            ? "z. B. 10115 Berlin oder 101 (3 Ziffern für PLZ)" 
                            : "Stadt eingeben"
                        }
                        country={form.country}
                        disabled={!form.country}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Admin – Vorname" icon={<User size={16} />}>
                      <Input className="pl-10" placeholder="Vorname" value={form.adminFirst} onChange={update("adminFirst")} />
                    </Field>
                    <Field label="Admin – Nachname">
                      <Input placeholder="Nachname" value={form.adminLast} onChange={update("adminLast")} />
                    </Field>
                    <Field label="Telefon" icon={<Phone size={16} />}>
                      <Input className="pl-10" placeholder="z. B. +49 160 123456" value={form.phone} onChange={update("phone")} />
                    </Field>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} />
                      <span>
                        Ich akzeptiere die <a className="underline" href="/agb" target="_blank">AGB</a> und <a className="underline" href="/datenschutz" target="_blank">Datenschutzbestimmungen</a>.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-neutral-700">
                      <Checkbox checked={allowUpdates} onCheckedChange={(v) => setAllowUpdates(!!v)} />
                      <span>Ich möchte Updates & Produktinfos erhalten (optional).</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>Abbrechen</Button>
                    <Button disabled={!isStep1Valid()} onClick={onContinue}>
                      Weiter <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="rounded-xl border bg-neutral-50 p-4 text-sm text-neutral-700">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5" />
                      <p>
                        Fast geschafft! Bestätigen Sie Ihre geschäftliche E‑Mail, um den Account zu aktivieren
                        {usePassword ? " und ein Passwort zu setzen." : ". Wir senden einen sicheren Magic‑Link an Ihre E‑Mail."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Geschäftliche E‑Mail" icon={<Mail size={16} />}>
                      <Input className="pl-10" placeholder="name@firma.de" value={form.email} onChange={update("email")} disabled={isSubmitting} />
                    </Field>
                    {usePassword && (
                      <Field label="Passwort" icon={<Lock size={16} />}>
                        <Input className="pl-10" type="password" placeholder="mind. 8 Zeichen" value={form.password} onChange={update("password")} disabled={isSubmitting} />
                      </Field>
                    )}
                    {usePassword && (
                      <Field label="Passwort bestätigen">
                        <Input type="password" placeholder="Wiederholen" value={form.passwordConfirm} onChange={update("passwordConfirm")} disabled={isSubmitting} />
                      </Field>
                    )}
                  </div>

                  <div className="text-sm text-neutral-600">
                    {usePassword ? (
                      <button className="underline" onClick={() => setUsePassword(false)} disabled={isSubmitting}>Lieber ohne Passwort anmelden (Magic‑Link)</button>
                    ) : (
                      <button className="underline" onClick={() => setUsePassword(true)} disabled={isSubmitting}>Ich möchte ein Passwort verwenden</button>
                    )}
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
                    </Button>
                    <Button disabled={!isStep2Valid() || isSubmitting} onClick={onSubmit}>
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Wird verarbeitet...
                        </>
                      ) : (
                        usePassword ? "Konto erstellen" : "Magic‑Link senden"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">E-Mail versendet!</h3>
                    <p className="text-neutral-600">
                      Wir haben Ihnen einen Magic-Link an <strong>{form.email}</strong> gesendet.
                    </p>
                    <p className="text-neutral-600 mt-2">
                      Bitte überprüfen Sie Ihren Posteingang und klicken Sie auf den Link, um Ihr Konto zu aktivieren.
                    </p>
                  </div>
                  <div className="text-sm text-neutral-500">
                    <p>Keine E-Mail erhalten?</p>
                    <button 
                      className="underline text-primary mt-1"
                      onClick={() => setStep(2)}
                    >
                      Erneut versuchen
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      <CompanySignupFooter />
    </div>
  );
}

function Field({ label, children, icon }: { label: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-neutral-700">{label}</Label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10 pointer-events-none">{icon}</div>}
        {children}
      </div>
    </div>
  );
}

function ProgressDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${active ? "bg-violet-600" : "bg-neutral-300"}`} />
      <span className={`text-xs ${active ? "text-neutral-900" : "text-neutral-400"}`}>{label}</span>
    </div>
  );
}

export default CompanySignup;
