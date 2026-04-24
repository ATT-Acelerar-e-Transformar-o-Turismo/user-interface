import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import useLocalizedName from '../hooks/useLocalizedName';
import arrowRight from '../assets/images/arrow-right.svg';

const PAGE_SIZE = 4;
const MAX_DOTS = 3;

export default function AreaCard({
  title,
  areaId,
  page,
  color = "#C3F25E",
  icon,
  indicators = [],
  shadowColor,
  className = "",
  ...props
}) {
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const navigate = useNavigate();
  const effectiveShadowColor = shadowColor || color;

  const totalPages = Math.min(MAX_DOTS, Math.max(1, Math.ceil(indicators.length / PAGE_SIZE)));
  const [currentPage, setCurrentPage] = useState(0);
  const pageStart = currentPage * PAGE_SIZE;
  const visible = indicators.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (totalPages <= 1) return;
    const id = setInterval(() => setCurrentPage(p => (p + 1) % totalPages), 5000);
    return () => clearInterval(id);
  }, [totalPages, currentPage]);

  const handleClick = () => {
    if (page) {
      navigate(page, {
        state: { areaId }
      });
    }
  };

  return (
    <div
      style={{ containerType: 'inline-size' }}
      className={`relative w-full max-w-[392px] aspect-[358/266] sm:aspect-[392/514] group hover:scale-[1.02] transition-transform duration-300 cursor-pointer ${className}`}
      onClick={handleClick}
      {...props}
    >
      {/* Mobile: Landscape notched card (358x266) — notch sized for 54px icon */}
      <div className="sm:hidden absolute left-0 top-0 w-full h-full drop-shadow-md">
        <svg viewBox="0 0 358 266" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0 231.6V27C0 5.8 13.6 0 30.7 0H280C296 0 305 10 306 27C307 44 318 54 336 56C350 57.5 358 68 358 88V231.6C358 254 345.5 266 301.6 266H30.7C0 266 0 252.9 0 231.6Z" fill={color} />
        </svg>
      </div>

      {/* Desktop: Portrait notched card (387x509) */}
      <div className="hidden sm:block absolute left-0 top-0 w-[98.7%] h-[99%] drop-shadow-md">
        <svg viewBox="0 0 387 509" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M1.51274e-07 443.101V51.9497C0.000185678 11.2039 26.0573 0 58.8703 0H235.481C264.434 0.000789389 279.507 19.3579 280.84 51.9497C282.174 84.5415 300.688 104.56 330.06 108.069C373.191 113.221 387 133.535 387 177.336V443.101C387 485.882 371.559 509.311 324.269 509.311H58.8703C1.51274e-07 509.311 -6.95755e-05 483.845 1.51274e-07 443.101Z" fill={color} />
        </svg>
      </div>

      {/* Card Content */}
      <div className="absolute left-0 top-0 sm:top-[1%] w-full sm:w-[98.7%] h-full sm:h-[99%] flex flex-col items-end justify-between px-[6%] py-[6%]">
        {/* Title */}
        <div className="w-full">
          <h3 className="font-['Onest'] font-semibold leading-none text-black tracking-[-0.32px] break-words" style={{ fontSize: 'clamp(1.25rem, 8cqi, 2rem)' }}>
            {title}
          </h3>
        </div>

        {/* Indicators List */}
        <ul className="w-full flex flex-col gap-2 sm:gap-6">
          {visible.map((ind, i) => {
            const name = typeof ind === 'string' ? ind : getName(ind) || ind.name;
            const id = typeof ind === 'object' ? ind.id : null;
            return (
              <li
                key={id || `${currentPage}-${i}`}
                className="font-['Onest'] font-normal leading-[1.5] text-black underline underline-offset-4 decoration-1 truncate cursor-pointer hover:text-primary transition-colors"
                style={{ fontSize: 'clamp(0.75rem, 6cqi, 1.5rem)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (id) {
                    navigate(`/indicator/${id}`);
                  }
                }}
              >
                {name}
              </li>
            );
          })}
        </ul>

        {/* Bottom row: page dots + button */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrentPage(i); }}
                aria-label={`Page ${i + 1}`}
                className={`w-2 h-2 rounded-full bg-black cursor-pointer transition-opacity ${i === currentPage ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
              />
            ))}
          </div>
          <button className="bg-base-100 text-primary px-[5%] py-[2%] rounded-full flex items-center justify-center gap-2 font-medium hover:bg-gray-100 transition-colors shadow-sm">
            <span className="font-['Onest'] font-medium leading-snug whitespace-nowrap" style={{ fontSize: 'clamp(0.875rem, 6.5cqi, 1.6rem)' }}>{t('components.area_card.view_all')}</span>
            <img src={arrowRight} alt="" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Icon Circle - positioned in the notched corner */}
      <div
        className="absolute -top-2 -right-2 sm:top-0 sm:right-[1.3%] bg-white rounded-full p-3 md:p-4 w-[54px] h-[54px] sm:w-[85px] sm:h-[85px] md:w-[100px] md:h-[100px] flex items-center justify-center z-10"
        style={{ boxShadow: `0 0 7.5px ${effectiveShadowColor}` }}
      >
        <div className="w-[34px] h-[34px] sm:w-[55px] sm:h-[55px] md:w-[68px] md:h-[68px] flex items-center justify-center">
            {icon ? (
                 <img src={icon} alt={title} className="w-full h-full object-contain" />
            ) : (
                <div className="w-full h-full bg-gray-200 rounded-full" />
            )}
        </div>
      </div>
    </div>
  );
}

AreaCard.propTypes = {
    title: PropTypes.string.isRequired,
    areaId: PropTypes.string,
    page: PropTypes.string,
    color: PropTypes.string,
    icon: PropTypes.string,
    indicators: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, name_en: PropTypes.string }),
        ])
    ),
    shadowColor: PropTypes.string,
    className: PropTypes.string,
};
