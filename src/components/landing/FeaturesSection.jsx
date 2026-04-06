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
        <img src={imgEllipse3} alt="" className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center p-6 md:p-8">
           <img src={iconSrc} alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      <h3 className="font-['Onest'] font-semibold text-[24px] md:text-[30px] mb-2 md:mb-4">{title}</h3>
      <p className="font-['Onest'] font-normal text-[14px] md:text-[20px] lg:text-[24px] text-center text-[#0a0a0a] max-w-[170px] md:max-w-[350px]">
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

function CurvedTitle({ text }) {
  return (
    <svg
      viewBox="0 0 600 100"
      className="w-full max-w-[500px] lg:max-w-[900px] mx-auto"
      aria-label={text}
    >
      <defs>
        <path id="features-curve" d="M 0,30 Q 300,95 600,30" fill="none" />
      </defs>
      <text
        fill="white"
        fontFamily="'Onest', sans-serif"
        fontWeight="600"
        fontSize="58"
        letterSpacing="-1"
      >
        <textPath href="#features-curve" startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

CurvedTitle.propTypes = {
  text: PropTypes.string.isRequired,
};

export default function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <div className="relative w-full pt-4 pb-12 lg:h-[1050px] lg:py-0">
      <div className="max-w-[1512px] mx-auto h-full relative flex flex-col items-center justify-center">

        {/* Curved Title */}
        <div className="relative lg:absolute lg:top-[60px] lg:left-1/2 lg:-translate-x-1/2 w-full text-center z-10 mb-6 lg:mb-0 px-4 lg:px-0" data-aos="fade-down">
          <CurvedTitle text={t('features.title')} />
        </div>

        {/* Mobile Features: 2-col grid with Comparar centered below */}
        <div className="lg:hidden w-full px-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-10">
            <FeatureItem
              title={t('features.visualize_title')}
              description={t('features.visualize_desc')}
              iconSrc={imgEye}
              delay={100}
            />
            <FeatureItem
              title={t('features.decide_title')}
              description={t('features.decide_desc')}
              iconSrc={imgGoal}
              delay={150}
            />
          </div>
          <div className="flex justify-center mt-10">
            <FeatureItem
              title={t('features.compare_title')}
              description={t('features.compare_desc')}
              iconSrc={imgChart}
              delay={250}
            />
          </div>
        </div>

        {/* Desktop Features: absolute positioning */}
        <div className="hidden lg:flex items-center justify-center w-full lg:absolute lg:top-[480px]">
            <FeatureItem
              title={t('features.visualize_title')}
              description={t('features.visualize_desc')}
              iconSrc={imgEye}
              delay={100}
              className="lg:absolute lg:left-[8.33%]"
            />
            <FeatureItem
              title={t('features.compare_title')}
              description={t('features.compare_desc')}
              iconSrc={imgChart}
              delay={250}
              className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-[72px]"
            />
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
