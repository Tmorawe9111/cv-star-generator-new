import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  items: FAQItem[];
  afterContent?: React.ReactNode;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ title, items, afterContent }) => {
  return (
    <section style={{ padding: '32px 0 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.04em',
            margin: '0 0 12px',
          }}
        >
          {title}
        </h2>
        <div
          style={{
            borderRadius: 20,
            border: '1px solid rgba(148,163,184,.4)',
            background: 'rgba(15,23,42,.9)',
            boxShadow: '0 14px 40px rgba(15,23,42,.8)',
            padding: '14px 16px 10px',
          }}
        >
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, idx) => (
              <li key={item.question}>
                <details
                  style={{
                    borderRadius: 12,
                    padding: '8px 10px',
                    background: 'rgba(15,23,42,1)',
                    border: '1px solid rgba(30,64,175,.5)',
                  }}
                  open={idx === 0}
                >
                  <summary
                    style={{
                      cursor: 'pointer',
                      listStyle: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(226,232,240,1)',
                    }}
                  >
                    {item.question}
                  </summary>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(148,163,184,1)', lineHeight: 1.6 }}>
                    {item.answer}
                  </p>
                </details>
              </li>
            ))}
          </ul>
          {afterContent && <div style={{ marginTop: 14 }}>{afterContent}</div>}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

