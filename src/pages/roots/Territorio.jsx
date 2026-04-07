import { useTranslation } from 'react-i18next';
import PageTemplate from '../PageTemplate';
import mapaSalvador from '../../assets/roots/mapa-ssalvador.svg';
import mapaGafanhaCarmo from '../../assets/roots/mapa-gafanha-carmo.svg';
import mapaGafanhaNazare from '../../assets/roots/mapa-gafanha-nazare.svg';
import mapaGafanhaEncarnacao from '../../assets/roots/mapa-gafanha-encarnacao.svg';
import mapa from '../../assets/roots/mapa.svg';

export default function Territorio() {
  const { t } = useTranslation();

  return (
    <PageTemplate>
      <div className="max-w-[1512px] mx-auto px-6 md:px-12 pb-16 md:pb-24 flex flex-col gap-16 md:gap-24 overflow-x-hidden">
        {/* A Area de Monitorizacao */}
        <section className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          <div className="flex-1 flex flex-col gap-4 md:gap-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
              {t('roots.territorio.area_title')}
            </h1>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
              {t('roots.territorio.area_p1')}
            </p>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
              {t('roots.territorio.area_p2')}
            </p>
          </div>
          <div className="w-full sm:w-3/4 md:w-1/2 lg:w-2/5 shrink-0 mx-auto lg:mx-0">
            <div className="flex items-center justify-center w-full max-w-sm mx-auto">
              <img src={mapa} alt="S. Salvador" className="w-full h-auto" />
            </div>
          </div>
        </section>

        {/* Caracterizacao do Territorio */}
        <section className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
          <img
            src="/assets/roots/territorio-caracterizacao.png"
            alt={t('roots.territorio.caract_title')}
            className="w-full lg:w-1/2 aspect-[4/3] object-cover rounded-2xl shrink-0"
          />
          <div className="flex-1 flex flex-col gap-4 md:gap-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
              {t('roots.territorio.caract_title')}
            </h2>
            <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
              {t('roots.territorio.caract_desc')}
            </p>
          </div>
        </section>

        {/* Recursos Turisticos */}
        <section className="flex flex-col lg:flex-row gap-8 items-stretch">
          <div className="flex-1 flex flex-col justify-between gap-6 md:gap-8">
            <div className="flex flex-col gap-4 md:gap-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-base-content">
                {t('roots.territorio.recursos_title')}
              </h2>
              <p className="text-base md:text-lg lg:text-2xl leading-relaxed text-base-content">
                {t('roots.territorio.recursos_desc')}
              </p>
            </div>
            <img
              src="/assets/roots/territorio-recursos1.png"
              alt={t('roots.territorio.recursos_title')}
              className="w-full aspect-[3/2] object-cover rounded-2xl"
            />
          </div>
          <div className="flex flex-col gap-6 md:gap-8 w-full lg:w-5/12 shrink-0">
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
    </PageTemplate>
  );
}
