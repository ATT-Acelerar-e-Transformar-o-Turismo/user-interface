import PropTypes from 'prop-types';

// Small circular avatar: shows a photo when available, otherwise the
// person's initials on a neutral background (matches the Communication
// admin designs, e.g. the "AP" chips in node 2903:18787).
const SIZES = {
  sm: 'w-9 h-9 text-[13px]',
  md: 'w-11 h-11 text-[15px]',
  lg: 'w-12 h-12 text-base',
};

export default function InitialsAvatar({ name, photoUrl = null, size = 'sm', className = '' }) {
  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';

  const dims = SIZES[size] || SIZES.sm;

  if (photoUrl) {
    return <img src={photoUrl} alt={name || ''} className={`${dims} rounded-full object-cover shrink-0 ${className}`} />;
  }

  return (
    <span
      aria-hidden
      className={`${dims} rounded-full bg-[#e5e7eb] text-[#404040] font-['Onest'] font-medium flex items-center justify-center shrink-0 ${className}`}
    >
      {initials}
    </span>
  );
}

InitialsAvatar.propTypes = {
  name: PropTypes.string,
  photoUrl: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};
