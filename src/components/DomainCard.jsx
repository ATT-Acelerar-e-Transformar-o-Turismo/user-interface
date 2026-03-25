import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import arrowRight from '../assets/images/arrow-right.svg';

export default function DomainCard({
  title,
  page,
  color = "#C3F25E",
  icon,
  indicators = [],
  shadowColor,
  className = "",
  ...props
}) {
  const navigate = useNavigate();
  const effectiveShadowColor = shadowColor || color;

  const handleClick = () => {
    if (page) {
      navigate(page, {
        state: { domainName: title }
      });
    }
  };

  return (
    <div
      style={{ containerType: 'inline-size' }}
      className={`relative w-full max-w-[392px] aspect-[392/514] group hover:scale-[1.02] transition-transform duration-300 cursor-pointer ${className}`}
      onClick={handleClick}
      {...props}
    >
      {/* Notched Card Shape Background */}
      <div className="absolute left-0 top-0 w-[98.7%] h-[99%] drop-shadow-md">
        <svg viewBox="0 0 387 509" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M1.51274e-07 443.101V51.9497C0.000185678 11.2039 26.0573 0 58.8703 0H235.481C264.434 0.000789389 279.507 19.3579 280.84 51.9497C282.174 84.5415 300.688 104.56 330.06 108.069C373.191 113.221 387 133.535 387 177.336V443.101C387 485.882 371.559 509.311 324.269 509.311H58.8703C1.51274e-07 509.311 -6.95755e-05 483.845 1.51274e-07 443.101Z" fill={color} />
        </svg>
      </div>

      {/* Card Content — top-aligned title, bottom-aligned dots+button */}
      <div className="absolute left-0 top-[1%] w-[98.7%] h-[99%] flex flex-col items-end justify-between px-[6%] py-[6%]">
        {/* Title */}
        <div className="w-full">
          <h3 className="font-['Onest'] font-semibold leading-none text-black tracking-[-0.32px] break-words" style={{ fontSize: 'clamp(1.25rem, 8cqi, 2rem)' }}>
            {title}
          </h3>
        </div>

        {/* Indicators List */}
        <ul className="w-full flex flex-col gap-6">
          {indicators.slice(0, 4).map((ind, i) => (
            <li
              key={i}
              className="font-['Onest'] font-normal leading-[1.5] text-black underline underline-offset-4 decoration-1 truncate cursor-pointer hover:text-[#009368] transition-colors"
              style={{ fontSize: 'clamp(0.75rem, 6cqi, 1.5rem)' }}
              onClick={(e) => {
                e.stopPropagation();
                if (page) {
                  navigate(`${page}?subdomain=${encodeURIComponent(ind)}`, {
                    state: { domainName: title, subdomain: ind }
                  });
                }
              }}
            >
              {ind}
            </li>
          ))}
        </ul>

        {/* Bottom row: page dots + button */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-black" />
            <div className="w-2 h-2 rounded-full bg-black opacity-30" />
            <div className="w-2 h-2 rounded-full bg-black opacity-30" />
          </div>
          <button className="bg-base-100 text-[#009368] px-[5%] py-[2%] rounded-full flex items-center justify-center gap-2 font-medium hover:bg-gray-100 transition-colors shadow-sm">
            <span className="font-['Onest'] font-medium leading-snug whitespace-nowrap" style={{ fontSize: 'clamp(0.875rem, 6.5cqi, 1.6rem)' }}>Ver todos</span>
            <img src={arrowRight} alt="" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Icon Circle - positioned in the notched corner */}
      <div
        className="absolute top-0 right-0 bg-white rounded-full p-3 md:p-4 w-[70px] h-[70px] md:w-[100px] md:h-[100px] flex items-center justify-center z-10"
        style={{ boxShadow: `0 0 7.5px ${effectiveShadowColor}` }}
      >
        <div className="w-[45px] h-[45px] md:w-[68px] md:h-[68px] flex items-center justify-center">
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

DomainCard.propTypes = {
    title: PropTypes.string.isRequired,
    page: PropTypes.string,
    color: PropTypes.string,
    icon: PropTypes.string,
    indicators: PropTypes.arrayOf(PropTypes.string),
    shadowColor: PropTypes.string,
    className: PropTypes.string,
};
