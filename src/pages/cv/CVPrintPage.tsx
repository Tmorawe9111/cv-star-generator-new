import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import BerlinLayout from '@/components/cv-layouts/BerlinLayout';
import MuenchenLayout from '@/components/cv-layouts/MuenchenLayout';
import HamburgLayout from '@/components/cv-layouts/HamburgLayout';
import KoelnLayout from '@/components/cv-layouts/KoelnLayout';
import FrankfurtLayout from '@/components/cv-layouts/FrankfurtLayout';
import DuesseldorfLayout from '@/components/cv-layouts/DuesseldorfLayout';
import StuttgartLayout from '@/components/cv-layouts/StuttgartLayout';
import DresdenLayout from '@/components/cv-layouts/DresdenLayout';
import LeipzigLayout from '@/components/cv-layouts/LeipzigLayout';
import '@/styles/cv.css';

export default function CVPrintPage() {
  const [searchParams] = useSearchParams();
  const [cvData, setCvData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const layoutId = Number(searchParams.get('layout')) || 1;
  const userId = searchParams.get('userId');

  useEffect(() => {
    const loadProfile = async () => {
      console.log('🔵 CVPrintPage: Loading profile for userId:', userId);
      
      if (!userId) {
        console.error('❌ CVPrintPage: No userId provided');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔵 CVPrintPage: Fetching profile from Supabase...');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('❌ CVPrintPage: Error fetching profile:', error);
          throw error;
        }

        console.log('✅ CVPrintPage: Profile loaded:', profile);

        if (profile) {
          // Helper function to parse JSONB fields
          const parseJsonField = (field: any) => {
            if (field === null || field === undefined) return null;
            if (typeof field === 'string') {
              try {
                return JSON.parse(field);
              } catch {
                return field;
              }
            }
            if (Array.isArray(field)) return field;
            return field;
          };

          // Parse JSONB fields
          const parsedSchulbildung = parseJsonField(profile.schulbildung) || [];
          const parsedBerufserfahrung = parseJsonField(profile.berufserfahrung) || [];
          const parsedSprachen = parseJsonField(profile.sprachen) || [];
          const parsedFaehigkeiten = parseJsonField(profile.faehigkeiten) || [];

          // Convert profile to CVData format
          const cvData = {
            vorname: profile.vorname,
            nachname: profile.nachname,
            telefon: profile.telefon,
            email: profile.email,
            strasse: profile.strasse,
            hausnummer: profile.hausnummer,
            plz: profile.plz,
            ort: profile.ort,
            geburtsdatum: profile.geburtsdatum ? new Date(profile.geburtsdatum) : undefined,
            profilbild: profile.avatar_url,
            avatar_url: profile.avatar_url,
            has_drivers_license: profile.has_drivers_license,
            driver_license_class: profile.driver_license_class,
            status: profile.status,
            branche: profile.branche,
            ueberMich: profile.uebermich || profile.bio,
            schulbildung: parsedSchulbildung,
            berufserfahrung: parsedBerufserfahrung,
            sprachen: parsedSprachen,
            faehigkeiten: parsedFaehigkeiten,
            qualifikationen: [],
            zertifikate: [],
            weiterbildung: [],
            interessen: []
          };
          console.log('✅ CVPrintPage: CV data prepared:', cvData);
          setCvData(cvData);
        } else {
          console.error('❌ CVPrintPage: No profile data returned');
        }
      } catch (error) {
        console.error('❌ CVPrintPage: Error loading profile:', error);
      } finally {
        setIsLoading(false);
        console.log('🔵 CVPrintPage: Loading complete');
      }
    };

    loadProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Keine CV-Daten gefunden</p>
      </div>
    );
  }

  const LayoutComponent =
    layoutId === 2 ? MuenchenLayout :
    layoutId === 3 ? HamburgLayout :
    layoutId === 4 ? KoelnLayout :
    layoutId === 5 ? FrankfurtLayout :
    layoutId === 6 ? DuesseldorfLayout :
    layoutId === 7 ? StuttgartLayout :
    layoutId === 8 ? DresdenLayout :
    layoutId === 9 ? LeipzigLayout :
    BerlinLayout;

  return (
    <div className="cv-print-container">
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .cv-print-container {
            width: 210mm;
            min-height: 297mm;
          }
        }
        .cv-print-container {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          padding: 0;
        }
      `}</style>
      <article 
        data-cv-preview 
        data-variant="a4" 
        className="cv-a4-page bg-white text-foreground"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        <LayoutComponent data={cvData} />
      </article>
    </div>
  );
}
