import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { COMPANY_PRICING_TIERS } from '@/config/companyPricing';

type BillingCycle = 'monthly' | 'yearly';

export default function CompanyPricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  return (
    <section id="pricing" className="scroll-mt-24 rounded-3xl overflow-hidden py-16 px-4 md:px-8 relative" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1040 50%, #0f172a 100%)' }}>
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(81,112,255,.08) 0%, transparent 55%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.06) 0%, transparent 50%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
      <div className="mx-auto max-w-5xl relative" style={{ zIndex: 1 }}>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Simple, transparente Preise</h2>
          <p className="mt-2" style={{ color: 'rgba(148,163,184,.8)' }}>Flexibel wechseln – keine versteckten Kosten.</p>

          <div className="mt-6 inline-flex rounded-full bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition ${
                billingCycle === 'monthly' ? 'bg-[#5170ff] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monatlich
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition ${
                billingCycle === 'yearly' ? 'bg-[#5170ff] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Jährlich
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {COMPANY_PRICING_TIERS.map((tier) => {
            const isPopular = tier.id === 'pro';
            const price = tier.price.monthly != null
              ? (billingCycle === 'yearly' ? tier.price.yearly! : tier.price.monthly)
              : null;
            const period = billingCycle === 'yearly' ? 'Jahr' : 'Monat';
            const isEnterprise = tier.id === 'enterprise';
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border px-6 py-8 text-left transition ${
                  isPopular
                    ? 'bg-slate-800/80 border-[#5170ff] ring-2 ring-[#5170ff]/30'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#5170ff] text-white text-xs font-semibold">
                    {tier.badge}
                  </div>
                )}
                <h3 className="text-xl font-semibold text-white">{tier.title}</h3>
                <div className="mt-3 text-2xl md:text-3xl font-bold text-white">
                  {isEnterprise ? (
                    'Kontaktiere uns'
                  ) : (
                    <>
                      €{price}
                      <span className="text-base font-normal text-slate-400"> /{period}</span>
                    </>
                  )}
                </div>
                {tier.description && (
                  <p className="mt-2 text-sm text-slate-400">{tier.description}</p>
                )}

                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className={`h-4 w-4 flex-shrink-0 ${isPopular ? 'text-[#5170ff]' : 'text-slate-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier.ctaHref.startsWith('http') ? (
                  <a
                    href={tier.ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                      isPopular
                        ? 'bg-[#5170ff] text-white hover:bg-[#3d5fe6]'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    {tier.ctaLabel}
                  </a>
                ) : (
                  <Link
                    to={tier.ctaHref.includes('unternehmensregistrierung') ? `${tier.ctaHref}&billing=${billingCycle}` : tier.ctaHref}
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                      isPopular
                        ? 'bg-[#5170ff] text-white hover:bg-[#3d5fe6]'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    {tier.ctaLabel}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
