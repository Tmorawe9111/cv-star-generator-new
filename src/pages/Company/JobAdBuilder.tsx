import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/hooks/useCompany';
import { useJobLimits } from '@/hooks/useJobLimits';
import { JobLimitUpgradeModal } from '@/components/Company/jobs/JobLimitUpgradeModal';
import { PlanKey } from '@/lib/billing-v2/plans';

const BlueBtn = (p: any) => (
  <Button {...p} className={`bg-primary hover:bg-primary/90 ${p.className || ''}`}>
    {p.children}
  </Button>
);

function StepHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className='mb-4'>
      <h2 className='text-2xl font-semibold'>{title}</h2>
      {sub && <p className='text-muted-foreground mt-1'>{sub}</p>}
    </div>
  );
}

interface FormData {
  id: string;
  company_id: string;
  audience: string;
  industry_id: string;
  title: string;
  job_role: string;
  job_family: string;
  contract_type: string;
  seniority: string;
  work_pattern: string;
  shifts: string[];
  postal_code: string;
  location_lat: string;
  location_lng: string;
  start_window_earliest: string;
  start_window_latest: string;
  compensation_min: string;
  compensation_max: string;
  comp_unit: string;
  description: string;
  training_offered: { einarbeitung_weeks: number; mentor_program: boolean };
  upskilling_paths: string[];
  company_fit_tags: string[];
  requirements: Array<{ skill_id: string; level_required: number; must_have: boolean; is_soft: boolean }>;
  language_requirements: Array<{ lang: string; min_cefr: string; must_have: boolean }>;
  certs_required: Array<{ cert_slug: string; must_have: boolean }>;
  documents: Array<{ document_slug: string; must_have: boolean; nice_to_have: boolean }>;
}

export default function JobAdBuilder() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const { data: jobLimits } = useJobLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [step, setStep] = useState(1);
  const [industries, setIndustries] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);

  const [form, setForm] = useState<FormData>({
    id: '',
    company_id: company?.id || '',
    audience: '',
    industry_id: '',
    title: '',
    job_role: '',
    job_family: '',
    contract_type: '',
    seniority: '',
    work_pattern: 'vor_ort',
    shifts: [],
    postal_code: '',
    location_lat: '',
    location_lng: '',
    start_window_earliest: '',
    start_window_latest: '',
    compensation_min: '',
    compensation_max: '',
    comp_unit: '',
    description: '',
    training_offered: { einarbeitung_weeks: 4, mentor_program: true },
    upskilling_paths: [],
    company_fit_tags: [],
    requirements: [],
    language_requirements: [{ lang: 'DE', min_cefr: 'B1', must_have: true }],
    certs_required: [],
    documents: [{ document_slug: 'lebenslauf', must_have: true, nice_to_have: false }],
  });

  const set = (k: keyof FormData, v: any) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (company?.id) {
      set('company_id', company.id);
    }
  }, [company]);

  useEffect(() => {
    (async () => {
      const { data: ind } = await supabase.from('industry').select('id,name').order('name');
      const { data: sk } = await supabase.from('skill').select('id,name,slug,category,is_soft');
      const { data: dt } = await supabase.from('document_type').select('slug,name');
      setIndustries(ind || []);
      setSkills(sk || []);
      setDocTypes(dt || []);
    })();
  }, []);

  function applyAudiencePresets(aud: string) {
    const base: any = {
      schueler_praktikum: { contract_type: 'praktikum', seniority: 'schueler_praktikum', comp_unit: '' },
      ausbildung: { contract_type: 'ausbildung', seniority: 'ausbildung', comp_unit: 'ausbildungsjahr' },
      ausbildungswechsel: { contract_type: 'ausbildung', seniority: 'ausbildung', comp_unit: 'ausbildungsjahr' },
      job_nach_ausbildung: { contract_type: 'unbefristet', seniority: 'junior_fachkraft', comp_unit: 'monat' },
      fachkraft_jobwechsel: { contract_type: 'unbefristet', seniority: 'fachkraft', comp_unit: 'monat' },
    }[aud];
    if (!base) return;
    set('contract_type', base.contract_type);
    set('seniority', base.seniority);
    set('comp_unit', base.comp_unit);
  }

  const industryPreset = {
    skills: (industryId: string) => {
      const n = industries.find((i) => i.id === industryId)?.name?.toLowerCase();
      return skills
        .filter((s) => s.category === n && !s.is_soft)
        .slice(0, 10)
        .map((s) => ({ skill_id: s.id, level_required: 1, must_have: false, is_soft: false }));
    },
    documents: (industryId: string) => {
      const n = (industries.find((i) => i.id === industryId)?.name || '').toLowerCase();
      if (n.includes('pflege'))
        return [
          { document_slug: 'lebenslauf', must_have: true, nice_to_have: false },
          { document_slug: 'gesundheitszeugnis', must_have: false, nice_to_have: true },
        ];
      if (n.includes('logistik'))
        return [
          { document_slug: 'lebenslauf', must_have: true, nice_to_have: false },
          { document_slug: 'fuehrerschein_B', must_have: false, nice_to_have: true },
        ];
      return [{ document_slug: 'lebenslauf', must_have: true, nice_to_have: false }];
    },
  };

  function applyIndustryPreset(id: string) {
    set('requirements', industryPreset.skills(id));
    set('documents', industryPreset.documents(id));
  }

  function addRequirementById(id: string) {
    const sk = skills.find((s) => s.id === id);
    if (!sk || form.requirements.some((r) => r.skill_id === id)) return;
    set('requirements', [...form.requirements, { skill_id: id, level_required: 1, must_have: false, is_soft: !!sk.is_soft }]);
  }

  function addDocument(slug: string) {
    if (!slug || form.documents.some((d) => d.document_slug === slug)) return;
    set('documents', [...form.documents, { document_slug: slug, must_have: false, nice_to_have: false }]);
  }

  function addUpskilling(v: string) {
    if (!v) return;
    set('upskilling_paths', [...form.upskilling_paths, v]);
  }

  function addTag(v: string) {
    if (!v || form.company_fit_tags.includes(v)) return;
    set('company_fit_tags', [...form.company_fit_tags, v]);
  }

  const visibilityLabel = useMemo(
    () =>
      ({
        schueler_praktikum: 'Sichtbar für Schüler:innen (Praktika)',
        ausbildung: 'Sichtbar für Azubis & Bewerber:innen auf Ausbildungsplätze',
        ausbildungswechsel: 'Sichtbar für Azubis (Wechsel)',
        job_nach_ausbildung: 'Sichtbar für Absolvent:innen (nach Ausbildung)',
        fachkraft_jobwechsel: 'Sichtbar für Fachkräfte',
      }[form.audience] || ''),
    [form.audience]
  );

  function canPublish() {
    if (!form.audience || !form.industry_id || !form.title || !form.job_role) return false;
    if (!form.location_lat || !form.location_lng || !form.postal_code) return false;
    if (['ausbildung', 'ausbildungswechsel', 'job_nach_ausbildung', 'fachkraft_jobwechsel'].includes(form.audience)) {
      if (!form.comp_unit) return false;
    }
    if ((form.requirements || []).length === 0) return false;
    if (!form.documents.some((d) => d.document_slug === 'lebenslauf' && d.must_have)) return false;
    return true;
  }

  async function save(status = 'draft') {
    if (status === 'published' && !canPublish()) {
      toast.error('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
    
    // Check job limits before publishing (drafts are always allowed)
    if (status === 'published') {
      if (!jobLimits?.canCreate) {
        setShowUpgradeModal(true);
        return;
      }
    }
    
    const payload = { ...form, job_family: industries.find((i) => i.id === form.industry_id)?.name || '' };
    const { data, error } = await supabase.rpc('upsert_job_ad_with_requirements', { p_job: payload, p_status: status });
    if (error) {
      toast.error(error.message);
      return;
    }
    set('id', data);
    toast.success(status === 'published' ? 'Job veröffentlicht.' : 'Entwurf gespeichert.');
    
    // After successful job creation, mark onboarding as complete if not already
    if (status === 'published' && company && !company.onboarding_completed) {
      try {
        await supabase
          .from('companies')
          .update({ onboarding_completed: true })
          .eq('id', company.id);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Don't block navigation if this fails
      }
    }
    
    if (status === 'published') {
      navigate('/unternehmen/stellenanzeigen');
    }
  }

  const selectedSkills = useMemo(() => {
    const map = new Map(skills.map((s) => [s.id, s]));
    return (form.requirements || []).map((r) => ({ ...r, name: map.get(r.skill_id)?.name || 'Skill' }));
  }, [form.requirements, skills]);

  return (
    <>
      <div className='mx-auto max-w-4xl p-6 space-y-6 pb-20 md:pb-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant="ghost" size="sm" onClick={() => navigate('/company/jobs')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className='text-3xl font-bold'>Add new listing</h1>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => save('draft')}>Save draft</Button>
          <BlueBtn onClick={() => save('published')} disabled={!canPublish()}>Post Job</BlueBtn>
        </div>
      </div>

      {/* Step 1: Audience & Basics */}
      {step === 1 && (
        <Card>
          <CardHeader><StepHeader title='Set job details' sub='Wähle Zielgruppe & Grunddaten' /></CardHeader>
          <CardContent className='grid gap-4'>
            <div className='grid md:grid-cols-3 gap-3'>
              <Select value={form.audience} onValueChange={(v) => { set('audience', v); applyAudiencePresets(v); }}>
                <SelectTrigger><SelectValue placeholder='Zielgruppe wählen' /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='schueler_praktikum'>Schüler:in – Praktikum</SelectItem>
                  <SelectItem value='ausbildung'>Ausbildung (Start)</SelectItem>
                  <SelectItem value='ausbildungswechsel'>Ausbildungsplatz wechseln</SelectItem>
                  <SelectItem value='job_nach_ausbildung'>Job nach der Ausbildung</SelectItem>
                  <SelectItem value='fachkraft_jobwechsel'>Fachkraft – Jobwechsel</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.industry_id} onValueChange={(v) => { set('industry_id', v); applyIndustryPreset(v); }}>
                <SelectTrigger><SelectValue placeholder='Branche' /></SelectTrigger>
                <SelectContent>{industries.map(i => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}</SelectContent>
              </Select>
              <Input placeholder='Jobtitel (z. B. Ausbildung Elektroniker:in)' value={form.title} onChange={e => set('title', e.target.value)} />
            </div>

            <div className='grid md:grid-cols-3 gap-3'>
              <Input placeholder='Rolle (z. B. Elektroniker:in E & G)' value={form.job_role} onChange={e => set('job_role', e.target.value)} />
              <Select value={form.contract_type} onValueChange={v => set('contract_type', v)}>
                <SelectTrigger><SelectValue placeholder='Vertragsart' /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='praktikum'>Praktikum</SelectItem>
                  <SelectItem value='ausbildung'>Ausbildung</SelectItem>
                  <SelectItem value='befristet'>Befristet</SelectItem>
                  <SelectItem value='unbefristet'>Unbefristet</SelectItem>
                  <SelectItem value='teilzeit'>Teilzeit</SelectItem>
                  <SelectItem value='vollzeit'>Vollzeit</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.work_pattern} onValueChange={v => set('work_pattern', v)}>
                <SelectTrigger><SelectValue placeholder='Arbeitsmuster' /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='vor_ort'>Vor Ort</SelectItem>
                  <SelectItem value='hybrid'>Hybrid</SelectItem>
                  <SelectItem value='mobil'>Mobil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center gap-3 text-sm text-primary'>{visibilityLabel}</div>

            <div className='flex justify-end'>
              <BlueBtn onClick={() => setStep(2)} disabled={!form.audience || !form.industry_id}>Proceed</BlueBtn>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <Card>
          <CardHeader><StepHeader title='Enter job location' sub='Adresse/Koordinaten für Matching & Distanz' /></CardHeader>
          <CardContent className='grid gap-3'>
            <div className='grid md:grid-cols-3 gap-3'>
              <Input placeholder='PLZ' value={form.postal_code} onChange={e => set('postal_code', e.target.value)} />
              <Input placeholder='Latitude' value={form.location_lat} onChange={e => set('location_lat', e.target.value)} />
              <Input placeholder='Longitude' value={form.location_lng} onChange={e => set('location_lng', e.target.value)} />
            </div>
            <div className='grid md:grid-cols-2 gap-3'>
              <Input type='date' placeholder='Start frühestens' value={form.start_window_earliest} onChange={e => set('start_window_earliest', e.target.value)} />
              <Input type='date' placeholder='Start spätestens' value={form.start_window_latest} onChange={e => set('start_window_latest', e.target.value)} />
            </div>
            <div className='flex justify-between'>
              <Button variant='outline' onClick={() => setStep(1)}>Back</Button>
              <BlueBtn onClick={() => setStep(3)}>Next</BlueBtn>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <Card>
          <CardHeader><StepHeader title='Job details' sub='Beschreibung & ggf. Vergütung' /></CardHeader>
          <CardContent className='grid gap-4'>
            <Textarea placeholder='Beschreibung (Alltag, Aufgaben, Betreuung/Team, Entwicklung)' value={form.description} onChange={e => set('description', e.target.value)} rows={6} />
            {form.audience !== 'schueler_praktikum' && (
              <div className='grid md:grid-cols-3 gap-3'>
                <Input placeholder='Vergütung min' value={form.compensation_min} onChange={e => set('compensation_min', e.target.value)} />
                <Input placeholder='Vergütung max' value={form.compensation_max} onChange={e => set('compensation_max', e.target.value)} />
                <Select value={form.comp_unit} onValueChange={v => set('comp_unit', v)}>
                  <SelectTrigger><SelectValue placeholder='Einheit' /></SelectTrigger>
                  <SelectContent>
                    {form.audience.includes('ausbildung') ? (
                      <SelectItem value='ausbildungsjahr'>Ausbildungsjahr</SelectItem>
                    ) : (<>
                      <SelectItem value='monat'>Monat</SelectItem>
                      <SelectItem value='stunde'>Stunde</SelectItem>
                    </>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className='flex items-center gap-3'>
              <span className='text-sm text-muted-foreground'>Schichten:</span>
              {['tage', 'nacht', 'wochenende'].map(s => (
                <label key={s} className='text-sm flex items-center gap-1'>
                  <input type='checkbox' checked={form.shifts.includes(s)} onChange={(e) => {
                    set('shifts', e.target.checked ? [...form.shifts, s] : form.shifts.filter(x => x !== s))
                  }} /> {s}
                </label>
              ))}
            </div>
            <div className='flex justify-between'>
              <Button variant='outline' onClick={() => setStep(2)}>Back</Button>
              <BlueBtn onClick={() => setStep(4)}>Next</BlueBtn>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Anforderungen */}
      {step === 4 && (
        <Card>
          <CardHeader><StepHeader title='Requirements' sub='Skills, Sprachen, Kultur & Entwicklung' /></CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid md:grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <div className='flex gap-2'>
                  <Select onValueChange={(id) => addRequirementById(id)}>
                    <SelectTrigger><SelectValue placeholder='Skill hinzufügen' /></SelectTrigger>
                    <SelectContent className='max-h-64 overflow-auto'>
                      {skills.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button variant='outline' onClick={() => applyIndustryPreset(form.industry_id)}>Preset</Button>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {selectedSkills.map((r, idx) => (
                    <div key={idx} className='flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1'>
                      <span className='text-sm'>{r.name}</span>
                      <select className='text-sm bg-transparent' value={r.level_required}
                        onChange={e => { const nv = [...form.requirements]; nv[idx].level_required = parseInt(e.target.value); set('requirements', nv) }}>
                        {[0, 1, 2, 3].map(l => (<option key={l} value={l}>Lvl {l}</option>))}
                      </select>
                      <label className='text-xs flex items-center gap-1'>
                        <input type='checkbox' checked={r.must_have} onChange={e => { const nv = [...form.requirements]; nv[idx].must_have = e.target.checked; set('requirements', nv) }} /> must
                      </label>
                      <button className='text-primary/60 text-sm' onClick={() => { const nv = [...form.requirements]; nv.splice(idx, 1); set('requirements', nv) }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className='space-y-2'>
                <label className='text-sm text-muted-foreground'>Sprachen (CEFR)</label>
                {form.language_requirements.map((lr, i) => (
                  <div key={i} className='flex items-center gap-2'>
                    <Input className='w-20' value={lr.lang} onChange={e => { const nv = [...form.language_requirements]; nv[i].lang = e.target.value.toUpperCase(); set('language_requirements', nv) }} />
                    <Select value={lr.min_cefr} onValueChange={v => { const nv = [...form.language_requirements]; nv[i].min_cefr = v; set('language_requirements', nv) }}>
                      <SelectTrigger className='w-28'><SelectValue /></SelectTrigger>
                      <SelectContent>{['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(x => (<SelectItem key={x} value={x}>{x}</SelectItem>))}</SelectContent>
                    </Select>
                    <label className='text-sm flex items-center gap-1'><input type='checkbox' checked={lr.must_have} onChange={e => { const nv = [...form.language_requirements]; nv[i].must_have = e.target.checked; set('language_requirements', nv) }} /> must</label>
                    <Button variant='ghost' size="sm" onClick={() => { const nv = [...form.language_requirements]; nv.splice(i, 1); set('language_requirements', nv) }}>×</Button>
                  </div>
                ))}
                <Button variant='outline' size="sm" onClick={() => set('language_requirements', [...form.language_requirements, { lang: 'DE', min_cefr: 'B1', must_have: true }])}>Sprache +</Button>
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-3'>
              <Input placeholder='Upskilling (z. B. Staplerschein in 2 Wochen)' onKeyDown={e => { if (e.key === 'Enter') { addUpskilling(e.currentTarget.value); e.currentTarget.value = ''; } }} />
              <Input placeholder='Team/Umfeld Tag (z. B. familienbetrieb, mehrsprachig)' onKeyDown={e => { if (e.key === 'Enter') { addTag(e.currentTarget.value); e.currentTarget.value = ''; } }} />
            </div>
            <div className='flex flex-wrap gap-2'>
              {form.upskilling_paths.map((u, i) => (<span key={i} className='rounded-full bg-muted px-3 py-1 text-sm'>{u} <button className='ml-1 text-muted-foreground' onClick={() => { const nv = [...form.upskilling_paths]; nv.splice(i, 1); set('upskilling_paths', nv) }}>×</button></span>))}
              {form.company_fit_tags.map((t, i) => (<span key={i} className='rounded-full bg-muted px-3 py-1 text-sm'>{t} <button className='ml-1 text-muted-foreground' onClick={() => set('company_fit_tags', form.company_fit_tags.filter((_, ix) => ix !== i))}>×</button></span>))}
            </div>

            <div className='flex justify-between'>
              <Button variant='outline' onClick={() => setStep(3)}>Back</Button>
              <BlueBtn onClick={() => setStep(5)}>Next</BlueBtn>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Dokumente */}
      {step === 5 && (
        <Card>
          <CardHeader><StepHeader title='Applicant options' sub='Pflicht-/Optionale Dokumente & Optionen' /></CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-sm text-muted-foreground mb-2 block'>Dokument hinzufügen</label>
              <div className='flex gap-2'>
                <Select onValueChange={(slug) => addDocument(slug)}>
                  <SelectTrigger><SelectValue placeholder='Dokument wählen' /></SelectTrigger>
                  <SelectContent className='max-h-64 overflow-auto'>
                    {docTypes.map(d => (<SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button variant='outline' onClick={() => applyIndustryPreset(form.industry_id)}>Preset</Button>
              </div>
              <div className='mt-3 flex flex-wrap gap-2'>
                {form.documents.map((d, i) => (
                  <div key={d.document_slug} className='flex items-center gap-2 rounded-full bg-muted px-3 py-1'>
                    <span className='text-sm'>{d.document_slug}</span>
                    <label className='text-xs flex items-center gap-1'><input type='checkbox' checked={!!d.must_have} onChange={e => { const nv = [...form.documents]; nv[i].must_have = e.target.checked; if (e.target.checked) nv[i].nice_to_have = false; set('documents', nv) }} /> must</label>
                    <label className='text-xs flex items-center gap-1'><input type='checkbox' checked={!!d.nice_to_have} onChange={e => { const nv = [...form.documents]; nv[i].nice_to_have = e.target.checked; if (e.target.checked) nv[i].must_have = false; set('documents', nv) }} /> nice</label>
                    <button className='text-muted-foreground text-sm' onClick={() => { const nv = [...form.documents]; nv.splice(i, 1); set('documents', nv) }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className='flex justify-between'>
              <Button variant='outline' onClick={() => setStep(4)}>Back</Button>
              <BlueBtn onClick={() => setStep(6)}>Next</BlueBtn>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Preview & Publish */}
      {step === 6 && (
        <Card>
          <CardHeader><StepHeader title='Review & publish' sub='Prüfe alle Angaben – Sichtbarkeit nach Zielgruppe' /></CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-sm text-muted-foreground space-y-2'>
              <div><b>Zielgruppe:</b> {visibilityLabel}</div>
              <div><b>Branche:</b> {industries.find(i => i.id === form.industry_id)?.name || '-'}</div>
              <div><b>Titel/Rolle:</b> {form.title} • {form.job_role}</div>
              <div><b>Ort:</b> {form.postal_code} (Lat {form.location_lat}, Lng {form.location_lng})</div>
              <div><b>Dokumente:</b> {(form.documents || []).map(d => `${d.document_slug}${d.must_have ? ' (Pflicht)' : ''}${d.nice_to_have ? ' (Optional)' : ''}`).join(', ')}</div>
              <div><b>Skills:</b> {(selectedSkills || []).map(s => `${s.name}${s.must_have ? '*' : ''} L${s.level_required}`).join(', ')}</div>
            </div>

            <div className='flex justify-between'>
              <Button variant='outline' onClick={() => setStep(5)}>Back</Button>
              <BlueBtn onClick={() => save('published')} disabled={!canPublish()}>Post Job</BlueBtn>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
      
      <JobLimitUpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={(company?.selected_plan_id as PlanKey) || null}
        currentCount={jobLimits?.currentCount || 0}
        maxAllowed={jobLimits?.maxAllowed || 0}
        reason={jobLimits?.reason || "free"}
      />
    </>
  );
}
