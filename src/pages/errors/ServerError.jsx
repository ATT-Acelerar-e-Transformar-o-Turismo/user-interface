import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import ErrorPageLayout from '../../components/ErrorPageLayout';

export default function ServerError() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('errors.server.page_title', 'Algo correu mal · ROOTS')}</title>
      </Helmet>
      <ErrorPageLayout
        illustration="/illustrations/error-magnifier.svg"
        illustrationAlt={t('errors.server.illustration_alt', 'Lupa a investigar')}
        title={t('errors.server.title', 'Algo não correu como esperado.')}
        description={t(
          'errors.server.description',
          'Tivemos um problema técnico do nosso lado e não foi possível carregar esta página. Pedimos desculpa pela interrupção.',
        )}
        primaryLabel={t('errors.server.cta', 'Ir para o início')}
        primaryTo="/"
      />
    </>
  );
}
