type CVServerHtmlParams = {
  layout: number;
  data: any;
};

const sanitize = (value?: string) => (value ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Sortiert Berufserfahrung chronologisch:
 * 1. Jobs mit "bis heute" kommen zuerst (neueste zuerst basierend auf Startdatum)
 * 2. Dann die anderen Jobs nach Enddatum sortiert (neueste zuerst)
 * 3. Falls kein Enddatum, nach Startdatum (neueste zuerst)
 */
function sortBerufserfahrung(berufserfahrung: any[]): any[] {
  if (!berufserfahrung || berufserfahrung.length === 0) return berufserfahrung;

  const parseDate = (dateStr: string): { year: number; month: number } | null => {
    if (!dateStr || dateStr === 'heute' || dateStr === '0000') return null;
    
    const parts = dateStr.split('-');
    const year = parseInt(parts[0] || '0');
    const month = parts[1] ? parseInt(parts[1]) : 1;
    
    if (isNaN(year) || year === 0) return null;
    return { year, month: isNaN(month) ? 1 : month };
  };

  const getSortValue = (job: any): number => {
    const isCurrent = job.zeitraum_bis === 'heute';
    const vonDate = parseDate(job.zeitraum_von || '');
    const bisDate = parseDate(job.zeitraum_bis || '');

    if (isCurrent) {
      if (vonDate) {
        return 1000000 + (vonDate.year * 100 + vonDate.month);
      }
      return 1000000;
    }

    if (bisDate) {
      return bisDate.year * 100 + bisDate.month;
    }

    if (vonDate) {
      return vonDate.year * 100 + vonDate.month;
    }

    return 0;
  };

  return [...berufserfahrung].sort((a, b) => {
    const aValue = getSortValue(a);
    const bValue = getSortValue(b);
    return bValue - aValue;
  });
}

export async function buildClassicHTML({ layout, data }: CVServerHtmlParams) {
  // TODO: Add support for additional layouts based on `layout`
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Lebenslauf – ${sanitize(data.vorname)} ${sanitize(data.nachname)}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<style>
  ${await fetchInlineCVStyles()}
</style>
</head>
<body>
  <article class="cv-a4-page">
    <div style="background: linear-gradient(135deg, hsl(200,60%,45%), hsl(220,60%,45%)); color:#fff; padding: 10mm 16mm 6mm;">
      <div style="display:grid; grid-template-columns: 1fr 3fr; gap: 6mm; align-items:center;">
        <div>
          ${data.avatar_url ? `<img src="${sanitize(data.avatar_url)}" alt="Profilbild" style="width:38mm;height:38mm;border-radius:50%;object-fit:cover;border:4px solid #fff;" />` : ''}
        </div>
        <div>
          <div style="font-family:'Playfair Display', serif; font-weight:700; font-size:22pt;">${sanitize(data.vorname)} ${sanitize(data.nachname)}</div>
          <div style="margin-top:2mm;letter-spacing:.12em;text-transform:uppercase;opacity:.9;">
            ${sanitize(data.status || '')} · ${sanitize(data.branche || '')}
          </div>
          <div style="margin-top:3mm;font-size:10pt;line-height:1.4;">
            ${sanitize(data.email || '')} · ${sanitize(data.telefon || '')}${data.ort ? ' · ' + sanitize(data.ort) : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="cv-a4-content" style="display:grid; grid-template-columns: 4fr 8fr; gap: 8mm;">
      <aside style="padding-right:6mm;border-right:1px solid #cbd5e1;">
        ${data.ueberMich ? `
        <section style="margin-bottom:6mm;">
          <h3 style="font-size:10pt;letter-spacing:.2em;margin:0 0 2mm 0;color:#0f172a;">ÜBER MICH</h3>
          <p style="font-size:10pt;line-height:1.5;margin:0;">${sanitize(data.ueberMich)}</p>
        </section>` : ''}

        ${data.sprachen?.length ? `
        <section style="margin-bottom:6mm;">
          <h3 style="font-size:10pt;letter-spacing:.2em;margin:0 0 2mm 0;color:#0f172a;">SPRACHEN</h3>
          <ul style="list-style:none;padding:0;margin:0;">
            ${data.sprachen.map((s: any) => `<li style="display:flex;justify-content:space-between;font-size:10pt;margin:2mm 0;">
              <span style="font-weight:600;">${sanitize(s.sprache)}</span><span style="opacity:.7;">${sanitize(s.niveau)}</span>
            </li>`).join('')}
          </ul>
        </section>` : ''}

        ${data.faehigkeiten?.length ? `
        <section style="margin-bottom:6mm;">
          <h3 style="font-size:10pt;letter-spacing:.2em;margin:0 0 2mm 0;color:#0f172a;">FÄHIGKEITEN</h3>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${data.faehigkeiten.map((skill: string) => `<span style="font-size:9pt;border:1px solid #e5e7eb;border-radius:999px;padding:2px 8px;">${sanitize(skill)}</span>`).join('')}
          </div>
        </section>` : ''}
      </aside>

      <section>
        ${data.berufserfahrung?.length ? `
        <div style="margin-bottom:8mm;break-inside:avoid;">
          <h3 style="font-family:'Playfair Display',serif;font-size:12pt;font-weight:700;letter-spacing:.2em;margin:0 0 3mm 0;color:#0f172a;">BERUFSERFAHRUNG</h3>
          <div style="display:flex;flex-direction:column;gap:5mm;">
            ${sortBerufserfahrung(data.berufserfahrung || []).map((job: any) => `
            <div style="break-inside:avoid;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-weight:600;">${sanitize(job.titel)}</div>
                  <div style="font-size:10pt;opacity:.8;">${sanitize(job.unternehmen)}${job.ort ? ', ' + sanitize(job.ort) : ''}</div>
                </div>
                <div style="font-size:10pt;opacity:.7;white-space:nowrap;">${sanitize(job.zeitraum_von || '')} – ${sanitize(job.zeitraum_bis || 'heute')}</div>
              </div>
              ${job.beschreibung ? `<ul style="margin:2mm 0 0 4mm;padding-left:4mm;font-size:10pt;">
                ${String(job.beschreibung).split('\n').map((line: string) => `<li>${sanitize(line)}</li>`).join('')}
              </ul>` : ''}
            </div>`).join('')}
          </div>
        </div>` : ''}

        ${data.schulbildung?.length ? `
        <div style="break-inside:avoid;">
          <h3 style="font-family:'Playfair Display',serif;font-size:12pt;font-weight:700;letter-spacing:.2em;margin:0 0 3mm 0;color:#0f172a;">AUSBILDUNG</h3>
          <div style="display:flex;flex-direction:column;gap:5mm;">
            ${data.schulbildung.map((edu: any) => `
            <div style="break-inside:avoid;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-weight:600;">${sanitize(edu.schulform)}</div>
                  <div style="font-size:10pt;opacity:.8;">${sanitize(edu.name)}${edu.ort ? ', ' + sanitize(edu.ort) : ''}</div>
                </div>
                <div style="font-size:10pt;opacity:.7;white-space:nowrap;">${sanitize(edu.zeitraum_von || '')} – ${sanitize(edu.zeitraum_bis || 'heute')}</div>
              </div>
              ${edu.beschreibung ? `<ul style="margin:2mm 0 0 4mm;padding-left:4mm;font-size:10pt;">
                ${String(edu.beschreibung).split('\n').map((line: string) => `<li>${sanitize(line)}</li>`).join('')}
              </ul>` : ''}
            </div>`).join('')}
          </div>
        </div>` : ''}
      </section>
    </div>
  </article>
</body>
</html>`;
}

export async function fetchInlineCVStyles(): Promise<string> {
  return `
  @page { size:A4; margin:0; }
  body { margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; }
  .cv-a4-page { width:210mm; height:297mm; background:#fff; color:#111; }
  .cv-a4-content { padding:14mm 16mm; }
  `;
}


