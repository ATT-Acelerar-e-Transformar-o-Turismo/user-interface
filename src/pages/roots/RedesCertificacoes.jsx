import { useTranslation } from 'react-i18next';
import PageTemplate from '../PageTemplate';

export default function RedesCertificacoes() {
  const { t } = useTranslation();

  return (
    <PageTemplate>
      <div className="max-w-[1512px] mx-auto px-6 md:px-12 pb-16 md:pb-24 flex flex-col gap-16 md:gap-24">
        {/* Redes e Certificacoes */}
        <section className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          <div className="flex-1 flex flex-col gap-4 md:gap-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
              {t('roots.redes.title')}
            </h1>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
              {t('roots.redes.intro')}
            </p>
            <div className="flex flex-wrap items-center gap-6 md:gap-10 mt-2">
              <span className="text-base md:text-lg lg:text-2xl italic text-base-content/60">
                {t('roots.redes.coming_soon')}
              </span>
            </div>
          </div>
          <img
            src="/assets/roots/redes-hero.png"
            alt={t('roots.redes.title')}
            className="w-full lg:w-5/12 aspect-[16/9] object-cover rounded-2xl shrink-0"
          />
        </section>

        {/* Redes de Conhecimento */}
        <section className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-14 items-start">
          <img
            src="/assets/roots/redes-conhecimento.png"
            alt={t('roots.redes.conhecimento_title')}
            className="w-full lg:w-5/12 aspect-[16/9] object-cover rounded-2xl shrink-0"
          />
          <div className="flex-1 flex flex-col gap-4 md:gap-6 lg:text-right">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
              {t('roots.redes.conhecimento_title')}
            </h2>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
              {t('roots.redes.conhecimento_p1')}
            </p>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed italic text-base-content/60">
              {t('roots.redes.conhecimento_p2')}
            </p>
          </div>
        </section>

        {/* Iniciativas e Certificacoes */}
        <section className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          <div className="flex-1 flex flex-col gap-4 md:gap-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
              {t('roots.redes.iniciativas_title')}
            </h2>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
              {t('roots.redes.iniciativas_intro')}
            </p>
            <ul className="list-disc ml-6 md:ml-9 text-base md:text-lg lg:text-2xl leading-relaxed text-base-content space-y-1">
              <li>{t('roots.redes.iniciativas_item1')}</li>
              <li>{t('roots.redes.iniciativas_item2')}</li>
              <li>{t('roots.redes.iniciativas_item3')}</li>
            </ul>
          </div>
          <img
            src="/assets/roots/redes-iniciativas.png"
            alt={t('roots.redes.iniciativas_title')}
            className="w-full lg:w-5/12 aspect-[16/9] object-cover rounded-2xl shrink-0"
          />
        </section>
      </div>
    </PageTemplate>
  );
}
