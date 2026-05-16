import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import ErrorPageLayout from '../../components/ErrorPageLayout';

export default function Forbidden() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('errors.forbidden.page_title', 'Área reservada · ROOTS')}</title>
      </Helmet>
      <ErrorPageLayout
        illustration="/illustrations/error-gate.svg"
        illustrationAlt={t('errors.forbidden.illustration_alt', 'Portão fechado')}
        title={t('errors.forbidden.title', 'Área reservada.')}
        description={t(
          'errors.forbidden.description',
          'Parece que não tem as permissões necessárias para aceder a este conteúdo. Se tem uma conta com acesso a esta área, certifique-se de que a sua sessão está iniciada corretamente.',
        )}
        primaryLabel={t('errors.forbidden.cta', 'Ir para o início')}
        primaryTo="/"
        showBack
      />
    </>
  );
}
