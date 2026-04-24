import ComingSoon from '../../components/ComingSoon';

export default function Governanca() {
  return <ComingSoon />;
}

/* Original implementation — restore once page content is ready.
import { useTranslation } from 'react-i18next';
import PageTemplate from '../PageTemplate';

export default function Governanca() {
  const { t } = useTranslation();

  return (
    <PageTemplate>
      <div className="max-w-[1512px] mx-auto px-6 md:px-12 pb-16 md:pb-24 flex flex-col gap-16 md:gap-24">
        // Governanca intro
        <section className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          <div className="flex-1 flex flex-col gap-4 md:gap-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
              {t('roots.governanca.title')}
            </h1>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
              {t('roots.governanca.intro')}
            </p>
          </div>
          <img
            src="/assets/roots/governanca-hero.png"
            alt={t('roots.governanca.title')}
            className="w-full lg:w-2/5 aspect-[3/2] object-cover rounded-2xl shadow-sm shrink-0"
          />
        </section>

        // Modelo de Governanca
        <section className="flex flex-col gap-8 md:gap-12 relative overflow-hidden">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
            {t('roots.governanca.modelo_title')}
          </h2>
          <div className="w-full aspect-video lg:aspect-[2/1] bg-surface-variant rounded-2xl flex items-center justify-center">
            <p className="text-lg md:text-2xl text-neutral/50 font-medium">{t('roots.governanca.modelo_placeholder')}</p>
          </div>
          <img
            src="/assets/roots/governanca-swirl.png"
            alt=""
            className="hidden lg:block absolute -right-12 top-1/3 w-1/3 max-w-md h-auto pointer-events-none"
          />
        </section>
      </div>
    </PageTemplate>
  );
}
*/
