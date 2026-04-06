import { useTranslation } from 'react-i18next';
import PageTemplate from '../PageTemplate';

const objectives = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-10 md:size-14">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
    ),
    title: 'roots.quem_somos.obj_monitorizar',
    desc: 'roots.quem_somos.obj_monitorizar_desc',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-10 md:size-14">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
      </svg>
    ),
    title: 'roots.quem_somos.obj_produzir',
    desc: 'roots.quem_somos.obj_produzir_desc',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-10 md:size-14">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'roots.quem_somos.obj_disponibilizar',
    desc: 'roots.quem_somos.obj_disponibilizar_desc',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-10 md:size-14">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
        <path d="m18 15-2-2" /><path d="m15 18-2-2" />
      </svg>
    ),
    title: 'roots.quem_somos.obj_promover',
    desc: 'roots.quem_somos.obj_promover_desc',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-10 md:size-14">
        <path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
      </svg>
    ),
    title: 'roots.quem_somos.obj_reforcar',
    desc: 'roots.quem_somos.obj_reforcar_desc',
  },
];

export default function QuemSomos() {
  const { t } = useTranslation();

  return (
    <PageTemplate>
      <div className="max-w-[1512px] mx-auto px-6 md:px-12 pb-16 md:pb-24 flex flex-col gap-16 md:gap-24">
        {/* Quem Somos section */}
        <section className="flex flex-col lg:flex-row items-start gap-8 lg:gap-14">
          <div className="flex flex-col gap-4 md:gap-6 lg:max-w-[55%]">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
              {t('roots.quem_somos.title')}
            </h1>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
              {t('roots.quem_somos.intro_p1')}
            </p>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
              {t('roots.quem_somos.intro_p2')}
            </p>
          </div>
          <div className="relative w-full lg:w-2/5 shrink-0" style={{ containerType: 'inline-size' }}>
            <img
              src="/assets/roots/quem-somos-hero.png"
              alt={t('roots.quem_somos.title')}
              className="w-[96%] ml-auto aspect-square object-cover rounded-2xl"
            />
            {/* Decorative ring + earth icon — positioned as % of container so it scales with image */}
            <div className="absolute bottom-[3%] left-0 w-[17%] aspect-square">
              <div className="absolute inset-0 bg-base-100 rounded-full" />
              <div className="absolute inset-[7%] bg-primary rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[60%] h-[60%]">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Missao e Visao */}
        <section className="flex flex-col md:flex-row gap-8 lg:gap-16 xl:gap-24">
          <div className="flex-1 flex flex-col gap-4 md:gap-6 items-center">
            <img
              src="/assets/roots/missao.png"
              alt={t('roots.quem_somos.missao_title')}
              className="w-full aspect-[3/2] lg:aspect-[4/3] object-cover rounded-2xl"
            />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content text-center">
              {t('roots.quem_somos.missao_title')}
            </h2>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content text-center">
              {t('roots.quem_somos.missao_desc')}
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-4 md:gap-6 items-center">
            <img
              src="/assets/roots/visao.png"
              alt={t('roots.quem_somos.visao_title')}
              className="w-full aspect-[3/2] lg:aspect-[4/3] object-cover rounded-2xl"
            />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content text-center">
              {t('roots.quem_somos.visao_title')}
            </h2>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content text-center">
              {t('roots.quem_somos.visao_desc')}
            </p>
          </div>
        </section>

        {/* Objetivos */}
        <section className="flex flex-col gap-8 md:gap-12 lg:gap-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
            {t('roots.quem_somos.objetivos_title')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
            {objectives.map((obj, i) => (
              <div key={i} className="flex flex-col gap-3 md:gap-4 items-center text-center">
                <div className="bg-primary size-20 md:size-24 lg:size-28 rounded-full flex items-center justify-center text-white">
                  {obj.icon}
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight tracking-tight text-base-content">
                  {t(obj.title)}
                </h3>
                <p className="text-sm md:text-base lg:text-lg font-medium leading-normal text-base-content">
                  {t(obj.desc)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageTemplate>
  );
}
