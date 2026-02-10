import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { ROUTES } from '../constants/routes';

export default function Footer() {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary mt-auto relative">
      <div className="max-w-[1512px] mx-auto px-12 py-16">
        <h2 className="text-[48px] font-semibold text-primary-content text-center mb-16 leading-[1.18] tracking-[-0.48px]">
          {t('footer.tagline_1')}{' '}
          <br />{t('footer.tagline_2')} <span className="font-bold">{t('footer.tagline_yours')}</span> {t('footer.tagline_3')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-12">
          <div className="md:col-span-2 space-y-12">
            <div>
              <h3 className="text-[30px] font-semibold text-primary-content mb-4 tracking-[-0.3px]">
                {t('footer.address_title')}
              </h3>
              <p className="text-2xl text-primary-content leading-[1.5]">
                {t('footer.address_line1')}<br />
                {t('footer.address_line2')}
              </p>
            </div>

            <div>
              <h3 className="text-[30px] font-semibold text-primary-content mb-4 tracking-[-0.3px]">
                {t('footer.email_title')}
              </h3>
              <p className="text-2xl text-primary-content leading-[1.5]">
                {t('footer.email_value')}
              </p>
            </div>

            <div>
              <h3 className="text-[30px] font-semibold text-primary-content mb-4 tracking-[-0.3px]">
                {t('footer.phone_title')}
              </h3>
              <p className="text-2xl text-primary-content leading-[1.5]">
                {t('footer.phone_value')}
              </p>
            </div>

            <div>
              <h3 className="text-[30px] font-semibold text-primary-content mb-4 tracking-[-0.3px]">
                {t('footer.social_title')}
              </h3>
              <div className="flex gap-4">
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-[#e5e5e5] hover:bg-white/20">
                  <i className="fab fa-instagram text-primary-content"></i>
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-[#e5e5e5] hover:bg-white/20">
                  <i className="fab fa-linkedin text-primary-content"></i>
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-[#e5e5e5] hover:bg-white/20">
                  <i className="fab fa-twitter text-primary-content"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="col-span-1">
              <label className="text-2xl font-semibold text-primary-content mb-2 block tracking-[-0.48px]">
                {t('footer.form_name')}
              </label>
              <input
                type="text"
                className="w-full h-[42px] px-[14px] py-[8.75px] rounded-[9.333px] border-[1.167px] border-[#e5e5e5] bg-white shadow-[0px_1.057px_2.114px_0px_rgba(0,0,0,0.05)]"
              />
            </div>

            <div className="col-span-1">
              <label className="text-2xl font-semibold text-primary-content mb-2 block tracking-[-0.48px]">
                {t('footer.form_email')}
              </label>
              <input
                type="email"
                className="w-full h-[42px] px-[14px] py-[8.75px] rounded-[9.333px] border-[1.167px] border-[#e5e5e5] bg-white shadow-[0px_1.057px_2.114px_0px_rgba(0,0,0,0.05)]"
              />
            </div>

            <div className="col-span-2">
              <label className="text-2xl font-semibold text-primary-content mb-2 block tracking-[-0.48px]">
                {t('footer.form_message')}
              </label>
              <textarea
                className="w-full h-[220px] px-[14px] py-[8.75px] rounded-[9.333px] border-[1.167px] border-[#e5e5e5] bg-white shadow-[0px_1.057px_2.114px_0px_rgba(0,0,0,0.05)] resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-[30px] font-semibold text-primary-content mb-6 tracking-[-0.3px]">
            {t('footer.support_title')}
          </h3>
          <div className="flex justify-center gap-8">
            <div className="text-primary-content opacity-50 text-sm">Logo Placeholder</div>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-primary-content/20 text-center">
            <p className="text-primary-content opacity-70">
                {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className="w-16 h-16 flex items-center justify-center rounded-full bg-base-100 absolute bottom-8 right-8"
        aria-label="Scroll to top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6 text-black"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
    </footer>
  );
}
