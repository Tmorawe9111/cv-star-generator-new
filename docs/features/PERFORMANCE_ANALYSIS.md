# Performance-Analyse & Optimierungsvorschläge

## 🔍 Aktuelle Performance-Probleme

### 1. **React Query Konfiguration** ⚠️ KRITISCH
**Problem**: QueryClient hat keine Default-Optionen
- Keine globalen `staleTime`/`cacheTime` Einstellungen
- Jede Query muss individuell konfiguriert werden
- Viele Queries haben kein Caching → unnötige API-Calls

**Aktueller Code**:
```typescript
const queryClient = new QueryClient();
```

**Lösung**: Default-Optionen hinzufügen
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 Minuten
      cacheTime: 5 * 60 * 1000, // 5 Minuten
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});
```

**Impact**: ⭐⭐⭐⭐⭐ (Sehr hoch - reduziert API-Calls um ~60-80%)

---

### 2. **Zu viele `select('*')` Aufrufe** ⚠️ HOCH
**Problem**: 164 Stellen laden alle Spalten
- Lädt unnötig viele Daten
- Langsamere Netzwerk-Übertragung
- Höherer Speicherverbrauch

**Beispiele**:
- `useAuth.tsx`: `select('*')` → sollte nur benötigte Felder laden ✅ (bereits optimiert)
- `UserProfile.tsx`: `select('*')` → sollte spezifische Felder laden
- Viele andere Komponenten

**Lösung**: Nur benötigte Felder selektieren
```typescript
// Statt:
.select('*')

// Besser:
.select('id, vorname, nachname, avatar_url, headline, ort')
```

**Impact**: ⭐⭐⭐⭐ (Hoch - reduziert Datenübertragung um ~40-60%)

---

### 3. **Fehlende Caching-Strategien** ⚠️ HOCH
**Problem**: 255 useQuery/useMutation Aufrufe, aber nur wenige haben Caching

**Aktuelle Situation**:
- `usePublicProfile`: ✅ 5 Min staleTime
- `useProfiles`: ✅ 2 Min staleTime (gerade hinzugefügt)
- `useRPC`: ✅ 30 Sek staleTime
- **Viele andere**: ❌ Kein Caching

**Lösung**: Caching für häufig genutzte Queries hinzufügen:
- Profile-Queries: 2-5 Minuten
- Company-Queries: 5 Minuten
- Feed-Queries: 1-2 Minuten
- Settings-Queries: 10 Minuten

**Impact**: ⭐⭐⭐⭐ (Hoch - reduziert API-Calls um ~50-70%)

---

### 4. **Ineffiziente Datenbankabfragen** ⚠️ MITTEL
**Problem**: Mehrere sequenzielle API-Calls statt parallele/batch

**Beispiele**:
- `useProfiles.ts`: ✅ Bereits optimiert (Match-Scores entfernt)
- `UserProfile.tsx`: ✅ Bereits optimiert (parallel loading)
- `CompanyDashboard.tsx`: Lädt Daten sequenziell

**Lösung**: Parallele API-Calls verwenden
```typescript
// Statt:
const data1 = await fetch1();
const data2 = await fetch2();

// Besser:
const [data1, data2] = await Promise.all([fetch1(), fetch2()]);
```

**Impact**: ⭐⭐⭐ (Mittel - reduziert Ladezeit um ~30-50%)

---

### 5. **Console.log Statements in Production** ⚠️ NIEDRIG
**Problem**: Viele console.log Aufrufe in Production-Code
- Erhöht Bundle-Größe
- Kann Performance beeinträchtigen

**Lösung**: Entfernen oder mit Environment-Check
```typescript
if (import.meta.env.DEV) {
  console.log('[feed] Auth state:', ...);
}
```

**Impact**: ⭐⭐ (Niedrig - kleine Verbesserung)

---

### 6. **Fehlende React.memo/useMemo Optimierungen** ⚠️ MITTEL
**Problem**: Komponenten re-rendern unnötig oft

**Lösung**: React.memo für schwere Komponenten
```typescript
export default React.memo(PostCard);
```

**Impact**: ⭐⭐⭐ (Mittel - reduziert Re-Renders um ~20-30%)

---

### 7. **Lazy Loading könnte optimiert werden** ⚠️ NIEDRIG
**Problem**: Viele Komponenten werden lazy geladen, aber Suspense-Fallbacks sind identisch

**Aktueller Stand**: ✅ Gut implementiert (89 lazy imports)

**Optimierung**: Preloading für wahrscheinliche nächste Routes
```typescript
// Preload wahrscheinliche nächste Route
const preloadRoute = () => {
  import('./pages/Dashboard');
};
```

**Impact**: ⭐⭐ (Niedrig - kleine UX-Verbesserung)

---

## 📊 Performance-Metriken (Geschätzt)

### Aktuell:
- **Initial Load**: ~2-3 Sekunden
- **Profile Load**: ~500-800ms
- **Feed Load**: ~1-2 Sekunden
- **API Calls pro Seite**: ~10-15

### Nach Optimierungen:
- **Initial Load**: ~1-1.5 Sekunden (-50%)
- **Profile Load**: ~200-300ms (-60%)
- **Feed Load**: ~500-800ms (-60%)
- **API Calls pro Seite**: ~3-5 (-70%)

---

## 🎯 Priorisierte Optimierungsliste

### Phase 1: Quick Wins (1-2 Stunden)
1. ✅ React Query Default-Optionen hinzufügen
2. ✅ Wichtigste `select('*')` Aufrufe optimieren
3. ✅ Caching für häufig genutzte Queries

### Phase 2: Mittlere Optimierungen (2-4 Stunden)
4. ✅ Parallele API-Calls implementieren
5. ✅ React.memo für schwere Komponenten
6. ✅ Console.log Statements entfernen/optimieren

### Phase 3: Erweiterte Optimierungen (4-8 Stunden)
7. ✅ Code-Splitting optimieren
8. ✅ Image-Lazy-Loading
9. ✅ Virtualisierung für lange Listen

---

## 🔧 Konkrete Implementierungsschritte

### Schritt 1: QueryClient optimieren
```typescript
// src/App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 Minuten
      cacheTime: 5 * 60 * 1000, // 5 Minuten
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});
```

### Schritt 2: Wichtigste Queries optimieren
- Profile-Queries: Spezifische Felder statt `*`
- Feed-Queries: Caching hinzufügen
- Company-Queries: Caching hinzufügen

### Schritt 3: Parallele API-Calls
- Dashboard: Parallele Datenladung
- Profile: Bereits optimiert ✅
- Search: Parallele Filter-Queries

---

## 📈 Erwartete Verbesserungen

| Metrik | Vorher | Nachher | Verbesserung |
|--------|--------|---------|--------------|
| Initial Load | 2-3s | 1-1.5s | **-50%** |
| Profile Load | 500-800ms | 200-300ms | **-60%** |
| Feed Load | 1-2s | 500-800ms | **-60%** |
| API Calls/Seite | 10-15 | 3-5 | **-70%** |
| Datenübertragung | 100% | 40-60% | **-40-60%** |

---

## 🚀 Nächste Schritte

1. **Sofort**: QueryClient Default-Optionen implementieren
2. **Diese Woche**: Wichtigste `select('*')` Aufrufe optimieren
3. **Nächste Woche**: Caching für alle wichtigen Queries
4. **Laufend**: Performance-Monitoring einrichten

