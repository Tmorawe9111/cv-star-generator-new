import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CAREER_BRANCHES } from '@/config/careerBranches';

export default function CareerFieldsSection() {
  return (
    <section className="w-full py-16 md:py-24 relative overflow-hidden" style={{ background: '#f8f9fb' }}>
      <div
        style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 600,
          background: 'radial-gradient(ellipse, rgba(81,112,255,.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div className="mx-auto px-4 md:px-6 relative z-10" style={{ maxWidth: 1120 }}>
        <div className="text-center mb-16">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold"
            style={{ borderColor: 'rgba(81,112,255,0.25)', background: 'rgba(81,112,255,0.06)', color: '#5170ff' }}
          >
            Deine Karriere bei BeVisiblle
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mt-5 mb-4 leading-tight"
            style={{ color: '#0f172a', letterSpacing: '-0.025em' }}
          >
            <span style={{ color: '#5170ff' }}>Dein Talent.</span> Dein Match.<br />
            Deine Zukunft.
          </h2>
          <p className="text-base md:text-lg max-w-[520px] mx-auto leading-relaxed" style={{ color: '#64748b' }}>
            Vernetze dich mit anderen aus deiner Branche. Wenn du auf der Suche nach einem neuen Job bist, schalte dein Profil einfach sichtbar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CAREER_BRANCHES.map((field) => (
            <Link
              key={field.id}
              to={field.link}
              className="group block rounded-[20px] overflow-hidden no-underline text-inherit transition-all duration-300 hover:-translate-y-2"
              style={{
                background: '#fff',
                border: '1px solid #e8ebf0',
                boxShadow: '0 2px 16px rgba(0,0,0,.04)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 20px 56px ${field.accent}20, 0 4px 16px rgba(0,0,0,.06)`; e.currentTarget.style.borderColor = `${field.accent}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,.04)'; e.currentTarget.style.borderColor = '#e8ebf0'; }}
            >
              <div
                className="relative flex items-end justify-center overflow-hidden"
                style={{ height: 300, background: `linear-gradient(160deg, ${field.accent}08 0%, ${field.accent}15 40%, ${field.accent}06 100%)` }}
              >
                <div
                  style={{
                    position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)',
                    width: 200, height: 200, borderRadius: '50%',
                    background: `radial-gradient(circle, ${field.accent}12 0%, transparent 70%)`,
                    filter: 'blur(30px)', pointerEvents: 'none',
                  }}
                />
                <div className="relative z-[2] flex items-end justify-center" style={{ width: '85%', height: 300, marginBottom: -4 }}>
                  <img
                    src={field.image}
                    alt={field.title}
                    className="max-h-full w-auto object-contain object-bottom transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.12)) drop-shadow(0 2px 6px rgba(0,0,0,.08))' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                  background: 'linear-gradient(to top, #fff 10%, rgba(255,255,255,.6) 50%, transparent 100%)',
                  pointerEvents: 'none', zIndex: 3,
                }} />
              </div>

              <div className="flex-1 flex flex-col px-5 pt-3 pb-5">
                <h3 className="text-[17px] font-bold mb-1" style={{ letterSpacing: '-0.4px', color: '#0f172a' }}>
                  {field.title}
                </h3>
                <p className="text-[11px] font-semibold mb-2.5" style={{ color: field.accent }}>
                  {field.subline}
                </p>
                <p className="text-[13px] leading-relaxed mb-4 flex-1" style={{ color: '#64748b' }}>
                  {field.description}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold w-fit transition-all duration-200 group-hover:gap-2.5"
                  style={{ color: field.accent }}
                >
                  {field.buttonText}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
