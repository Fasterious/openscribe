'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { WaveformAnimation } from '@/components/ui/waveform-animation';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { useTranslation } from '@/lib/i18n/context';

const MODULES = [
  {
    href: '/transcription',
    titleKey: 'landing.modules.transcription.title' as const,
    descKey: 'landing.modules.transcription.description' as const,
    icon: (
      <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    href: '/workshop',
    titleKey: 'landing.modules.workshop.title' as const,
    descKey: 'landing.modules.workshop.description' as const,
    icon: (
      <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/csv-analysis',
    titleKey: 'landing.modules.csv.title' as const,
    descKey: 'landing.modules.csv.description' as const,
    icon: (
      <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    num: '1',
    titleKey: 'landing.howItWorks.step1.title' as const,
    descKey: 'landing.howItWorks.step1.description' as const,
    icon: (
      <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    num: '2',
    titleKey: 'landing.howItWorks.step2.title' as const,
    descKey: 'landing.howItWorks.step2.description' as const,
    icon: (
      <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
  },
  {
    num: '3',
    titleKey: 'landing.howItWorks.step3.title' as const,
    descKey: 'landing.howItWorks.step3.description' as const,
    icon: (
      <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 pt-16 pb-12 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {t('landing.hero.title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            <div className="pt-2">
              <Link
                href="/transcription"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                {t('landing.hero.cta')}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Module cards */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {MODULES.map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
              >
                <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  {mod.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t(mod.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(mod.descKey)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                  {t('landing.modules.cta')}
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            {t('landing.howItWorks.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step) => (
              <div key={step.num} className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-foreground">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="mt-auto">
        <WaveformAnimation className="opacity-60" />
      </div>

      <footer className="bg-card/50 backdrop-blur-sm border-t border-border/30">
        <div className="container mx-auto px-4 py-5">
          <p className="text-center text-sm text-muted-foreground">
            {t('footer.text')}
          </p>
        </div>
      </footer>

      <FeedbackButton />
    </div>
  );
}
