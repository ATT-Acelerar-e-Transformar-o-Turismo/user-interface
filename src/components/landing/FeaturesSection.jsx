import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

// Asset URLs from Figma
const imgEllipse3 = "/assets/figma/feature-ellipse.svg";

// Correct Icon Assets (Composite parts or full icons from Figma)
const imgEye = "/assets/icons/eye.svg"; 
const imgChart = "/assets/icons/chart-spline.svg";
const imgGoal = "/assets/icons/goal.svg";

function FeatureItem({ title, description, iconSrc, delay = 0, className = "" }) {
  return (
    <div className={`flex flex-col items-center ${className}`} data-aos="fade-up" data-aos-delay={delay}>
      <div className="relative w-[100px] h-[100px] md:w-[144px] md:h-[144px] mb-4 md:mb-8">
        {/* Background Ring */}
        <img src={imgEllipse3} alt="" className="absolute inset-0 w-full h-full" />
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center p-6 md:p-8">
           <img src={iconSrc} alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      <h3 className="font-['Onest'] font-semibold text-[24px] md:text-[30px] mb-2 md:mb-4">{title}</h3>
      <p className="font-['Onest'] font-normal text-[16px] md:text-[20px] lg:text-[24px] text-center text-[#0a0a0a] max-w-[300px] md:max-w-[350px]">
        {description}
      </p>
    </div>
  );
}

FeatureItem.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  iconSrc: PropTypes.string.isRequired,
  delay: PropTypes.number,
  className: PropTypes.string,
};

export default function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <div className="relative w-full py-12 lg:h-[1050px] lg:py-0 overflow-hidden">
      <div className="max-w-[1512px] mx-auto h-full relative flex flex-col items-center justify-center">
        
        {/* Main Title - Centered */}
	  	<div className="relative lg:absolute lg:top-[100px] lg:left-1/2 lg:-translate-x-1/2 w-full text-center z-10 mb-12 lg:mb-0" data-aos="fade-down">
             <h2 className="font-['Onest'] font-semibold text-[48px] md:text-[64px] lg:text-[82px] text-white mx-4 lg:mx-0 tracking-tight leading-none whitespace-normal lg:whitespace-nowrap">
               {t('features.title')}
             </h2>
        </div>

        {/* Features Container */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-0 w-full lg:absolute lg:top-[480px]">
            {/* Feature 1: Visualizar */}
            <FeatureItem
            title={t('features.visualize_title')}
            description={t('features.visualize_desc')}
            iconSrc={imgEye}
            delay={100}
            className="lg:absolute lg:left-[8.33%]"
            />

            {/* Feature 2: Comparar - Centered */}
            <FeatureItem
            title={t('features.compare_title')}
            description={t('features.compare_desc')}
            iconSrc={imgChart}
            delay={250}
            className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-[72px]"
            />

            {/* Feature 3: Decidir */}
            <FeatureItem
            title={t('features.decide_title')}
            description={t('features.decide_desc')}
            iconSrc={imgGoal}
            delay={150}
            className="lg:absolute lg:left-[66.67%]"
            />
        </div>


      </div>
    </div>
  );
}
