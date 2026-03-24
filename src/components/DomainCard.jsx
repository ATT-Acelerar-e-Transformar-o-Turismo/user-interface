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

      {/* Card Content */}
      <div className="absolute left-0 top-[1%] w-[98.7%] h-[99%] flex flex-col items-end justify-center px-4 py-6 md:px-6 md:py-8 gap-8 md:gap-16">
        {/* Title */}
        <div className="w-full px-2 md:px-4">
          <h3 className="font-['Onest'] font-semibold text-[32px] leading-none text-black tracking-[-0.32px] break-words">
            {title}
          </h3>
        </div>

        {/* Indicators List */}
        <ul className="w-full space-y-3 md:space-y-6 px-2 md:px-4">
          {indicators.slice(0, 4).map((ind, i) => (
            <li key={i} className="font-['Onest'] font-normal text-[24px] leading-[1.5] text-black underline underline-offset-4 decoration-1 line-clamp-1">
              {ind}
            </li>
          ))}
        </ul>

        {/* Bottom row: page dots + button */}
        <div className="w-full px-2 md:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-black" />
            <div className="w-2 h-2 rounded-full bg-black opacity-30" />
            <div className="w-2 h-2 rounded-full bg-black opacity-30" />
          </div>
          <button className="bg-base-100 text-[#009368] px-4 py-2 md:px-[17px] md:py-[6.4px] min-h-[40px] md:min-h-[51px] rounded-full flex items-center justify-center gap-2 md:gap-3 font-medium hover:bg-gray-100 transition-colors shadow-sm">
            <span className="font-['Onest'] font-medium text-[25.62px] leading-[34.165px]">Ver todos</span>
            <img src={arrowRight} alt="" className="w-[20px] h-[20px] md:w-[28px] md:h-[28px]" />
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
