import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  CreditCard,
  Gift,
  Receipt,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';

export type SectionHeroTheme =
  | 'member'
  | 'contributions'
  | 'payments'
  | 'members'
  | 'expenses'
  | 'reports'
  | 'settings'
  | 'referrals'
  | 'security';

interface SectionHeroProps {
  theme: SectionHeroTheme;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  detail?: string;
}

const scenes = {
  member: { icon: Wallet, one: CalendarDays, two: Check, caption: 'Mes cotisations', detail: 'Tout au même endroit' },
  contributions: { icon: CircleDollarSign, one: CalendarDays, two: Users, caption: 'Collecte commune', detail: 'Cycles et échéances' },
  payments: { icon: CreditCard, one: Check, two: ArrowDownLeft, caption: 'Paiements suivis', detail: 'Wave · Orange Money · Espèces' },
  members: { icon: Users, one: Users, two: ArrowUpRight, caption: 'Force du collectif', detail: 'Chaque membre compte' },
  expenses: { icon: Receipt, one: ArrowUpRight, two: Check, caption: 'Caisse organisée', detail: 'Chaque sortie est tracée' },
  reports: { icon: BarChart3, one: ArrowDownLeft, two: ArrowUpRight, caption: 'Vue d’ensemble', detail: 'Des chiffres plus lisibles' },
  settings: { icon: Building2, one: ShieldCheck, two: Check, caption: 'Votre organisation', detail: 'Réglages et sécurité' },
  referrals: { icon: Gift, one: Users, two: ArrowUpRight, caption: 'Le réseau Cotiz', detail: 'Grandissons ensemble' },
  security: { icon: ShieldCheck, one: Building2, two: Check, caption: 'Cotiz Global', detail: 'Confiance et supervision' },
} satisfies Record<SectionHeroTheme, { icon: React.ElementType; one: React.ElementType; two: React.ElementType; caption: string; detail: string }>;

export const SectionHero: React.FC<SectionHeroProps> = ({
  theme,
  eyebrow,
  title,
  description,
  action,
  detail,
}) => {
  const scene = scenes[theme];
  const MainIcon = scene.icon;
  const OneIcon = scene.one;
  const TwoIcon = scene.two;

  return (
    <section className={`section-hero section-hero-${theme}`}>
      <div className="section-hero-copy">
        <div className="section-hero-eyebrow"><span />{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
        {detail && <div className="section-hero-detail">{detail}</div>}
        {action && <div className="section-hero-action">{action}</div>}
      </div>

      <div className="section-hero-scene" aria-hidden="true">
        <div className="section-scene-orbit section-scene-orbit-one" />
        <div className="section-scene-orbit section-scene-orbit-two" />
        <div className="section-scene-ground" />
        <div className="section-scene-core"><MainIcon /></div>
        <div className="section-scene-card section-scene-card-top"><span><OneIcon /></span><b>{scene.caption}</b></div>
        <div className="section-scene-card section-scene-card-bottom"><span><TwoIcon /></span><b>{scene.detail}</b></div>
        <div className="section-scene-coin section-scene-coin-one">C</div>
        <div className="section-scene-coin section-scene-coin-two">+</div>
        <svg className="section-scene-line" viewBox="0 0 400 180" fill="none">
          <path d="M16 140c61-6 51-83 117-69s71 91 128 55 64-77 123-63" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="261" cy="126" r="7" fill="white" stroke="currentColor" strokeWidth="3" />
        </svg>
      </div>
      <div className="section-hero-orb" />
    </section>
  );
};
