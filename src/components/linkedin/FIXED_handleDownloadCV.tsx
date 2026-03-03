// KOPIEREN SIE DIESE FUNKTION UND ERSETZEN SIE handleDownloadCV in LinkedInProfileSidebar.tsx

const handleDownloadCV = async () => {
  try {
    setIsGeneratingPDF(true);

    // Check if we have enough data to generate a CV
    if (!profile.vorname || !profile.nachname) {
      toast({
        title: "Fehlende Daten",
        description: "Vor- und Nachname sind für die CV-Generierung erforderlich.",
        variant: "destructive"
      });
      return;
    }

    // Create temporary container for CV rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.width = '210mm';
    tempContainer.style.minHeight = '297mm';
    document.body.appendChild(tempContainer);

    // Import CV layouts dynamically
    const ClassicV2Layout = (await import('@/components/cv-layouts/ClassicV2Layout')).default;

    // Select correct layout based on profile.layout
    let LayoutComponent;
    const layoutId = profile.layout || 1;
    console.log('Generating PDF with layout:', layoutId);
    
    switch (layoutId) {
      case 1:
        LayoutComponent = ModernLayout;
        break;
      case 2:
        LayoutComponent = ClassicLayout;
        break;
      case 3:
        LayoutComponent = CreativeLayout;
        break;
      case 4:
        LayoutComponent = MinimalLayout;
        break;
      case 5:
        LayoutComponent = ProfessionalLayout;
        break;
      case 6:
        LayoutComponent = LiveCareerLayout;
        break;
      case 7:
        LayoutComponent = ClassicV2Layout;
        break;
      default:
        LayoutComponent = ModernLayout;
    }

    // Prepare CV data
    const cvData = {
      vorname: profile.vorname,
      nachname: profile.nachname,
      email: profile.email,
      telefon: profile.telefon,
      geburtsdatum: profile.geburtsdatum,
      strasse: profile.strasse,
      hausnummer: profile.hausnummer,
      plz: profile.plz,
      ort: profile.ort,
      branche: profile.branche,
      status: profile.status,
      ueberMich: profile.uebermich || profile.bio || '',
      sprachen: profile.sprachen || [],
      faehigkeiten: profile.faehigkeiten || [],
      schulbildung: profile.schulbildung || [],
      berufserfahrung: profile.berufserfahrung || [],
      avatar_url: profile.avatar_url,
      profilbild: profile.avatar_url,
      has_drivers_license: profile.has_drivers_license,
      driver_license_class: profile.driver_license_class,
    };

    // Create and render CV element
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    const cvElement = React.createElement(LayoutComponent, { data: cvData });
    const root = ReactDOM.createRoot(tempContainer);
    root.render(cvElement);

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find ONLY the CV preview element (not the whole page!)
    const cvPreviewElement = tempContainer.querySelector('[data-cv-preview]') as HTMLElement;
    if (!cvPreviewElement) {
      console.error('CV preview not found in container:', tempContainer.innerHTML);
      throw new Error('CV preview element not found');
    }

    console.log('Generating PDF from element:', cvPreviewElement);

    // Generate PDF from ONLY the CV element
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(cvPreviewElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

    // Download PDF
    const filename = `CV_${profile.vorname}_${profile.nachname}.pdf`;
    pdf.save(filename);

    // Clean up
    root.unmount();
    document.body.removeChild(tempContainer);

    toast({
      title: "CV erfolgreich erstellt",
      description: `Dein Lebenslauf wurde als ${filename} heruntergeladen.`
    });
  } catch (error) {
    console.error('Error generating CV:', error);
    toast({
      title: "Fehler beim Generieren des CVs",
      description: "Es gab ein Problem beim Erstellen der PDF-Datei.",
      variant: "destructive"
    });
  } finally {
    setIsGeneratingPDF(false);
  }
};
