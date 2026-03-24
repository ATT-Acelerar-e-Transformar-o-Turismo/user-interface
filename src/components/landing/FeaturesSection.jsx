import PropTypes from 'prop-types';

// Asset URLs from Figma
const imgEllipse3 = "/assets/figma/feature-ellipse.svg";
const imgButtonArrow = "/assets/figma/button-arrow.svg";

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
  return (
    <div className="relative w-full py-12 lg:h-[1050px] lg:py-0 overflow-hidden">
      <div className="max-w-[1512px] mx-auto h-full relative flex flex-col items-center justify-center">
        
        {/* Main Title - Centered */}
	  	<div className="relative lg:absolute lg:top-[100px] lg:left-1/2 lg:-translate-x-1/2 w-full text-center z-10 mb-12 lg:mb-0" data-aos="fade-down">
             <h2 className="font-['Onest'] font-semibold text-[48px] md:text-[64px] lg:text-[82px] text-white mx-4 lg:mx-0 tracking-tight leading-none whitespace-normal lg:whitespace-nowrap">
               Com a Roots Pode
             </h2>
        </div>

        {/* Features Container */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-0 w-full lg:absolute lg:top-[480px]">
            {/* Feature 1: Visualizar */}
            <FeatureItem
            title="Visualizar"
            description="indicadores turísticos da Barra e Costa Nova, atualizados e organizados por dimensões"
            iconSrc={imgEye}
            delay={100}
            className="lg:absolute lg:left-[8.33%]"
            />

            {/* Feature 2: Comparar - Centered */}
            <FeatureItem
            title="Comparar"
            description="dados ao longo do tempo para identificar tendências e padrões"
            iconSrc={imgChart}
            delay={250}
            className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-[72px]"
            />

            {/* Feature 3: Decidir */}
            <FeatureItem
            title="Decidir"
            description="com base em dados concretos para melhorar a tua estratégia e o impacto no território."
            iconSrc={imgGoal}
            delay={150}
            className="lg:absolute lg:left-[66.67%]"
            />
        </div>

        {/* CTA Button */}
        <div className="mt-12 lg:mt-0 lg:absolute lg:left-[83.33%] lg:top-[900px]" data-aos="fade-left" data-aos-delay="400" data-aos-offset="-125">
             <button className="bg-base-100 text-[#009368] border-2 border-[#009368] flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 rounded-full hover:bg-[#e5e7eb] transition-colors">
              <span className="font-['Onest'] font-medium text-[18px] lg:text-[24px]">Explorar Indicadores</span>
              <img src={imgButtonArrow} alt="" className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
        </div>

      </div>
    </div>
  );
}
