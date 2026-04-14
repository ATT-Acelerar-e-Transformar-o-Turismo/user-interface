import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { ROUTES } from '../constants/routes';

export default function Footer() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary mt-auto relative">
      <div className="max-w-[1512px] mx-auto px-4 lg:px-12 py-10 lg:py-16">
        <h2 className="text-[28px] lg:text-[48px] font-semibold text-primary-content text-center mb-10 lg:mb-16 leading-[1.18] tracking-[-0.48px]">
          {t('footer.tagline_1')}{' '}
          <br />{t('footer.tagline_2')} <span className="font-bold">{t('footer.tagline_yours')}</span> {t('footer.tagline_3')}
        </h2>

        {/* Form first on mobile, then contact info */}
        <div className="flex flex-col-reverse md:grid md:grid-cols-5 gap-x-12 gap-y-10">
          <div className="md:col-span-2 space-y-8 lg:space-y-12 text-center md:text-left">
            <div>
              <h3 className="text-[20px] lg:text-[30px] font-semibold text-primary-content mb-2 lg:mb-4 tracking-[-0.3px]">
                {t('footer.address_title')}
              </h3>
              <p className="text-base lg:text-2xl text-primary-content leading-[1.5]">
                {t('footer.address_line1')}<br />
                {t('footer.address_line2')}
              </p>
            </div>

            <div>
              <h3 className="text-[20px] lg:text-[30px] font-semibold text-primary-content mb-2 lg:mb-4 tracking-[-0.3px]">
                {t('footer.email_title')}
              </h3>
              <p className="text-base lg:text-2xl text-primary-content leading-[1.5]">
                {t('footer.email_value')}
              </p>
            </div>

          </div>

          <form
            className="md:col-span-3 grid grid-cols-2 gap-x-4 lg:gap-x-6 gap-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const subject = encodeURIComponent(`Contacto de ${name}`);
              const body = encodeURIComponent(`Nome: ${name}\nEmail: ${email}\n\n${message}`);
              window.location.href = `mailto:Degeit-roots@ua.pt?subject=${subject}&body=${body}`;
            }}
          >
            <div className="col-span-1">
              <label htmlFor="footer-name" className="text-base lg:text-2xl font-semibold text-primary-content mb-2 block tracking-[-0.48px]">
                {t('footer.form_name')}
              </label>
              <input
                id="footer-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[42px] px-[14px] py-[8.75px] rounded-[9.333px] border-[1.167px] border-[#e5e5e5] bg-white shadow-[0px_1.057px_2.114px_0px_rgba(0,0,0,0.05)]"
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="footer-email" className="text-base lg:text-2xl font-semibold text-primary-content mb-2 block tracking-[-0.48px]">
                {t('footer.form_email')}
              </label>
              <input
                id="footer-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[42px] px-[14px] py-[8.75px] rounded-[9.333px] border-[1.167px] border-[#e5e5e5] bg-white shadow-[0px_1.057px_2.114px_0px_rgba(0,0,0,0.05)]"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="footer-message" className="text-base lg:text-2xl font-semibold text-primary-content mb-2 block tracking-[-0.48px]">
                {t('footer.form_message')}
              </label>
              <textarea
                id="footer-message"
                name="message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-[180px] lg:h-[220px] px-[14px] py-[8.75px] rounded-[9.333px] border-[1.167px] border-[#e5e5e5] bg-white shadow-[0px_1.057px_2.114px_0px_rgba(0,0,0,0.05)] resize-none"
              ></textarea>
            </div>

            <div className="col-span-2 mt-2">
              <button type="submit" className="w-full border-2 border-[#e5e5e5] text-primary-content px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
                <span className="font-['Onest'] font-medium text-base lg:text-lg">{t('footer.form_submit')}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-10 lg:mt-16 text-center">
          <h3 className="text-[20px] lg:text-[30px] font-semibold text-primary-content mb-4 lg:mb-6 tracking-[-0.3px]">
            {t('footer.support_title')}
          </h3>
          <div className="flex justify-center gap-8">
            <img src="/white-logos.png" alt="Support logos" className="h-8 lg:h-10 object-contain" />
          </div>
        </div>

        <div className="mt-10 lg:mt-16 pt-8 border-t border-primary-content/20 text-center">
            <p className="text-primary-content opacity-70 text-sm lg:text-base">
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
