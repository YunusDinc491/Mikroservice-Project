import type { ReactNode } from 'react';
import { ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import Animate from '@/components/Animate';
import Logo from '@/components/Logo';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Canlı piyasa verisi',
    desc: 'Anlık fiyatlarla portföyünüzü güncel takip edin',
  },
  {
    icon: ShieldCheck,
    title: 'Güvenli altyapı',
    desc: 'JWT tabanlı kimlik doğrulama ve izole hesaplar',
  },
  {
    icon: Zap,
    title: 'Hızlı işlem',
    desc: 'Saniyeler içinde alım satım emirlerinizi gerçekleştirin',
  },
];

interface AuthLayoutProps {
  leftHeading: string;
  leftSubtext: string;
  navAction: { label: string; href: string };
  children: ReactNode;
}

export default function AuthLayout({ leftHeading, leftSubtext, navAction, children }: AuthLayoutProps) {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-[#080A19]">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/video/hero-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-[#080A19]/60 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <nav className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] pt-[20px] sm:pt-[30px] flex items-center justify-between">
          <Animate delay={0} direction="down">
            <a href="/" className="flex items-center gap-2.5">
              <Logo />
              <span className="text-white text-[22px] sm:text-[26px] font-[450] leading-none tracking-[-0.02em]">
                Finanshane
              </span>
            </a>
          </Animate>

          <Animate delay={150} direction="down">
            <a
              href={navAction.href}
              className="h-[44px] sm:h-[46px] px-5 sm:px-6 flex items-center rounded-[11px] border border-white/25 text-white text-[13px] sm:text-[14px] font-[450] leading-[14px] backdrop-blur-[17px] bg-[rgba(10,7,7,0.35)] transition-colors hover:bg-white/10"
            >
              {navAction.label}
            </a>
          </Animate>
        </nav>

        <div className="flex-1 flex items-center py-10 sm:py-8">
          <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-16">
            <div className="max-w-[560px] hidden lg:block">
              <Animate delay={300} direction="up">
                <h1 className="text-white text-[52px] xl:text-[64px] font-normal leading-[0.98] mb-8 tracking-[-0.01em]">
                  {leftHeading}
                </h1>
              </Animate>
              <Animate delay={500} direction="up">
                <p className="text-white/80 text-[18px] xl:text-[20px] font-[450] leading-[1.4] max-w-[440px] mb-10">
                  {leftSubtext}
                </p>
              </Animate>

              <Animate delay={700} direction="up">
                <div className="flex flex-col gap-5">
                  {FEATURES.map((feature) => (
                    <div key={feature.title} className="flex items-center gap-4">
                      <div className="w-[42px] h-[42px] flex items-center justify-center rounded-[11px] bg-white/[0.06] border border-white/10 shrink-0">
                        <feature.icon className="w-[18px] h-[18px] text-white/80" />
                      </div>
                      <div>
                        <p className="text-white text-[15px] font-[450] leading-[18px]">
                          {feature.title}
                        </p>
                        <p className="text-white/50 text-[13px] font-[450] leading-[16px] mt-0.5">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Animate>
            </div>

            <Animate delay={250} direction="up" className="lg:hidden">
              <h1 className="text-white text-[36px] sm:text-[44px] font-normal leading-[1.02] mb-3 tracking-[-0.01em]">
                {leftHeading}
              </h1>
              <p className="text-white/70 text-[15px] sm:text-[16px] font-[450] leading-[1.4] max-w-[420px]">
                {leftSubtext}
              </p>
            </Animate>

            <Animate delay={900} direction="scale" className="w-full max-w-[440px] mx-auto lg:mx-0">
              {children}
            </Animate>
          </div>
        </div>
      </div>
    </section>
  );
}
