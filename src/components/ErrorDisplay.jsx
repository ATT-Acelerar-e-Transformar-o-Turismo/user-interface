import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import PageTemplate from '../pages/PageTemplate';

// Used by pages that fail to load their data (areas, indicators, blog posts…).
// By default renders a full page with the public Navbar + Footer so the
// fallback always feels finished — even on admin routes whose templates
// don't include a footer. Pages that want to show the error alongside other
// content (a half-loaded list, for example) opt out via `inline`.
//
// `error` accepts either a string or an Error/axios-error object. If an axios
// status code is present we use it to pick a more specific title.
const ErrorDisplay = ({ error, onRetry, title, inline = false }) => {
  const { t } = useTranslation();

  const status = error?.response?.status || error?.status || null;
  const detail =
    (typeof error === 'string' && error) ||
    error?.response?.data?.detail ||
    error?.userMessage ||
    error?.message ||
    '';

  const resolvedTitle =
    title
    || (status === 403 && t('errors.forbidden.title', 'Área reservada.'))
    || (status === 404 && t('errors.not_found.title', 'Página não encontrada'))
    || t('errors.inline.title', 'Não foi possível carregar este conteúdo.');

  const description = t(
    'errors.inline.description',
    'Algo correu mal ao obter os dados. Tente novamente daqui a uns segundos.',
  );

  const body = (
    <div
      role="alert"
      className="flex-1 w-full min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-16 font-['Onest']"
    >
      <img
        src="/illustrations/error-magnifier.svg"
        alt=""
        aria-hidden="true"
        className="h-40 lg:h-52 w-auto mb-8 select-none pointer-events-none"
        draggable={false}
      />
      <h3 className="text-[28px] lg:text-[36px] font-semibold text-[#0a0a0a] tracking-[-0.3px] leading-tight mb-3 max-w-2xl">
        {resolvedTitle}
      </h3>
      <p className="text-[16px] lg:text-[18px] text-[#525252] leading-relaxed max-w-xl">
        {description}
      </p>
      {detail && (
        <p className="text-[12px] text-[#737373] font-mono mt-3 max-w-xl break-words">
          {status ? `${status} · ` : ''}{detail}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 inline-flex items-center justify-center min-h-[49px] px-7 py-3 rounded-full bg-[#084d92] text-[17px] font-medium text-white hover:bg-[#06407a] transition-colors cursor-pointer"
        >
          {t('errors.inline.retry', 'Tentar novamente')}
        </button>
      )}
    </div>
  );

  if (inline) return body;
  return <PageTemplate showSearchBox={false}>{body}</PageTemplate>;
};

ErrorDisplay.propTypes = {
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onRetry: PropTypes.func,
  title: PropTypes.string,
  inline: PropTypes.bool,
};

export default ErrorDisplay;
