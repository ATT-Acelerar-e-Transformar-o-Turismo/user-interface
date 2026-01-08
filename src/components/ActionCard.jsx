import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * ActionCard - Reusable card component for action buttons
 * Matches Figma design with icon, title, and optional link
 */
export default function ActionCard({ icon, title, to, onClick, className = '' }) {
  const content = (
    <div className={`rounded-[23px] p-6 flex flex-col items-center justify-center gap-4 hover:bg-base-200 transition-colors cursor-pointer ${className}`} style={{backgroundColor: 'var(--color-surface)'}}>
      {/* Icon Container */}
      <div className="rounded-[15px] w-20 h-20 flex items-center justify-center" style={{backgroundColor: 'var(--color-surface-variant)'}}>
        {typeof icon === 'string' ? (
          <i className={`${icon} text-3xl text-base-content/60`}></i>
        ) : (
          icon
        )}
      </div>

      {/* Title */}
      <p className="font-['Onest',sans-serif] font-medium text-xl text-black text-center leading-tight whitespace-pre-line">
        {title}
      </p>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full">
        {content}
      </button>
    );
  }

  return content;
}

ActionCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  title: PropTypes.string.isRequired,
  to: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string
};
