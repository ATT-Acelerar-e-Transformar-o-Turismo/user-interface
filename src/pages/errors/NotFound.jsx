import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import ErrorPageLayout from '../../components/ErrorPageLayout';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('errors.not_found.page_title', 'Página não encontrada · ROOTS')}</title>
      </Helmet>
      <ErrorPageLayout
        illustration="/illustrations/error-magnifier.svg"
        illustrationAlt={t('errors.not_found.illustration_alt', 'Lupa a procurar')}
        title={t('errors.not_found.title', 'Página não encontrada')}
        description={t(
          'errors.not_found.description',
          'A página que procura parece ter mudado de sítio ou já não existe. Não se preocupe, é fácil voltar ao caminho certo e continuar a sua navegação.',
        )}
        primaryLabel={t('errors.not_found.cta', 'Ir para o início')}
        primaryTo="/"
      />
    </>
  );
}
