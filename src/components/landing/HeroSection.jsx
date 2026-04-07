import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const imgRectangle65 = "/assets/figma/hero-rect-1.png";
const imgRectangle66 = "/assets/figma/hero-rect-2.png";
const imgRectangle69 = "/assets/figma/hero-rect-3.png";
const imgArrowDown = "/assets/figma/arrow-down.svg";

export default function HeroSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const titlePrefixParts = t('hero.title_prefix').split(' ');

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Floating Images - Positioned relative to visible area below navbar */}
      <div className="absolute right-0 bottom-0 left-0 pointer-events-none" style={{ top: 'var(--navbar-height)' }}>
        {/* Image 1 (Top Right — landscape) */}
        <div className="absolute top-[5%] right-[2%] w-[440px] h-[240px] rounded-[15px] shadow-lg hidden xl:block pointer-events-auto" data-aos="fade-left" data-aos-delay="200">
          <img src={imgRectangle66} alt="" className="w-full h-full object-cover rounded-[15px]" />
        </div>

        {/* Image 2 (Bottom-left of image area — portrait) */}
        <div className="absolute top-[38%] right-[20%] w-[300px] h-[380px] rounded-[15px] shadow-lg hidden xl:block pointer-events-auto" data-aos="fade-up" data-aos-delay="350">
          <img src={imgRectangle65} alt="" className="w-full h-full object-cover rounded-[15px]" />
        </div>

        {/* Image 3 (Bottom-right — small) */}
        <div className="absolute top-[38%] right-[2%] w-[200px] h-[255px] rounded-[15px] shadow-lg hidden xl:block pointer-events-auto" data-aos="fade-left" data-aos-delay="500">
          <img src={imgRectangle69} alt="" className="w-full h-full object-cover rounded-[15px]" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative max-w-[1512px] mx-auto px-4 sm:px-12 sm:min-h-[900px] flex flex-col sm:justify-center pb-8 sm:pb-0">

        {/* Title Section — constrained to left half on xl to avoid overlapping images */}
        <div className="relative z-20 flex flex-col items-start text-left xl:max-w-[55%]" style={{ paddingTop: 'calc(var(--navbar-height, 80px) + 5rem)' }}>
          {/* "A Raíz Da" */}
          <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-8 justify-start mb-1 sm:mb-4" data-aos="fade-right" data-aos-delay="0">
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] md:text-[100px] leading-none text-black">{titlePrefixParts[0]}</span>
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] md:text-[100px] leading-none text-black">{titlePrefixParts[1] || ''}</span>
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] md:text-[100px] leading-none text-black">{t('hero.title_suffix')}</span>
          </div>

          {/* "Decisões Certas" */}
          <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-8 justify-start" data-aos="fade-right" data-aos-delay="150">
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] md:text-[100px] leading-none text-black">{t('hero.title_decisions')}</span>
            <span className="font-['Onest'] font-bold text-[42px] sm:text-[72px] md:text-[100px] leading-none text-black">{t('hero.title_right')}</span>
          </div>
        </div>

        {/* Bottom Block: Description & Button */}
        <div className="relative z-10 w-full flex flex-col items-start mt-4 sm:mt-8">
          {/* Subtitle */}
          <div className="mb-6 sm:mb-8 max-w-[600px]" data-aos="fade-up" data-aos-delay="300">
            <p className="font-['Onest'] font-medium text-[18px] sm:text-[22px] md:text-[24px] leading-tight text-[#0a0a0a]">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* CTA Button — scrolls to about on desktop, navigates on mobile */}
          <div data-aos="fade-up" data-aos-delay="300" data-aos-offset="-300">
            <button
              onClick={() => navigate('/indicators')}
              className="bg-primary text-[#fafafa] flex items-center gap-3 px-6 py-3 sm:px-8 sm:py-4 rounded-full hover:bg-[color:var(--color-primary-hover)] transition-all shadow-md"
            >
              <img src={imgArrowDown} alt="" className="w-5 h-5 sm:w-6 sm:h-6 hidden sm:block" />
              <span className="font-['Onest'] font-medium text-[18px] sm:text-[24px]">{t('hero.cta')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Hero Images — only on small screens (below sm) */}
        <div className="sm:hidden relative z-10 mt-8 mb-8" data-aos="fade-up" data-aos-delay="400">
          {/* Image 1: landscape, offset to the right */}
          <div className="ml-[28%] h-[150px] rounded-[15px] shadow-[0px_0px_1.5px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-3">
            <img src={imgRectangle66} alt="" className="w-full h-full object-cover" />
          </div>
          {/* Images 2 & 3: side by side, different heights */}
          <div className="flex gap-3">
            <div className="w-[55%] h-[200px] rounded-[15px] shadow-[0px_0px_1.5px_2px_rgba(0,0,0,0.05)] overflow-hidden">
              <img src={imgRectangle65} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-[45%] h-[165px] rounded-[15px] shadow-[0px_0px_1.5px_2px_rgba(0,0,0,0.05)] overflow-hidden self-end">
              <img src={imgRectangle69} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
