import { useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── Custom SVG Avatar illustrations ─────────────────────────────────────── */
const Avatar = ({ seed = 1, size = 48, className = '' }: { seed?: number; size?: number; className?: string }) => {
  const palettes = [
    { skin: '#FDDBB4', hair: '#3D2314', shirt: '#5170ff' },
    { skin: '#C8956C', hair: '#1A1A2E', shirt: '#7C3AED' },
    { skin: '#F5CBA7', hair: '#2C1810', shirt: '#059669' },
    { skin: '#D4956A', hair: '#0F0F1A', shirt: '#DC2626' },
    { skin: '#FDDBB4', hair: '#8B4513', shirt: '#0891B2' },
    { skin: '#C8956C', hair: '#1C1C1C', shirt: '#D97706' },
  ];
  const p = palettes[(seed - 1) % palettes.length];
  const hairstyles = [
    <path key="h1" d={`M${size * 0.18} ${size * 0.38} Q${size * 0.18} ${size * 0.08} ${size * 0.5} ${size * 0.07} Q${size * 0.82} ${size * 0.08} ${size * 0.82} ${size * 0.38}`} fill={p.hair} />,
    <g key="h2">
      <path d={`M${size * 0.18} ${size * 0.38} Q${size * 0.18} ${size * 0.08} ${size * 0.5} ${size * 0.07} Q${size * 0.82} ${size * 0.08} ${size * 0.82} ${size * 0.38}`} fill={p.hair} />
      <ellipse cx={size * 0.5} cy={size * 0.12} rx={size * 0.32} ry={size * 0.09} fill={p.hair} />
    </g>,
    <path key="h3" d={`M${size * 0.22} ${size * 0.3} Q${size * 0.2} ${size * 0.06} ${size * 0.5} ${size * 0.06} Q${size * 0.8} ${size * 0.06} ${size * 0.78} ${size * 0.3}`} fill={p.hair} />,
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={{ borderRadius: '50%', display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill={p.skin} />
      <path d={`M${size * 0.1} ${size} Q${size * 0.1} ${size * 0.72} ${size * 0.5} ${size * 0.7} Q${size * 0.9} ${size * 0.72} ${size * 0.9} ${size} Z`} fill={p.shirt} />
      <rect x={size * 0.42} y={size * 0.54} width={size * 0.16} height={size * 0.18} rx={size * 0.04} fill={p.skin} />
      <ellipse cx={size / 2} cy={size * 0.37} rx={size * 0.28} ry={size * 0.26} fill={p.skin} />
      {hairstyles[(seed - 1) % hairstyles.length]}
      <ellipse cx={size * 0.38} cy={size * 0.38} rx={size * 0.04} ry={size * 0.045} fill="#1a1a2e" />
      <ellipse cx={size * 0.62} cy={size * 0.38} rx={size * 0.04} ry={size * 0.045} fill="#1a1a2e" />
      <circle cx={size * 0.395} cy={size * 0.365} r={size * 0.012} fill="white" />
      <circle cx={size * 0.635} cy={size * 0.365} r={size * 0.012} fill="white" />
      <path d={`M${size * 0.4} ${size * 0.47} Q${size * 0.5} ${size * 0.53} ${size * 0.6} ${size * 0.47}`} stroke="#b07050" strokeWidth={size * 0.018} fill="none" strokeLinecap="round" />
    </svg>
  );
};

/* ─── Arbeitgeber-Logos (lokal, von Wikimedia Commons) ─────────────────────── */
const EMPLOYER_LOGOS: Record<string, string> = {
  'Klinikum Mitte': '/assets/employers/klinikum-mitte.png',
  'AWO Berlin': '/assets/employers/awo.png',
  'Helios Kliniken': '/assets/employers/helios.png',
};

const CompanyLogo = ({ letter, bg, logo, size = 40 }: { letter: string; bg: string; logo?: string; size?: number }) => {
  const [imgError, setImgError] = useState(false);
  const showImg = logo && !imgError;
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: showImg ? 'transparent' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      {showImg ? (
        <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} onError={() => setImgError(true)} />
      ) : (
        <span style={{ color: 'white', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: size * 0.45 }}>{letter}</span>
      )}
    </div>
  );
};

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur border border-gray-200 px-3.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
    {children}
  </span>
);

const TypingDots = () => (
  <div className="flex gap-1 rounded-[18px] rounded-bl-md bg-gray-100 px-3.5 py-2.5">
    <span className="bv-dot1 block h-1.5 w-1.5 rounded-full bg-gray-400" />
    <span className="bv-dot2 block h-1.5 w-1.5 rounded-full bg-gray-400" />
    <span className="bv-dot3 block h-1.5 w-1.5 rounded-full bg-gray-400" />
  </div>
);

const ProfileCardIllustration = ({ seed, name, role, skills, matchPct }: { seed: number; name: string; role: string; skills: string[]; matchPct: number }) => (
  <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_8px_32px_rgba(81,112,255,.1)]">
    <div className="bg-gradient-to-br from-[#5170ff] to-[#7c3aed] px-5 py-3 pb-8">
      <div className="flex items-center gap-3">
        <div className="overflow-hidden rounded-full border-[3px] border-white/50">
          <Avatar seed={seed} size={52} />
        </div>
        <div>
          <p className="font-semibold text-white" style={{ fontFamily: 'Sora,sans-serif', fontSize: 16 }}>{name}</p>
          <p className="text-xs text-white/80">{role}</p>
        </div>
        <div className="ml-auto rounded-lg bg-white/15 px-2.5 py-1">
          <p className="text-xs font-semibold text-white">Offen für Jobs</p>
        </div>
      </div>
    </div>
    <div className="relative -mt-3.5 px-4 pb-5 pt-4">
      <div className="mb-2.5 rounded-xl border border-gray-100 bg-white p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="rounded-full bg-[#e8edff] px-2.5 py-0.5 text-[11px] font-semibold text-[#5170ff]">{s}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] text-gray-400">Profilstärke</p>
          <div className="bv-progress-bar w-[140px]">
            <div className="bv-progress-fill" style={{ width: `${matchPct}%` }} />
          </div>
        </div>
        <span className="rounded-full bg-gradient-to-br from-[#5170ff] to-[#7c3aed] px-3.5 py-1.5 text-[13px] font-bold text-white">{matchPct}%</span>
      </div>
    </div>
  </div>
);

const JobMatchCard = ({ letter, bg, company, role, pct, delay }: { letter: string; bg: string; company: string; role: string; pct: number; delay: number }) => (
  <div
    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,.05)]"
    style={{ animation: `fadeSlideUp .4s ${delay}s both` }}>
    <CompanyLogo letter={letter} bg={bg} logo={EMPLOYER_LOGOS[company]} size={38} />
    <div className="min-w-0 flex-1">
      <p className="truncate font-bold text-gray-900" style={{ fontFamily: 'Sora,sans-serif', fontSize: 13 }}>{company}</p>
      <p className="text-[11px] text-gray-400">{role}</p>
    </div>
    <div className={`flex-shrink-0 rounded-full px-2.5 py-1 ${pct > 90 ? 'bg-emerald-50' : 'bg-[#e8edff]'}`}>
      <span className={`font-bold text-[12px] ${pct > 90 ? 'text-emerald-600' : 'text-[#5170ff]'}`}>{pct}% Match</span>
    </div>
  </div>
);

const ChatMockup = () => (
  <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_16px_48px_rgba(81,112,255,.14)]">
    <div className="flex items-center gap-3 bg-gradient-to-br from-[#5170ff] to-[#3b56e8] px-4 py-3.5">
      <div className="relative">
        <div className="overflow-hidden rounded-full border-2 border-white/40">
          <Avatar seed={3} size={40} />
        </div>
        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
      </div>
      <div className="flex items-center gap-2.5">
        <img src="/assets/employers/klinikum-mitte.png" alt="" className="h-8 w-16 object-contain object-center" style={{ filter: 'brightness(0) invert(1)' }} />
        <div>
          <p className="font-bold text-white" style={{ fontFamily: 'Sora,sans-serif', fontSize: 14 }}>Klinikum Mitte</p>
          <p className="text-[11px] text-white/70">Personalmanagement · Online</p>
        </div>
      </div>
      <div className="ml-auto flex gap-1.5">
        {[1, 2, 3].map((i) => <div key={i} className="h-2 w-2 rounded-full bg-white/20" />)}
      </div>
    </div>
    <div className="flex min-h-[260px] flex-col gap-3 bg-gray-50 p-4">
      <div className="bv-chat-bubble-2 flex items-end gap-2">
        <div className="bv-chat-avatar-2 flex-shrink-0 overflow-hidden rounded-full"><Avatar seed={3} size={32} /></div>
        <div className="max-w-[75%] rounded-[18px] rounded-bl-md bg-white p-3.5 shadow-[0_1px_4px_rgba(0,0,0,.06)]">
          <p className="text-xs leading-relaxed text-gray-700">Hallo! Wir haben dein Profil gesehen – bist du noch auf Jobsuche? 😊</p>
        </div>
      </div>
      <div className="bv-chat-bubble-1 flex items-end justify-end gap-2">
        <div className="max-w-[75%] rounded-[18px] rounded-br-md bg-gradient-to-br from-[#5170ff] to-[#3b56e8] p-3.5 shadow-[0_4px_12px_rgba(81,112,255,.3)]">
          <p className="text-xs leading-relaxed text-white">Ja! Ich suche eine Stelle in der Intensivpflege 🙌</p>
        </div>
        <div className="bv-chat-avatar-1 flex-shrink-0 overflow-hidden rounded-full"><Avatar seed={1} size={32} /></div>
      </div>
      <div className="bv-chat-bubble-4 flex items-end gap-2">
        <div className="flex-shrink-0 overflow-hidden rounded-full"><Avatar seed={3} size={32} /></div>
        <div className="max-w-[75%] rounded-[18px] rounded-bl-md bg-white p-3.5 shadow-[0_1px_4px_rgba(0,0,0,.06)]">
          <p className="text-xs leading-relaxed text-gray-700">Perfekt! Wir haben genau eine offene Stelle. Wann könntest du ein Gespräch führen?</p>
        </div>
      </div>
      <div className="bv-chat-bubble-3 flex items-end justify-end gap-2">
        <div className="max-w-[75%] rounded-[18px] rounded-br-md bg-gradient-to-br from-[#5170ff] to-[#3b56e8] p-3.5 shadow-[0_4px_12px_rgba(81,112,255,.3)]">
          <p className="text-xs leading-relaxed text-white">Diese Woche wäre super – am liebsten Donnerstag 🎉</p>
        </div>
        <div className="flex-shrink-0 overflow-hidden rounded-full"><Avatar seed={1} size={32} /></div>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-shrink-0 overflow-hidden rounded-full"><Avatar seed={3} size={32} /></div>
        <TypingDots />
      </div>
    </div>
    <div className="flex items-center gap-2.5 border-t border-gray-100 bg-white p-3">
      <div className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-xs text-gray-400">Nachricht schreiben…</div>
      <div className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#5170ff] to-[#3b56e8] shadow-[0_4px_12px_rgba(81,112,255,.35)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </div>
    </div>
  </div>
);

const NetworkIllustration = () => (
  <div className="relative mx-auto h-[280px] w-[280px]">
    <div className="absolute inset-0 rounded-full border border-dashed border-[#5170ff]/25" />
    <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
      <div className="overflow-hidden rounded-full border-4 border-white shadow-[0_8px_32px_rgba(81,112,255,.25)]">
        <Avatar seed={1} size={72} />
      </div>
    </div>
    {[2, 4, 6].map((seed, i) => (
      <div key={i} className="bv-orbit-dot absolute left-[calc(50%-18px)] top-[calc(50%-18px)] border-2 border-white shadow-md" style={{ animationDelay: `${-i * 2.67}s` }}>
        <Avatar seed={seed} size={36} />
      </div>
    ))}
    <div className="bv-floatsm bv-float-label absolute -right-5 top-2.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-md">
      <p className="whitespace-nowrap text-[11px] font-bold text-gray-900">+38 heute beigetreten</p>
    </div>
    <div className="bv-float bv-float-label absolute -left-2.5 bottom-7 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-md">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
        <p className="whitespace-nowrap text-[11px] font-semibold text-gray-700">5.000+ Mitglieder</p>
      </div>
    </div>
  </div>
);

interface BeVisiblleLandingSectionsProps {
  onNewsletterSubmit?: (e: React.FormEvent) => void;
}

export default function BeVisiblleLandingSections({ onNewsletterSubmit }: BeVisiblleLandingSectionsProps) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setDone(true);
      onNewsletterSubmit?.(e);
    }
  };

  return (
    <div className="relative" style={{ background: 'linear-gradient(180deg, rgba(240,244,255,.6) 0%, #ffffff 15%, #ffffff 40%, rgba(250,245,255,.5) 55%, #ffffff 70%, rgba(240,244,255,.4) 85%, #ffffff 100%)' }}>
      <div style={{ position: 'absolute', top: '5%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(81,112,255,.04) 0%, transparent 55%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '45%', left: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.035) 0%, transparent 55%)', filter: 'blur(35px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(81,112,255,.03) 0%, transparent 50%)', filter: 'blur(35px)', pointerEvents: 'none' }} />

      {/* SECTION 1: SO FUNKTIONIERT'S */}
      <section className="py-16 md:py-20 relative" style={{ zIndex: 1 }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="bv-card-reveal mb-16 text-center">
            <Pill>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5170ff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              In 3 Schritten zum Job
            </Pill>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900 md:text-4xl lg:text-5xl" style={{ fontFamily: 'Sora,sans-serif', lineHeight: 1.15 }}>
              So einfach wird's gemacht.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-lg text-gray-600">
              Kein Vitamin B, keine Word-Vorlagen, kein Anschreiben-Stress.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bv-step-card bv-card-reveal overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
              <div className="relative bg-gradient-to-br from-[#5170ff] to-[#3b56e8] px-6 py-6 pb-7">
                <span className="absolute right-5 top-4 text-6xl font-extrabold text-white/10" style={{ fontFamily: 'Sora,sans-serif' }}>01</span>
                <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                </div>
                <h3 className="font-bold text-white" style={{ fontFamily: 'Sora,sans-serif', fontSize: 20 }}>Profil erstellen</h3>
                <p className="text-sm text-white/75">Lebenslauf in 5 Minuten – dein Profil geht live.</p>
              </div>
              <div className="p-5">
                <ProfileCardIllustration seed={1} name="Lisa Maier" role="Pflegefachkraft · Hamburg" skills={['Intensivpflege', 'Teamarbeit', 'Nachtwache']} matchPct={92} />
              </div>
            </div>
            <div className="bv-step-card bv-card-reveal bv-delay-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
              <div className="relative bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] px-6 py-6 pb-7">
                <span className="absolute right-5 top-4 text-6xl font-extrabold text-white/10" style={{ fontFamily: 'Sora,sans-serif' }}>02</span>
                <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white" style={{ fontFamily: 'Sora,sans-serif', fontSize: 20 }}>Sichtbar werden</h3>
                <p className="text-sm text-white/75">Arbeitgeber finden dich – du musst nicht suchen.</p>
              </div>
              <div className="flex flex-col gap-2.5 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Neue Matches für dich</p>
                <JobMatchCard letter="K" bg="linear-gradient(135deg,#5170ff,#3b56e8)" company="Klinikum Mitte" role="Pflegekraft Intensiv" pct={97} delay={0.3} />
                <JobMatchCard letter="A" bg="linear-gradient(135deg,#7c3aed,#6d28d9)" company="AWO Berlin" role="Pflegekraft Vollzeit" pct={91} delay={0.55} />
                <JobMatchCard letter="H" bg="linear-gradient(135deg,#059669,#047857)" company="Helios Kliniken" role="Fachkraft Geriatrie" pct={85} delay={0.8} />
              </div>
            </div>
            <div className="bv-step-card bv-card-reveal bv-delay-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
              <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-6 pb-7">
                <span className="absolute right-5 top-4 text-6xl font-extrabold text-white/10" style={{ fontFamily: 'Sora,sans-serif' }}>03</span>
                <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white" style={{ fontFamily: 'Sora,sans-serif', fontSize: 20 }}>Direkt connecten</h3>
                <p className="text-sm text-white/75">Schreib direkt – kein Anschreiben, kein Stress.</p>
              </div>
              <div className="p-5">
                <ChatMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto" style={{ maxWidth: 600, height: 1, background: 'linear-gradient(90deg, transparent, rgba(81,112,255,.12), rgba(124,58,237,.08), transparent)' }} />

      {/* SECTION 2: COMMUNITY ══════════════════════════════════════════ */}
      <section id="community" className="relative overflow-hidden py-16 md:py-20" style={{ zIndex: 1 }}>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(81,112,255,.08)_0%,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
            <div className="bv-card-reveal">
              <Pill>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5170ff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197" /></svg>
                Community & Netzwerk
              </Pill>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900 md:text-4xl lg:text-5xl" style={{ fontFamily: 'Sora,sans-serif', lineHeight: 1.2 }}>
                Mehr als Jobs.<br />
                <span className="bv-shine-text">Dein echtes Netzwerk.</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                Vernetze dich mit Kolleg:innen aus Pflege, Handwerk und mehr. Kein Vitamin B nötig – hier zählt, wer du bist und was du kannst.
              </p>
              <div className="mb-7 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 4, 5, 6].map((s, i) => (
                    <div key={s} className="overflow-hidden rounded-full border-[3px] border-white shadow-md" style={{ marginLeft: i ? -12 : 0 }}>
                      <Avatar seed={s} size={44} />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-bold text-gray-900" style={{ fontFamily: 'Sora,sans-serif', fontSize: 14 }}>+ 500 weitere Pfleger</p>
                  <div className="mt-1 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill="#facc15"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                    <span className="ml-1 text-xs text-gray-400">Bereits 5.000+ dabei</span>
                  </div>
                </div>
              </div>
              <div className="mb-9 flex flex-wrap gap-2">
                {['Pflegefachkraft', 'Elektriker:in', 'Erzieher:in', 'Mechatroniker', 'Koch / Köchin', 'Azubi Handwerk'].map((t) => (
                  <span key={t} className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs text-gray-700 shadow-sm">{t}</span>
                ))}
              </div>
              <Link to="/cv-generator" className="bv-pulse-cta inline-flex items-center gap-2 rounded-full bg-[#5170ff] px-7 py-3.5 font-bold text-white shadow-[0_8px_25px_rgba(81,112,255,.35)] transition hover:opacity-95" style={{ fontFamily: 'Sora,sans-serif', fontSize: 16 }}>
                Kostenlos Profil erstellen
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
            <div className="bv-card-reveal bv-delay-2 relative flex justify-center">
              <div className="relative w-full max-w-[340px]">
                <div className="bv-float mb-6">
                  <NetworkIllustration />
                </div>
                <div className="bv-match-badge absolute -right-2.5 top-5 hidden sm:flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
                  <img src="/assets/employers/klinikum-mitte.png" alt="" className="h-9 w-12 object-contain flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900" style={{ fontFamily: 'Sora,sans-serif', fontSize: 13 }}>97% Match!</p>
                    <p className="text-[11px] text-gray-400">Klinikum Mitte</p>
                  </div>
                </div>
                <div className="bv-msg-badge absolute -left-5 bottom-10 hidden sm:flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#5170ff] to-[#3b56e8] p-4 shadow-[0_8px_24px_rgba(81,112,255,.3)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25S3 16.556 3 12 7.03 3.75 12 3.75 21 7.444 21 12z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-white" style={{ fontFamily: 'Sora,sans-serif', fontSize: 13 }}>Neue Nachricht</p>
                    <p className="text-[11px] text-white/75">Handwerk GmbH schreibt dir</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto" style={{ maxWidth: 600, height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,.10), rgba(81,112,255,.10), transparent)' }} />

      {/* SECTION 3: TESTIMONIALS */}
      <section className="py-16 md:py-20 relative" style={{ zIndex: 1 }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="bv-card-reveal mb-14 text-center">
            <Pill>Stimmen aus der Community</Pill>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900 md:text-4xl lg:text-5xl" style={{ fontFamily: 'Sora,sans-serif', lineHeight: 1.2 }}>
              Echte Menschen, echte Erfolge.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { seed: 1, name: 'Lisa M.', role: 'Pflegefachkraft · Hamburg', quote: 'Innerhalb einer Woche hatte ich 3 Jobangebote. Das hat mir noch kein anderes Portal geboten.' },
              { seed: 2, name: 'Tobias R.', role: 'Elektriker · München', quote: 'Endlich eine Plattform die versteht was Handwerker brauchen. Mein Profil hat den Rest erledigt.' },
              { seed: 3, name: 'Sara N.', role: 'Erzieherin · Berlin', quote: 'Der Chat mit dem Träger war so entspannt – wie mit einem Kollegen schreiben, nicht wie eine Bewerbung.' },
            ].map((t, i) => (
              <div key={i} className={`bv-step-card bv-card-reveal rounded-2xl border border-gray-200 bg-white p-7 shadow-md ${i === 1 ? 'bv-delay-1' : i === 2 ? 'bv-delay-2' : ''}`}>
                <div className="mb-4 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <svg key={j} width="16" height="16" viewBox="0 0 20 20" fill="#facc15"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-gray-600">"{t.quote}"</p>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div className="flex-shrink-0 overflow-hidden rounded-full"><Avatar seed={t.seed} size={44} /></div>
                  <div>
                    <p className="font-bold text-gray-900" style={{ fontFamily: 'Sora,sans-serif', fontSize: 14 }}>{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-3xl bg-[#5170ff] p-8 shadow-[0_20px_60px_rgba(81,112,255,.35)] md:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/5" />
            <div className="relative z-10 grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="text-2xl font-extrabold text-white md:text-3xl" style={{ fontFamily: 'Sora,sans-serif', lineHeight: 1.2 }}>
                  Jobs & Updates,<br />direkt zu dir.
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  Neue Features, passende Jobs und Community-Highlights – kein Spam, nur das Beste.
                </p>
              </div>
              <div>
                {done ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/15 px-5 py-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="font-semibold text-white">Du bist dabei – wir melden uns bald! 🎉</p>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex flex-wrap gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.de"
                      required
                      className="min-w-[180px] flex-1 rounded-full border border-white/25 bg-white/15 px-5 py-3 text-sm text-white placeholder:text-white/60 outline-none backdrop-blur-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-white px-6 py-3 font-bold text-[#5170ff] shadow-md transition hover:opacity-95"
                      style={{ fontFamily: 'Sora,sans-serif', fontSize: 14 }}
                    >
                      Abonnieren
                    </button>
                  </form>
                )}
                <p className="mt-2.5 text-[11px] text-white/55">Jederzeit abmeldbar. Infos in unserer Datenschutzerklärung.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
