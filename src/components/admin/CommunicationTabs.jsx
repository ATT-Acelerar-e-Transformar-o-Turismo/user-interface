import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Segmented tab nav for the Communication admin area
// (Notícias e Eventos / Publicações / Autores) — Figma node 2903:18787.
// Route-based: each tab links to its management page.
export default function CommunicationTabs() {
  const { t } = useTranslation();

  const tabs = [
    { to: '/admin/news-events', label: t('admin.news_events.tab', 'Notícias e Eventos') },
    { to: '/admin/publications', label: t('admin.publications.tab', 'Publicações') },
    { to: '/admin/authors', label: t('admin.authors.tab', 'Autores') },
  ];

  return (
    <div className="inline-flex items-center gap-1 bg-[#fffefc] border border-[#e5e5e5] rounded-full p-1 shadow-sm w-fit">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `px-4 py-2 rounded-full font-['Onest'] font-medium text-[17px] whitespace-nowrap transition-colors ${
              isActive ? 'bg-[#009368] text-[#fffefc]' : 'text-[#0a0a0a] hover:bg-black/[0.03]'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
