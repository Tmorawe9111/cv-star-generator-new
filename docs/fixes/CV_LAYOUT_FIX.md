# CV LAYOUT PROBLEME BEHEBEN

## Führen Sie diese Änderungen im Code durch:

### 1. LinkedInProfileSidebar.tsx - Zeile 17-22 NACH LiveCareerLayout hinzufügen:

```typescript
import ClassicV2Layout from '@/components/cv-layouts/ClassicV2Layout';
```

### 2. LinkedInProfileSidebar.tsx - Zeile 82-105 ersetzen mit:

```typescript
      // Import and render the correct CV layout
      let LayoutComponent;
      const layoutId = profile.layout || 1;
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
```

## Das behebt:
- ✅ Layout 7 (Klassisch V2) wird erkannt
- ✅ Korrektes Layout wird geladen basierend auf `profile.layout`
- ✅ `LayoutComponent` Variable ist definiert

Ich kann diese Änderungen auch automatisch vornehmen - soll ich?
