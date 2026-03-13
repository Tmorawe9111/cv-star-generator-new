import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trackPageView, trackButtonClick } from '@/lib/telemetry';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, Shield, Lock, Users } from 'lucide-react';

export default function Gesundheitswesen() {
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView('Gesundheitswesen');
    
    const eventData = {
      event_type: 'page_view' as const,
      event_name: 'Gesundheitswesen Landing Page',
      user_agent: navigator.userAgent,
      referrer: document.referrer || undefined,
      page_url: window.location.href,
      page_path: window.location.pathname,
      metadata: {
        source: 'reddit',
        campaign: 'pflege_lite',
      },
    };
    
    supabase
      .from('analytics_events')
      .insert([eventData])
      .then(({ error }) => {
        if (error) console.error('[Analytics] Failed to save event:', error);
      });
    
    const title = 'Pflege: Jobwechsel ohne echte Einblicke | BeVisiblle';
    const description = 'Kurzes Profil erstellen und Zugang zu Austausch & echten Einblicken erhalten – bevor du dich bewirbst.';
    
    document.title = title;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, []);

  const handleCTAClick = () => {
    trackButtonClick('Kurzes Profil erstellen (5 Minuten)', 'cta');
    
    const eventData = {
      event_type: 'button_click' as const,
      event_name: 'Kurzes Profil erstellen (5 Minuten)',
      button_label: 'Kurzes Profil erstellen (5 Minuten)',
      button_type: 'cta',
      user_agent: navigator.userAgent,
      referrer: document.referrer || undefined,
      page_url: window.location.href,
      page_path: window.location.pathname,
      metadata: {
        source: 'reddit',
        campaign: 'pflege_lite',
        action: 'cta_click',
      },
    };
    
    supabase
      .from('analytics_events')
      .insert([eventData])
      .then(({ error }) => {
        if (error) console.error('[Analytics] Failed to save CTA click:', error);
      });
    
    navigate('/cv-generator?utm_source=reddit&utm_medium=cpc&utm_campaign=pflege_lite&utm_content=lite_lp');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal Header */}
      <header className="w-full">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img 
              src="/assets/Logo_visiblle_transparent.png" 
              alt="BeVisiblle" 
              className="h-6 w-6 object-contain"
            />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-gray-900">
              BeVisib<span className="text-[#5170ff]">ll</span>e
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-5 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="w-full max-w-7xl mx-auto">
          {/* Hero Headline + Subheadline - Centered */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h1 className="text-[32px] sm:text-[42px] md:text-[56px] lg:text-[64px] font-semibold text-gray-900 leading-[1.05] tracking-[-0.02em] mb-4 sm:mb-5">
              Jobwechsel ohne echte Einblicke
              <br />
              <span className="text-gray-500 font-normal">ist ein Risiko.</span>
            </h1>
            <p className="text-[17px] sm:text-[19px] md:text-[21px] text-gray-600 leading-[1.47059] font-light max-w-[680px] mx-auto">
              Viele merken erst nach dem Start, dass Alltag, Team und Erwartungen ganz anders sind.
            </p>
          </div>

          {/* Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1.85fr] gap-8 lg:gap-16 items-start mb-8 sm:mb-10 -mt-4 sm:-mt-6 lg:-mt-8">
            {/* Left: Content */}
            <div className="space-y-5 sm:space-y-6 order-2 lg:order-1">
              {/* Benefits */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-[22px] h-[22px] rounded-full bg-[#5170ff]/8 flex items-center justify-center">
                      <Check className="h-[14px] w-[14px] text-[#5170ff]" strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="text-[15px] sm:text-[16px] text-gray-700 leading-[1.47059] pt-[2px]">
                    echte Einblicke von Mitarbeitenden
                  </p>
                </div>
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-[22px] h-[22px] rounded-full bg-[#5170ff]/8 flex items-center justify-center">
                      <Check className="h-[14px] w-[14px] text-[#5170ff]" strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="text-[15px] sm:text-[16px] text-gray-700 leading-[1.47059] pt-[2px]">
                    unabhängiger Austausch
                  </p>
                </div>
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-[22px] h-[22px] rounded-full bg-[#5170ff]/8 flex items-center justify-center">
                      <Check className="h-[14px] w-[14px] text-[#5170ff]" strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="text-[15px] sm:text-[16px] text-gray-700 leading-[1.47059] pt-[2px]">
                    Orientierung vor dem Bewerben
                  </p>
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex -space-x-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i + 10}`}
                      alt={`Profil ${i}`}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[2.5px] border-white shadow-sm object-cover ring-[0.5px] ring-gray-200/50"
                    />
                  ))}
                </div>
                <span className="text-[13px] sm:text-[14px] font-medium text-gray-600 tracking-[-0.01em]">
                  Über 500 Pfleger bereits dabei
                </span>
              </div>

              {/* CTA */}
              <div className="pt-2 space-y-2.5">
                <Button
                  onClick={handleCTAClick}
                  size="lg"
                  className="w-full sm:w-auto px-9 sm:px-11 py-[14px] sm:py-[16px] text-[15px] sm:text-[16px] font-semibold bg-[#5170ff] hover:bg-[#3d5ae8] text-white rounded-[12px] shadow-[0_4px_14px_0_rgba(81,112,255,0.25)] hover:shadow-[0_6px_20px_0_rgba(81,112,255,0.35)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] tracking-[-0.01em]"
                  data-source="reddit"
                  data-campaign="pflege_lite"
                >
                  Kurzes Profil erstellen (5 Minuten)
                </Button>
                
                <p className="text-[13px] sm:text-[14px] text-gray-500 font-light tracking-[-0.01em]">
                  Kostenlos · keine Bewerbung · kein Verkauf
                </p>
              </div>
            </div>

            {/* Right: Image */}
            <div className="order-1 lg:order-2 flex items-start justify-center lg:justify-end">
              <div className="relative w-full max-w-[600px] lg:max-w-none">
                <img 
                  src="/assets/hero-healthcare-cropped.png" 
                  alt="Pflegekräfte bei BeVisiblle" 
                  className="w-full h-auto object-contain"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 text-[13px] sm:text-[14px] text-gray-600 pt-6 border-t border-gray-200/60">
            <div className="flex items-center gap-2.5">
              <Shield className="h-[16px] w-[16px] text-emerald-600" strokeWidth={2} />
              <span className="font-medium tracking-[-0.01em]">DSGVO-konform</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Lock className="h-[16px] w-[16px] text-blue-600" strokeWidth={2} />
              <span className="font-medium tracking-[-0.01em]">Deine Daten bleiben privat</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="h-[16px] w-[16px] text-purple-600" strokeWidth={2} />
              <span className="font-medium tracking-[-0.01em]">Keine Weitergabe</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 py-5">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-[13px] sm:text-[14px] text-gray-500">
            <Link 
              to="/datenschutz" 
              className="hover:text-gray-900 transition-colors font-medium tracking-[-0.01em]"
            >
              Datenschutz
            </Link>
            <span className="hidden sm:inline text-gray-300">·</span>
            <Link 
              to="/impressum" 
              className="hover:text-gray-900 transition-colors font-medium tracking-[-0.01em]"
            >
              Impressum
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
