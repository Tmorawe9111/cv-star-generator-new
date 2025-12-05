/**
 * Support Page - Minimalistischer Apple-Style
 */

import React, { useState } from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Mail, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const seoData = useSEO({
    title: 'Support kontaktieren – BeVisiblle',
    description: 'Kontaktiere unser Support-Team. Wir helfen dir gerne bei Fragen zu BeVisiblle weiter.',
    keywords: ['Support', 'Kontakt', 'Hilfe', 'BeVisiblle']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Implement form submission
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Nachricht wurde gesendet! Wir melden uns schnellstmöglich bei dir.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
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
                { name: 'Support', url: '/support' }
              ]} />
            </div>

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Support kontaktieren
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Unser Team steht dir gerne zur Verfügung. Schicke uns eine Nachricht und wir melden uns schnellstmöglich.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Methods */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Mail className="h-6 w-6 text-[#5170ff]" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">E-Mail</h2>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Sende uns eine E-Mail und wir antworten innerhalb von 24 Stunden.
                  </p>
                  <a
                    href="mailto:support@bevisiblle.de"
                    className="text-[#5170ff] hover:text-blue-600 font-medium"
                  >
                    support@bevisiblle.de
                  </a>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MessageCircle className="h-6 w-6 text-[#5170ff]" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Hilfe-Center</h2>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Durchsuche unsere Hilfe-Artikel und finde schnelle Antworten.
                  </p>
                  <a
                    href="/hilfe"
                    className="text-[#5170ff] hover:text-blue-600 font-medium"
                  >
                    Zum Hilfe-Center →
                  </a>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Nachricht senden</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all"
                      placeholder="Dein Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all"
                      placeholder="deine@email.de"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Betreff
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all"
                      placeholder="Worum geht es?"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Nachricht
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all resize-none"
                      placeholder="Beschreibe dein Anliegen..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#5170ff] hover:bg-[#5170ff]/90 text-white rounded-full py-3 font-medium"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Wird gesendet...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Nachricht senden
                      </span>
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

