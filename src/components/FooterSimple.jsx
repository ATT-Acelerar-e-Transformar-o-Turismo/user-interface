import { useTranslation } from 'react-i18next';
import logo from '../assets/logo-roots.svg';

export default function FooterSimple() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#fffefc] rounded-t-3xl mt-auto flex flex-col w-full">
      {/* Top section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 md:gap-8 px-6 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10 md:px-12 md:pt-10 md:pb-12">
        {/* Left: Logo + Contact */}
        <div className="flex flex-col gap-6 md:gap-8">
          <img
            src={logo}
            alt="ROOTS"
            className="w-36 md:w-48 h-auto"
          />
          <div className="flex flex-col gap-3 md:gap-4">
            <h4 className="text-lg md:text-2xl font-semibold tracking-tight leading-snug text-base-content">
              {t('footer_simple.contacts')}
            </h4>
            <div className="text-sm md:text-base text-base-content leading-relaxed">
              <p>{t('footer_simple.address_line1')}</p>
              <p>{t('footer_simple.address_line2')}</p>
              <a
                href="mailto:degeit-roots@ua.pt"
                className="underline mt-2 block"
              >
                degeit-roots@ua.pt
              </a>
            </div>
          </div>
        </div>

        {/* Right: Support logos */}
        <div className="flex flex-col items-start md:items-end gap-3 md:gap-4">
          <h4 className="text-lg md:text-2xl font-semibold tracking-tight leading-snug text-base-content">
            {t('footer_simple.support')}
          </h4>
          <img
            src="/assets/roots/footer-logos-bar.png"
            alt={t('footer_simple.support')}
            className="h-8 md:h-12 w-auto object-contain"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-primary rounded-t-2xl flex items-center justify-center py-3 md:py-4 px-4 w-full">
        <p className="text-sm md:text-lg font-medium text-primary-content text-center">
          copyright &copy; {new Date().getFullYear()}, &nbsp;Universidade de Aveiro, All rights reserved
        </p>
      </div>
    </footer>
  );
}
