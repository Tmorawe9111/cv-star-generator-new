import React, { useState, useEffect, useRef } from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
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

const CVStep5 = () => {
  const { formData, updateFormData } = useCVForm();
  const isMobile = useIsMobile();
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const layouts = [
    {
      id: 1,
      name: 'Berlin',
      description: 'Elegant, beige Sidebar',
      preview: '🎨',
      color: 'bg-amber-50 border-amber-300'
    },
    {
      id: 2,
      name: 'München',
      description: 'Modern, blaue Sidebar',
      preview: '💼',
      color: 'bg-blue-50 border-blue-300'
    },
    {
      id: 3,
      name: 'Hamburg',
      description: 'Klassisch, Timeline',
      preview: '📅',
      color: 'bg-gray-50 border-gray-300'
    },
    {
      id: 4,
      name: 'Köln',
      description: 'Urban, dunkle Sidebar',
      preview: '🏙️',
      color: 'bg-slate-50 border-slate-300'
    },
    {
      id: 5,
      name: 'Frankfurt',
      description: 'Business, helles Design',
      preview: '📊',
      color: 'bg-stone-50 border-stone-300'
    },
    {
      id: 6,
      name: 'Düsseldorf',
      description: 'Harvard Style, ohne Foto',
      preview: '🎓',
      color: 'bg-neutral-50 border-neutral-300'
    },
    {
      id: 7,
      name: 'Stuttgart',
      description: 'Orange-Beige, mit Unterschrift',
      preview: '🎨',
      color: 'bg-orange-50 border-orange-300'
    },
    {
      id: 8,
      name: 'Dresden',
      description: 'Elegant, dunkelblau',
      preview: '💎',
      color: 'bg-blue-50 border-blue-300'
    },
    {
      id: 9,
      name: 'Leipzig',
      description: 'Minimalistisch, Schwarz-Weiß',
      preview: '⚡',
      color: 'bg-slate-50 border-slate-300'
    }
  ];

  const getRecommendedLayout = () => {
    switch (formData.branche) {
      case 'handwerk': return 7; // Stuttgart - Orange-Beige für Handwerk
      case 'it': return 9; // Leipzig - Minimalistisch für IT
      case 'gesundheit': return 8; // Dresden - Elegant für Gesundheit
      case 'buero': return 5; // Frankfurt - Business clean
      case 'verkauf': return 1; // Berlin - Kreativ beige
      case 'gastronomie': return 4; // Köln - Urban freundlich
      case 'bau': return 3; // Hamburg - Klassisch strukturiert
      default: return 2;
    }
  };

  const recommendedLayoutId = getRecommendedLayout();

  // Calculate optimal scale for CV preview - maximize size, fit exactly without scrolling
  useEffect(() => {
    const calculateScale = () => {
      if (!previewContainerRef.current) return;
      
      const container = previewContainerRef.current;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;
      
      // A4 dimensions: 210mm x 297mm
      // At 96 DPI: ~794px x 1123px
      const a4Width = 794;
      const a4Height = 1123;
      
      // Calculate scale to fit both width and height exactly
      const scaleX = containerWidth / a4Width;
      const scaleY = containerHeight / a4Height;
      
      // Use the smaller scale to ensure everything fits without scrolling
      const optimalScale = Math.min(scaleX, scaleY);
      
      setScale(Math.max(0.1, Math.min(optimalScale, 1))); // Clamp between 0.1 and 1
    };

    calculateScale();
    const resizeObserver = new ResizeObserver(calculateScale);
    if (previewContainerRef.current) {
      resizeObserver.observe(previewContainerRef.current);
    }
    window.addEventListener('resize', calculateScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [formData.layout]); // Recalculate when layout changes

  const handleLayoutChange = (layoutId: string) => {
    updateFormData({ layout: parseInt(layoutId) });
  };

  const renderLayoutComponent = () => {
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Ultra Compact Header with Layout Selector */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
        <div className={cn(
          "flex items-center justify-between gap-2 py-1.5 px-2",
          isMobile ? "flex-col gap-1.5" : "flex-row"
        )}>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs md:text-sm font-semibold truncate">CV-Vorschau</h2>
          </div>
          
          {/* Compact Layout Selector */}
          <div className={cn(
            "flex-shrink-0",
            isMobile ? "w-full" : "w-48 max-w-[calc(100vw-200px)]"
          )}>
            <Select
              value={formData.layout?.toString() || '1'}
              onValueChange={handleLayoutChange}
            >
              <SelectTrigger className={cn(
                "h-7 md:h-8 text-[11px] md:text-xs",
                isMobile && "w-full"
              )}>
                <SelectValue>
                  {formData.layout ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{layouts.find(l => l.id === formData.layout)?.preview}</span>
                      <span className="truncate">{layouts.find(l => l.id === formData.layout)?.name}</span>
                    </div>
                  ) : (
                    'Layout wählen'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[50vh] w-[var(--radix-select-trigger-width)]">
                {layouts.map((layout) => (
                  <SelectItem key={layout.id} value={layout.id.toString()} className="text-xs py-2">
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-base flex-shrink-0">{layout.preview}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium">{layout.name}</span>
                          <span className="text-[10px] text-muted-foreground">{layout.description}</span>
                          {layout.id === recommendedLayoutId && (
                            <span className="text-[9px] bg-primary text-primary-foreground px-1 py-0.5 rounded flex-shrink-0">
                              ⭐
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* CV Preview - Maximum space, zero padding, no scrolling */}
      <div className="flex-1 min-h-0 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative">
        {formData.layout ? (
          <div
            ref={previewContainerRef}
            className="w-full h-full relative"
            style={{ padding: 0, margin: 0 }}
          >
            <div
              className="absolute top-1/2 left-1/2 transition-transform duration-300 ease-out"
              style={{
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: 'center center',
              }}
            >
              {renderLayoutComponent()}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <p className="text-sm md:text-base mb-2">Wähle ein Layout aus</p>
            <p className="text-xs text-muted-foreground">Die Vorschau erscheint hier</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVStep5;
