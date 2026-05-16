import { useTranslation } from 'react-i18next';
import PageTemplate from '../PageTemplate';

export default function Territorio() {
  const { t } = useTranslation();

  return (
    <PageTemplate>
      <div className="bg-[#f3f4f6]">
        <div className="max-w-[1512px] mx-auto px-6 md:px-12 pb-16 md:pb-24 flex flex-col gap-16 md:gap-24 overflow-x-hidden font-['Onest']">
          {/* A Area de Monitorizacao */}
          <section className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-between">
            <div className="flex-1 flex flex-col gap-6 max-w-[845px]">
              <h1 className="text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-none tracking-[-0.48px] text-[#0a0a0a]">
                {t('roots.territorio.area_title')}
              </h1>
              <p className="text-base md:text-lg lg:text-2xl leading-[1.5] text-[#0a0a0a]">
                {t('roots.territorio.area_p1')}
              </p>
              <p className="text-base md:text-lg lg:text-2xl leading-[1.5] text-[#0a0a0a]">
                {t('roots.territorio.area_p2')}
              </p>
            </div>
            <div className="w-full max-w-[445px] aspect-square shrink-0 mx-auto lg:mx-0">
              <img
                src="/assets/roots/territorio-mapa.png"
                alt={t('roots.territorio.area_title')}
                className="w-full h-full object-cover rounded-[12px]"
              />
            </div>
          </section>

          {/* Caracterizacao do Territorio */}
          <section className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
            <img
              src="/assets/roots/territorio-caracterizacao.png"
              alt={t('roots.territorio.caract_title')}
              className="w-full lg:w-[618px] h-auto lg:h-[444px] aspect-[4/3] lg:aspect-auto object-cover rounded-2xl shrink-0"
            />
            <div className="flex-1 flex flex-col gap-6 lg:text-right">
              <h2 className="text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-none tracking-[-0.48px] text-[#0a0a0a]">
                {t('roots.territorio.caract_title')}
              </h2>
              <p className="text-base md:text-lg lg:text-2xl leading-[1.5] text-[#0a0a0a]">
                {t('roots.territorio.caract_desc')}
              </p>
            </div>
          </section>

          {/* Recursos Turisticos */}
          <section className="flex flex-col lg:flex-row gap-8 items-stretch">
            <div className="flex-1 flex flex-col justify-between gap-8">
              <div className="flex flex-col gap-6">
                <h2 className="text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-none tracking-[-0.48px] text-[#0a0a0a]">
                  {t('roots.territorio.recursos_title')}
                </h2>
                <p className="text-base md:text-lg lg:text-2xl leading-[1.5] text-[#0a0a0a]">
                  {t('roots.territorio.recursos_desc')}
                </p>
              </div>
              <img
                src="/assets/roots/territorio-recursos1.png"
                alt={t('roots.territorio.recursos_title')}
                className="w-full aspect-[3/2] object-cover rounded-[20px]"
              />
            </div>
            <div className="flex flex-col gap-8 w-full lg:w-[618px] shrink-0">
              <img
                src="/assets/roots/territorio-recursos2.png"
                alt={t('roots.territorio.recursos_title')}
                className="w-full aspect-[2/1] object-cover rounded-2xl"
              />
              <img
                src="/assets/roots/territorio-recursos3.png"
                alt={t('roots.territorio.recursos_title')}
                className="w-full aspect-[3/2] object-cover rounded-2xl"
              />
            </div>
          </section>
        </div>
      </div>
    </PageTemplate>
  );
}
