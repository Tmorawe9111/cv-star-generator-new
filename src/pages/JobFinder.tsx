import React from 'react';
import { DarkLandingLayout } from '@/components/landing/DarkLandingLayout';
import ConversationalFinder from '@/components/finder/ConversationalFinder';
import FAQSection from '@/components/common/FAQSection';
import { JOB_FINDER_FAQ } from '@/config/jobFinderFaq';

export default function JobFinder() {
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
              Dein Job-Finder ohne Studium
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
              Finde Jobs, die zu deinem Leben passen.
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
              Egal ob Quereinstieg, Neustart oder der erste Job: der BeVisiblle Coach zeigt dir Branchen und Jobs, die zu
              deinen Antworten passen – ohne Lebenslauf und ohne Studium.
            </p>
          </div>
        </section>

        <section style={{ padding: '8px 0 0' }}>
          <ConversationalFinder audience="job" mode="hybrid" />
        </section>

        <FAQSection
          title="Häufige Fragen zu Jobs ohne Studium"
          items={JOB_FINDER_FAQ}
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
                Du willst echte Erfahrungen hören? In der BeVisiblle Community teilen Menschen ohne Studium ihren Weg –
                mit allen Höhen und Tiefen.
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
                Community öffnen
              </a>
            </div>
          }
        />
      </main>
    </DarkLandingLayout>
  );
}

