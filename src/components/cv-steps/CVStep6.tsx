
import React, { useState, useEffect, useRef } from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';


// A4 layout variants - 9 City Layouts
import BerlinLayout from '@/components/cv-layouts/BerlinLayout';
import MuenchenLayout from '@/components/cv-layouts/MuenchenLayout';
import HamburgLayout from '@/components/cv-layouts/HamburgLayout';
import KoelnLayout from '@/components/cv-layouts/KoelnLayout';
import FrankfurtLayout from '@/components/cv-layouts/FrankfurtLayout';
import DuesseldorfLayout from '@/components/cv-layouts/DuesseldorfLayout';
import StuttgartLayout from '@/components/cv-layouts/StuttgartLayout';
import DresdenLayout from '@/components/cv-layouts/DresdenLayout';
import LeipzigLayout from '@/components/cv-layouts/LeipzigLayout';
import { mapFormDataToCVData } from '@/components/cv-layouts/mapFormDataToCVData';
import { cn } from '@/lib/utils';

const CVStep6 = () => {
  const { formData, setCurrentStep, isLayoutEditMode, setLayoutEditMode } = useCVForm();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  // Calculate optimal scale to fit CV in viewport - maximize size, minimize white space
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;
      
      // A4 dimensions: 210mm x 297mm
      // At 96 DPI: ~794px x 1123px
      const a4Width = 794;
      const a4Height = 1123;
      
      // Calculate scale to fit both width and height
      const scaleX = containerWidth / a4Width;
      const scaleY = containerHeight / a4Height;
      
      // Use the smaller scale to ensure everything fits, maximize to 99.5% to minimize white space
      const optimalScale = Math.min(scaleX, scaleY) * 0.995; // 99.5% to maximize CV size
      
      setScale(Math.max(0.25, Math.min(optimalScale, 1))); // Clamp between 0.25 and 1
    };

    calculateScale();
    // Use ResizeObserver for more accurate measurements
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', calculateScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, []);
  const getBrancheTitle = () => {
    switch (formData.branche) {
      case 'handwerk': return 'Handwerk';
      case 'it': return 'IT & Technik';
      case 'gesundheit': return 'Gesundheit & Pflege';
      case 'buero': return 'Büro & Verwaltung';
      case 'verkauf': return 'Verkauf & Handel';
      case 'gastronomie': return 'Gastronomie';
      case 'bau': return 'Bau & Architektur';
      default: return '';
    }
  };

  const getStatusTitle = () => {
    switch (formData.status) {
      case 'schueler': return 'Schüler/in';
      case 'azubi': return 'Auszubildende/r';
      case 'fachkraft': return 'Fachkraft';
      default: return '';
    }
  };

  const getLayoutName = () => {
    switch (formData.layout) {
      case 1: return 'Berlin';
      case 2: return 'München';
      case 3: return 'Hamburg';
      case 4: return 'Köln';
      case 5: return 'Frankfurt';
      case 6: return 'Düsseldorf';
      case 7: return 'Stuttgart';
      case 8: return 'Dresden';
      case 9: return 'Leipzig';
      default: return 'Berlin';
    }
  };

  const handleBackToLayout = () => {
    setCurrentStep(5);
  };

  const handleFinish = async () => {
    if (isLayoutEditMode && profile) {
      try {
        // Save the selected layout to the user's profile
        const { error } = await supabase
          .from('profiles')
          .update({ layout: formData.layout })
          .eq('id', profile.id);

        if (error) throw error;

        toast.success('Layout erfolgreich gespeichert!');
        
        // Reset layout edit mode and return to profile
        setLayoutEditMode(false);
        localStorage.removeItem('cvLayoutEditMode');
        navigate('/profile');
      } catch (error) {
        console.error('Error saving layout:', error);
        toast.error('Fehler beim Speichern des Layouts');
      }
    } else {
      // Normal CV generation flow
      setCurrentStep(7);
    }
  };


  const renderLayoutComponent = () => {
    // Always render A4 layout for consistent preview (also on mobile)
    const data = mapFormDataToCVData(formData);
    const selected = formData.layout ?? 1;

    const LayoutComponent =
      selected === 2 ? MuenchenLayout :
      selected === 3 ? HamburgLayout :
      selected === 4 ? KoelnLayout :
      selected === 5 ? FrankfurtLayout :
      selected === 6 ? DuesseldorfLayout :
      selected === 7 ? StuttgartLayout :
      selected === 8 ? DresdenLayout :
      selected === 9 ? LeipzigLayout :
      BerlinLayout;

    return (
      <article
        data-cv-preview
        data-variant="a4"
        className={cn(
          'cv-a4-page bg-white text-foreground',
          'w-[210mm] h-[297mm]'
        )}
        style={{
          width: '210mm',
          height: '297mm',
          margin: 0,
          padding: 0,
          boxShadow: 'none',
        }}
        aria-label="Lebenslauf Vorschau – A4"
      >
        <LayoutComponent data={data} />
      </article>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Minimal Header - Absolute positioning to save space */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b flex-shrink-0 py-0.5 px-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-[9px] font-semibold truncate">CV-Vorschau • {getLayoutName()}</h2>
          </div>
          <div className="flex gap-0.5 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleBackToLayout}
              size="sm"
              className="h-5 text-[8px] px-1"
            >
              <ArrowLeft className="h-2 w-2 mr-0.5" />
              Zurück
            </Button>
            {isLayoutEditMode && (
              <Button
                onClick={handleFinish}
                size="sm"
                className="h-5 text-[8px] px-1"
              >
                Speichern
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* CV Preview - Maximize space, dynamically scaled, zero padding/margin */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center overflow-hidden"
        style={{ 
          padding: 0,
          margin: 0,
          paddingTop: '24px', // Just enough for header
        }}
      >
        <div 
          className="origin-center transition-transform duration-200"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            margin: 0,
            padding: 0,
          }}
        >
          {renderLayoutComponent()}
        </div>
      </div>
    </div>
  );
};

export default CVStep6;
