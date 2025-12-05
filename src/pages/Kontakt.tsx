import React, { useEffect, useState } from 'react';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Mail, Phone, MapPin, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackPageView } from '@/lib/telemetry';

export default function Kontakt() {
  const seoData = useSEO({
    title: 'Kontakt – BeVisiblle',
    description: 'Kontaktiere uns für Fragen, Feedback oder Support. Wir helfen dir gerne weiter.',
    keywords: ['Kontakt', 'Support', 'Anfrage', 'BeVisiblle']
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    trackPageView('Kontakt');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <SEOHead {...seoData} />
      <CareerHubHeader />
      <BaseLayout>
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen pt-24">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
              <Breadcrumbs items={[
                { name: 'Home', url: '/' },
                { name: 'Kontakt', url: '/kontakt' }
              ]} />
            </div>

            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Kontaktiere uns
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Hast du Fragen, Feedback oder brauchst du Unterstützung? Wir sind für dich da.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Kontaktinformationen</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Mail className="h-6 w-6 text-[#5170ff]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">E-Mail</h3>
                        <a href="mailto:info@bevisiblle.de" className="text-gray-600 hover:text-[#5170ff] transition-colors">
                          info@bevisiblle.de
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Phone className="h-6 w-6 text-[#5170ff]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Telefon</h3>
                        <a href="tel:+49123456789" className="text-gray-600 hover:text-[#5170ff] transition-colors">
                          +49 (0) 123 456 789
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <MapPin className="h-6 w-6 text-[#5170ff]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Adresse</h3>
                        <p className="text-gray-600">
                          BeVisiblle GmbH<br />
                          Musterstraße 123<br />
                          12345 Berlin, Deutschland
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Öffnungszeiten</h3>
                  <div className="space-y-2 text-gray-600">
                    <p>Montag - Freitag: 9:00 - 18:00 Uhr</p>
                    <p>Samstag - Sonntag: Geschlossen</p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Nachricht senden</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all"
                      placeholder="Dein Name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-Mail *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all"
                      placeholder="deine@email.de"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Betreff *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="allgemein">Allgemeine Anfrage</option>
                      <option value="support">Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="unternehmen">Für Unternehmen</option>
                      <option value="partnerschaft">Partnerschaft</option>
                      <option value="sonstiges">Sonstiges</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Nachricht *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all resize-none"
                      placeholder="Deine Nachricht..."
                    />
                  </div>

                  {submitStatus === 'success' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                      Vielen Dank! Deine Nachricht wurde erfolgreich gesendet. Wir melden uns schnellstmöglich bei dir.
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                      Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#5170ff] hover:bg-[#3f5bff] text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Nachricht senden
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
}

