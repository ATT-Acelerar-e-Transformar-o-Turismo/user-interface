import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch, LuChevronLeft, LuChevronRight, LuListFilter, LuArrowUp, LuArrowDown, LuChevronDown, LuX } from 'react-icons/lu';

// Shared admin list shell — matches the Figma admin template used on
// Indicators Management. Reuse across Dimensions / Areas / Publications /
// News Events so every admin list page shares the same visual language.

const PILL_BASE = "inline-flex items-center gap-2 bg-white/10 border border-[#d4d4d4] rounded-full h-10 px-4 shadow-sm text-[#0a0a0a] font-['Onest'] font-medium text-[17px] hover:bg-black/[0.03] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export function AdminPillButton({ icon: Icon, children, className = '', ...rest }) {
  return (
    <button type="button" {...rest} className={`${PILL_BASE} ${className}`}>
      {Icon ? <Icon className="w-4 h-4" strokeWidth={1.75} /> : null}
      {children}
    </button>
  );
}

AdminPillButton.propTypes = {
  icon: PropTypes.elementType,
  children: PropTypes.node,
  className: PropTypes.string,
};

export function AdminPrimaryButton({ icon: Icon, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center gap-2 bg-[#009368] text-white rounded-full h-10 px-4 text-[17px] font-['Onest'] font-medium hover:bg-[#007d57] transition-colors cursor-pointer ${className}`}
    >
      {Icon ? <Icon className="w-4 h-4" strokeWidth={2} /> : null}
      {children}
    </button>
  );
}

AdminPrimaryButton.propTypes = {
  icon: PropTypes.elementType,
  children: PropTypes.node,
  className: PropTypes.string,
};

export function AdminPageHeader({ title, actions }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
      <h1 className="font-['Onest'] font-semibold text-[32px] leading-none tracking-tight text-[#0a0a0a]">
        {title}
      </h1>
      {actions ? <div className="flex items-center gap-4">{actions}</div> : null}
    </div>
  );
}

AdminPageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  actions: PropTypes.node,
};

export function AdminSearchInput({ value, onChange, placeholder, width = 'w-[320px] sm:w-[388px]' }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`bg-[#fffefc] border border-[#e5e5e5] rounded-full h-10 pl-4 pr-10 ${width} text-[15px] font-['Onest'] text-[#0a0a0a] placeholder-[#737373] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#009368]/30`}
      />
      <LuSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" strokeWidth={1.75} />
    </div>
  );
}

AdminSearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  width: PropTypes.string,
};

/**
 * Sort dropdown pill — a controlled dropdown that drives `sortBy` / `sortOrder`.
 * Clicking the currently-selected option flips the direction, matching the
 * behaviour on the public indicators page.
 */
export function AdminSortDropdown({ options, sortBy, sortOrder, onChange, label }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const currentLabel = options.find(o => o.value === sortBy)?.label || label || t('admin.indicators.sort_by', 'Ordenar por');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`${PILL_BASE} gap-2`}
      >
        <LuListFilter className="w-4 h-4" strokeWidth={1.75} />
        {currentLabel}
        {sortOrder === 'desc'
          ? <LuArrowDown className="w-3.5 h-3.5" strokeWidth={2} />
          : <LuArrowUp className="w-3.5 h-3.5" strokeWidth={2} />}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 min-w-[220px] bg-[#fffefc] border border-[#e5e5e5] rounded-2xl shadow-lg overflow-hidden">
          {options.map(opt => {
            const isActive = opt.value === sortBy;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (isActive) {
                    onChange(opt.value, sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    onChange(opt.value, 'asc');
                  }
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left font-['Onest'] text-sm transition-colors hover:bg-black/[0.03] ${isActive ? 'text-[#009368] font-medium' : 'text-[#0a0a0a]'}`}
              >
                <span>{opt.label}</span>
                {isActive && (sortOrder === 'desc'
                  ? <LuArrowDown className="w-3.5 h-3.5" strokeWidth={2} />
                  : <LuArrowUp className="w-3.5 h-3.5" strokeWidth={2} />)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

AdminSortDropdown.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  sortBy: PropTypes.string.isRequired,
  sortOrder: PropTypes.oneOf(['asc', 'desc']).isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
};

/**
 * Generic single-select pill dropdown — displays the placeholder when nothing
 * is selected, or the active option's label. When `allowClear` is true and an
 * option is active, hovering shows an `x` that resets the value to null.
 */
export function AdminSelectDropdown({ placeholder, options, value, onChange, disabled = false, allowClear = true }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const active = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={`${PILL_BASE} ${allowClear && active ? 'pr-10' : ''}`}
      >
        <LuChevronDown className="w-4 h-4" strokeWidth={1.75} />
        <span className="truncate max-w-[200px]">{active ? active.label : placeholder}</span>
      </button>
      {allowClear && active && (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Clear"
        >
          <LuX className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      )}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 min-w-[220px] max-h-[320px] overflow-y-auto bg-[#fffefc] border border-[#e5e5e5] rounded-2xl shadow-lg">
          {options.length === 0 ? (
            <div className="px-4 py-2.5 text-sm text-[#737373] font-['Onest']">—</div>
          ) : options.map(opt => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 font-['Onest'] text-sm transition-colors hover:bg-black/[0.03] ${isActive ? 'text-[#009368] font-medium' : 'text-[#0a0a0a]'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

AdminSelectDropdown.propTypes = {
  placeholder: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  allowClear: PropTypes.bool,
};

export function AdminFilterBar({ children, search }) {
  if (!children && !search) return null;
  return (
    <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
      <div className="flex items-center gap-4 flex-wrap">{children}</div>
      {search}
    </div>
  );
}

AdminFilterBar.propTypes = {
  children: PropTypes.node,
  search: PropTypes.node,
};

export function AdminCard({ children, className = '' }) {
  return (
    <div className={`bg-[#fffefc] rounded-2xl p-8 shadow-[0_0_3px_2px_rgba(0,0,0,0.05)] ${className}`}>
      {children}
    </div>
  );
}

AdminCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export function AdminPagination({ currentPage, totalPages, hasNextPage, onPageChange }) {
  const { t } = useTranslation();
  const canPrev = currentPage > 0;
  const canNext = hasNextPage ?? currentPage + 1 < totalPages;
  const displayTotal = Math.max(1, totalPages || 1);
  return (
    <div className="flex items-center justify-between gap-4 mt-8">
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        className="inline-flex items-center gap-2 font-['Onest'] font-medium text-sm text-[#404040] hover:text-[#0a0a0a] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <LuChevronLeft className="w-[13px] h-[13px]" strokeWidth={2} />
        {t('common.previous', 'Anterior')}
      </button>
      <div className="flex items-center gap-2 font-['Onest'] font-medium text-[17px] text-[#0a0a0a]">
        <span>{t('common.page', 'Página')}</span>
        <span className="inline-flex items-center justify-center min-w-[34px] h-[44px] px-3 rounded-lg border border-[#d4d4d4] bg-white/10 shadow-sm">
          {currentPage + 1}
        </span>
        <span>
          {t('common.page_of', 'de')} {displayTotal}
        </span>
      </div>
      <button
        type="button"
        disabled={!canNext}
        onClick={() => canNext && onPageChange(currentPage + 1)}
        className="inline-flex items-center gap-2 font-['Onest'] font-medium text-sm text-[#404040] hover:text-[#0a0a0a] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {t('common.next', 'Próximo')}
        <LuChevronRight className="w-[13px] h-[13px]" strokeWidth={2} />
      </button>
    </div>
  );
}

AdminPagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number,
  hasNextPage: PropTypes.bool,
  onPageChange: PropTypes.func.isRequired,
};

export default function AdminListShell({ children }) {
  return (
    <div className="max-w-[1512px] mx-auto px-6 lg:px-12 pb-12">
      {children}
    </div>
  );
}

AdminListShell.propTypes = {
  children: PropTypes.node.isRequired,
};
