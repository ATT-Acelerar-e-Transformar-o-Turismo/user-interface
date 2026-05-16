import { useTranslation } from 'react-i18next';
import PageTemplate from '../PageTemplate';

export default function Governanca() {
  const { t } = useTranslation();

  return (
    <PageTemplate>
      <div className="bg-[#f3f4f6]">
        <div className="max-w-[1512px] mx-auto px-6 md:px-12 pb-16 md:pb-24 flex flex-col gap-16 md:gap-24 font-['Onest']">
          {/* Intro: text + hero image */}
          <section className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
            <div className="flex-1 flex flex-col gap-6">
              <h1 className="text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-none tracking-[-0.48px] text-[#0a0a0a]">
                {t('roots.governanca.title')}
              </h1>
              <p className="text-base md:text-lg lg:text-2xl leading-[1.5] text-[#0a0a0a]">
                {t('roots.governanca.intro')}
              </p>
            </div>
            <img
              src="/assets/roots/governanca-hero.png"
              alt={t('roots.governanca.title')}
              className="w-full lg:w-[598px] aspect-[3/2] object-cover rounded-[14px] shadow-[0px_0px_3.573px_2.382px_rgba(0,0,0,0.05)] shrink-0"
            />
          </section>

          {/* Modelo de Governança — coming-soon-style with lighthouse illustration */}
          <section className="flex flex-col gap-12 items-stretch">
            <h2 className="text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-none tracking-[-0.48px] text-[#0a0a0a]">
              {t('roots.governanca.modelo_title')}
            </h2>

            <div className="flex flex-col items-center gap-14 py-8">
              <img
                src="/illustrations/governanca-lighthouse.png"
                alt={t('roots.governanca.illustration_alt')}
                className="w-full max-w-[523px] h-auto select-none pointer-events-none"
                draggable={false}
              />

              <div className="flex flex-col items-center gap-4 text-center max-w-[520px]">
                <p className="text-[36px] md:text-[44px] lg:text-[48px] font-semibold leading-none tracking-[-0.48px] text-[#0a0a0a]">
                  {t('roots.governanca.almost_ready_title')}
                </p>
                <p className="text-base md:text-lg lg:text-2xl leading-[1.5] text-[#0a0a0a]">
                  {t('roots.governanca.almost_ready_desc')}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageTemplate>
  );
}
