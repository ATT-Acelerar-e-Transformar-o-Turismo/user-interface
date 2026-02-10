import React from 'react';
import { useTranslation } from 'react-i18next';

const img1 = "/assets/figma/arrow-right-small.svg"; // Arrow icon
const imgRectangle70 = "/assets/figma/about-rect-1.png";
const imgRectangle72 = "/assets/figma/about-rect-2.png";
const imgRectangle71 = "/assets/figma/about-rect-3.png";
const imgRectangle73 = "/assets/figma/about-rect-4.png";

export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <div className="relative w-full py-32 overflow-hidden">
      <div className="max-w-[1512px] mx-auto px-4 md:px-8 lg:px-12 relative flex flex-col lg:flex-row items-start gap-12 lg:gap-20">

        {/* Left Side: Images Grid */}
        <div className="w-full lg:w-1/2 hidden lg:grid grid-cols-12 grid-rows-2 gap-4 h-[600px] xl:h-[800px]">
           {/* Image 1: Top Left Vertical */}
           <div className="row-start-1 col-span-5 rounded-[16px] shadow-lg overflow-hidden" data-aos="fade-up" data-aos-delay="0">
             <img src={imgRectangle70} alt="" className="w-full h-full object-cover" />
           </div>
           
           {/* Image 2: Top Right Square-ish */}
           <div className="row-start-1 col-span-7 rounded-[16px] shadow-lg overflow-hidden" data-aos="fade-up" data-aos-delay="150">
             <img src={imgRectangle72} alt="" className="w-full h-full object-cover" />
           </div>

           {/* Image 3: Bottom Left Landscape */}
           <div className="row-start-2 col-span-8 rounded-[16px] shadow-xl overflow-hidden" data-aos="fade-up" data-aos-delay="300">
             <img src={imgRectangle73} alt="" className="w-full h-full object-cover scale-150" />
           </div>

           {/* Image 4: Bottom Right Small */}
           <div className="row-start-2 col-span-4 rounded-[16px] shadow-lg overflow-hidden" data-aos="fade-up" data-aos-delay="200">
             <img src={imgRectangle71} alt="" className="w-full h-full object-cover" />
           </div>
        </div>

        {/* Right Side: Text Content */}
        <div className="w-full lg:w-1/2 lg:min-w-[575px] flex flex-col justify-center text-white z-10">
          <div className="mb-12 lg:mb-20 text-left lg:text-right" data-aos="fade-left" data-aos-delay="100">
            <h2 className="font-['Onest'] font-semibold text-[32px] md:text-[40px] lg:text-[48px] leading-none mb-4 lg:mb-8">{t('about.title')}</h2>
            <p className="font-['Onest'] font-normal text-[16px] md:text-[20px] lg:text-[24px] leading-relaxed opacity-90 max-w-xl lg:ml-auto lg:mr-0">
              {t('about.description')}
            </p>
          </div>

          <div className="text-left lg:text-right" data-aos="fade-left" data-aos-delay="250" data-aos-offset="-100">
            <h2 className="font-['Onest'] font-semibold text-[32px] md:text-[40px] lg:text-[48px] leading-none mb-4 lg:mb-8">{t('about.objective_title')}</h2>
            <p className="font-['Onest'] font-normal text-[16px] md:text-[20px] lg:text-[24px] leading-relaxed opacity-90 max-w-xl lg:ml-auto lg:mr-0">
              {t('about.objective_description')}
            </p>
          </div>

          <div className="mt-8 lg:mt-12 flex justify-end" data-aos="fade-left" data-aos-delay="400" data-aos-offset="-125">
             <button className="bg-base-100 text-[#009368] flex items-center gap-3 px-6 py-3 lg:px-8 lg:py-4 rounded-full hover:bg-white transition-colors">
              <span className="font-['Onest'] font-medium text-[18px] lg:text-[24px]">{t('about.cta')}</span>
              <img src={img1} alt="" className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
