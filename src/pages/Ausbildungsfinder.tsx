import React from 'react';
import { DarkLandingLayout } from '@/components/landing/DarkLandingLayout';
import ConversationalFinder from '@/components/finder/ConversationalFinder';
import FAQSection from '@/components/common/FAQSection';
import { AUSBILDUNG_FAQ } from '@/config/ausbildungFaq';

export default function Ausbildungsfinder() {
  return (
    <DarkLandingLayout ctaText="Profil anlegen" ctaLink="/cv-generator">
      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <section style={{ padding: '32px 0 12px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <p
              style={{
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'rgba(148,163,184,1)',
                margin: 0,
              }}
            >
              Dein Ausbildungsfinder
            </p>
            <h1
              style={{
                fontSize: 'clamp(26px,3.4vw,36px)',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                color: 'white',
                margin: '10px 0 8px',
              }}
            >
              Finde die Ausbildung, die wirklich zu dir passt.
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(148,163,184,1)',
                margin: '0 auto',
                maxWidth: 520,
                lineHeight: 1.7,
              }}
            >
              In wenigen Fragen zeigt dir der BeVisiblle Coach passende Richtungen, echte Einblicke und nächste Schritte –
              auch wenn du noch keine genaue Vorstellung hast.
            </p>
          </div>
        </section>

        <section style={{ padding: '8px 0 0' }}>
          <ConversationalFinder audience="ausbildung" mode="hybrid" />
        </section>

        <FAQSection
          title="Fragen rund um Ausbildung & Neustart"
          items={AUSBILDUNG_FAQ}
          afterContent={
            <div
              style={{
                marginTop: 4,
                paddingTop: 10,
                borderTop: '1px solid rgba(30,64,175,.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(148,163,184,1)', lineHeight: 1.6 }}>
                Wenn du noch Fragen hast: In der Community erzählen Azubis und Fachkräfte, wie sie ihren Weg gefunden
                haben – ehrlich und ohne Hochglanz.
              </p>
              <a
                href="/community"
                style={{
                  marginTop: 6,
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,.6)',
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'rgba(226,232,240,1)',
                  textDecoration: 'none',
                }}
              >
                In die Community wechseln
              </a>
            </div>
          }
        />
      </main>
    </DarkLandingLayout>
  );
}

