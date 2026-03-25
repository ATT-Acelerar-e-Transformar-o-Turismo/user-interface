import React from 'react';
import { useTranslation } from 'react-i18next';

const imgRectangle65 = "/assets/figma/hero-rect-1.png";
const imgRectangle66 = "/assets/figma/hero-rect-2.png";
const imgRectangle69 = "/assets/figma/hero-rect-3.png";
const imgArrowDown = "/assets/figma/arrow-down.svg";

export default function HeroSection() {
  const { t } = useTranslation();
  const titlePrefixParts = t('hero.title_prefix').split(' ');

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Floating Images - Positioned relative to visible area below navbar */}
      <div className="absolute right-0 bottom-0 left-0 pointer-events-none" style={{ top: 'var(--navbar-height)' }}>
        {/* Image 1 (Top Right) */}
        <div className="absolute top-[10%] right-[10%] w-[440px] h-[285px] rounded-[15px] shadow-lg z-0 hidden lg:block pointer-events-auto" data-aos="fade-left" data-aos-delay="200">
          <img src={imgRectangle66} alt="" className="w-full h-full object-cover rounded-[15px]" />
        </div>

        {/* Image 2 (Bottom Center-Right) */}
        <div className="absolute bottom-[18%] right-[20%] w-[300px] h-[380px] rounded-[15px] shadow-lg z-10 hidden lg:block pointer-events-auto" data-aos="fade-up" data-aos-delay="350">
          <img src={imgRectangle65} alt="" className="w-full h-full object-cover rounded-[15px]" />
        </div>

        {/* Image 3 (Bottom Right) */}
        <div className="absolute bottom-[22%] right-[2%] w-[250px] h-[255px] rounded-[15px] shadow-lg z-0 hidden lg:block pointer-events-auto" data-aos="fade-left" data-aos-delay="500">
          <img src={imgRectangle69} alt="" className="w-full h-full object-cover rounded-[15px]" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative max-w-[1512px] mx-auto px-12 h-[90vh] sm:h-auto sm:min-h-[900px] flex flex-col sm:justify-center">

        {/* Title Section */}
        <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left pt-28 sm:pt-20">
          {/* "A Raíz Da" */}
          <div className="flex flex-wrap gap-2 sm:gap-4 sm:gap-8 justify-center sm:justify-start mb-1 sm:mb-4" data-aos="fade-right" data-aos-delay="0">
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] sm:text-[100px] leading-none text-black">{titlePrefixParts[0]}</span>
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] sm:text-[100px] leading-none text-black">{titlePrefixParts[1] || ''}</span>
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] sm:text-[100px] leading-none text-black">{t('hero.title_suffix')}</span>
          </div>

          {/* "Decisões Certas" */}
          <div className="flex flex-wrap gap-2 sm:gap-4 sm:gap-8 justify-center sm:justify-start" data-aos="fade-right" data-aos-delay="150">
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] sm:text-[100px] leading-none text-black">{t('hero.title_decisions')}</span>
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] sm:text-[100px] leading-none text-black">{t('hero.title_right')}</span>
          </div>
        </div>

	  <div className="flex-1 sm:flex-none"></div>

        {/* Bottom Block: Description & Button */}
        <div className="relative z-10 w-full flex flex-col items-center sm:items-start sm:mt-12 mt-auto">
          {/* Subtitle */}
	      <div className="ml-2 mb-6 sm:mb-12 max-w-[600px] mx-auto sm:mx-0 pb-8 sm:pb-0" data-aos="fade-up" data-aos-delay="300">
	  <p className="font-['Onest'] font-medium text-white sm:text-black text-[20px] sm:text-[22px] sm:text-[24px] leading-tight text-[#0a0a0a]">
              {t('hero.subtitle')}
            </p>
          </div>

	  	  <div className="flex-1"></div>

          {/* CTA Button */}
          <div data-aos="fade-up" data-aos-delay="300" data-aos-offset="-300">
            <button
              onClick={() => {
                const element = document.getElementById('about');
                if (element) {
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset + 80;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                  });
                }
              }}
              className="bg-transparent sm:bg-[#009368] text-[#fafafa] flex justify-center items-center p-0 sm:w-auto sm:h-auto sm:px-8 sm:py-4 sm:rounded-full hover:opacity-70 sm:hover:opacity-100 sm:hover:bg-[#007a56] transition-all sm:shadow-md border-0"
            >
              <img src={imgArrowDown} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-['Onest'] font-medium text-[18px] sm:text-[24px] hidden sm:inline ml-3">{t('hero.cta')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
