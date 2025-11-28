import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CareerHubHeroProps {
  headline: string;
  headlineExtra?: string;
  subtitle: string;
  description: string;
  heroImage: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function CareerHubHero({
  headline,
  headlineExtra,
  subtitle,
  description,
  heroImage,
  ctaText = 'Jetzt registrieren',
  ctaLink = '/cv-generator'
}: CareerHubHeroProps) {
  return (
    <section className="relative pt-28 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight"
          >
            {headline}{' '}
            {headlineExtra && (
              <span className="whitespace-nowrap">{headlineExtra}{' '}</span>
            )}
            <span className="text-[#5170ff]">BeVisiblle</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-2 text-lg md:text-2xl text-gray-800"
          >
            {subtitle}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-gray-600 max-w-2xl mx-auto"
          >
            {description}
          </motion.p>

          {/* CTA + Profile cluster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex items-center justify-center gap-4 flex-wrap"
          >
            <Link 
              to={ctaLink}
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              style={{ 
                background: '#5170ff', 
                boxShadow: '0 8px 25px rgba(81,112,255,0.35)' 
              }}
            >
              {ctaText}
            </Link>
            
            {/* Profile Cluster */}
            <div className="inline-flex items-center gap-3">
              <img src="/assets/Cluster1.png" alt="Profile Cluster" className="h-10 w-auto object-contain" />
              <span className="text-xs font-medium text-gray-700 tracking-wide">+345 weitere Profile</span>
            </div>
          </motion.div>
        </div>

        {/* Hero-Bild */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mt-8 flex justify-center overflow-hidden"
          style={{ maxHeight: '500px' }}
        >
          <img 
            src={heroImage} 
            alt={headline}
            className="w-full h-full object-cover object-center"
            style={{ 
              objectFit: 'cover',
              objectPosition: 'center 20%',
              maxHeight: '500px'
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}

