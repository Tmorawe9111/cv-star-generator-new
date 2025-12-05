import React, { useEffect, useState } from 'react';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { MessageSquare, Star, Heart, Lightbulb, Bug, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackPageView } from '@/lib/telemetry';

const feedbackTypes = [
  {
    id: 'feature',
    label: 'Feature-Vorschlag',
    icon: Lightbulb,
    description: 'Hast du eine Idee für eine neue Funktion?'
  },
  {
    id: 'bug',
    label: 'Fehler melden',
    icon: Bug,
    description: 'Hast du einen Fehler gefunden?'
  },
  {
    id: 'improvement',
    label: 'Verbesserungsvorschlag',
    icon: Star,
    description: 'Wie können wir uns verbessern?'
  },
  {
    id: 'general',
    label: 'Allgemeines Feedback',
    icon: Heart,
    description: 'Teile uns deine Meinung mit'
  }
];

export default function Feedback() {
  const seoData = useSEO({
    title: 'Feedback – BeVisiblle',
    description: 'Teile uns dein Feedback mit. Deine Meinung hilft uns, BeVisiblle zu verbessern.',
    keywords: ['Feedback', 'Verbesserung', 'Vorschlag', 'BeVisiblle']
  });

  const [formData, setFormData] = useState({
    type: '',
    email: '',
    message: '',
    rating: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    trackPageView('Feedback');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ type: '', email: '', message: '', rating: 0 });
      
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

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  return (
    <>
      <SEOHead {...seoData} />
      <CareerHubHeader />
      <BaseLayout>
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen pt-24">
          <div className="max-w-3xl mx-auto px-6 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
              <Breadcrumbs items={[
                { name: 'Home', url: '/' },
                { name: 'Feedback', url: '/feedback' }
              ]} />
            </div>

            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-[#5170ff]" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Dein Feedback ist uns wichtig
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Hilf uns, BeVisiblle besser zu machen. Jede Rückmeldung zählt!
              </p>
            </div>

            {/* Feedback Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              {/* Feedback Type */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Art des Feedbacks *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.type === type.id
                            ? 'border-[#5170ff] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${
                            formData.type === type.id ? 'text-[#5170ff]' : 'text-gray-400'
                          }`} />
                          <div>
                            <div className="font-semibold text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-500 mt-1">{type.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating */}
              {formData.type && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Wie zufrieden bist du mit BeVisiblle?
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingClick(rating)}
                        className={`p-2 rounded-lg transition-all ${
                          formData.rating >= rating
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Star className={`h-6 w-6 ${
                          formData.rating >= rating ? 'fill-current' : ''
                        }`} />
                      </button>
                    ))}
                    {formData.rating > 0 && (
                      <span className="ml-4 text-sm text-gray-600">
                        {formData.rating === 5 && 'Ausgezeichnet!'}
                        {formData.rating === 4 && 'Sehr gut!'}
                        {formData.rating === 3 && 'Gut'}
                        {formData.rating === 2 && 'Okay'}
                        {formData.rating === 1 && 'Verbesserungswürdig'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all"
                  placeholder="deine@email.de"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Falls wir Rückfragen haben, können wir dich kontaktieren.
                </p>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Dein Feedback *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={8}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff] focus:border-transparent transition-all resize-none"
                  placeholder="Teile uns deine Gedanken mit..."
                />
              </div>

              {submitStatus === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 mb-6">
                  Vielen Dank für dein Feedback! Es hilft uns sehr, BeVisiblle zu verbessern.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
                  Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !formData.type || !formData.message}
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
                    Feedback senden
                  </>
                )}
              </Button>
            </form>

            {/* Additional Info */}
            <div className="mt-12 text-center text-sm text-gray-600">
              <p>
                Wir lesen jedes Feedback und arbeiten kontinuierlich daran, BeVisiblle zu verbessern.
              </p>
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
}

