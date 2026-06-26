import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LuPlus, LuSquarePen, LuTrash2, LuSearch } from 'react-icons/lu';
import AdminPageTemplate from './AdminPageTemplate';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import CommunicationTabs from '../components/admin/CommunicationTabs';
import InitialsAvatar from '../components/admin/InitialsAvatar';
import AuthorFormModal from '../components/admin/AuthorFormModal';
import authorService from '../services/authorService';
import blogService from '../services/blogService';
import { confirmAction } from '../utils/confirm';
import { ptCompare } from '../utils/sort';

export default function AuthorsManagement() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const localizedRole = (a) => ((isEn && a.role_en) ? a.role_en : a.role);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);

  useEffect(() => { loadAuthors(); }, []);

  const loadAuthors = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await authorService.getAll();
      setAuthors(Array.isArray(resp) ? resp : resp?.authors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const visible = useMemo(() => {
    let list = [...authors];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.role || '').toLowerCase().includes(q) ||
        (a.role_en || '').toLowerCase().includes(q));
    }
    list.sort((a, b) => ptCompare(a.name, b.name));
    return list;
  }, [authors, search]);

  const handleDelete = async (author) => {
    const ok = await confirmAction({
      title: t('common.confirm_title'),
      message: t('admin.authors.confirm_delete', { name: author.name, defaultValue: `Eliminar o autor "${author.name}"?` }),
    });
    if (!ok) return;
    try {
      await authorService.delete(author.id);
      setAuthors(prev => prev.filter(a => a.id !== author.id));
    } catch (err) {
      setError(err.userMessage || err.message);
    }
  };

  const openNew = () => { setEditingAuthor(null); setModalOpen(true); };
  const openEdit = (author) => { setEditingAuthor(author); setModalOpen(true); };

  if (loading) {
    return (
      <AdminPageTemplate bgClassName="bg-[#f3f4f6]">
        <div className="py-8 px-4 md:px-12"><LoadingSkeleton /></div>
      </AdminPageTemplate>
    );
  }
  if (error) return <ErrorDisplay error={error} onRetry={loadAuthors} />;

  return (
    <AdminPageTemplate bgClassName="bg-[#f3f4f6]">
      <div className="px-4 md:px-12 pb-12 pt-8">
        <div className="max-w-[1416px] mx-auto flex flex-col gap-8">
          <CommunicationTabs />

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-['Onest'] font-semibold text-[32px] leading-none tracking-[-0.32px] text-[#0a0a0a]">
              {t('admin.authors.title', 'Autores')}
            </h1>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#009368] hover:bg-[#007d57] text-white font-['Onest'] font-medium text-[17px] transition-colors cursor-pointer"
            >
              <LuPlus className="w-4 h-4" strokeWidth={2} />
              {t('admin.authors.add', 'Adicionar autor')}
            </button>
          </div>

          {/* Search */}
          <div className="flex justify-end">
            <div className="relative w-full sm:w-[388px]">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.authors.search_placeholder', 'Pesquisar autores')}
                className="w-full h-11 pl-4 pr-10 rounded-full border border-[#e5e5e5] bg-[#fffefc] font-['Onest'] text-[15px] text-[#0a0a0a] placeholder:text-[#737373] focus:outline-none focus:border-[#009368] shadow-sm"
              />
              <LuSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373] pointer-events-none" strokeWidth={1.75} />
            </div>
          </div>

          {/* Table card */}
          <div className="bg-white rounded-2xl shadow-[0px_0px_3px_2px_rgba(0,0,0,0.05)] p-8">
            {visible.length === 0 ? (
              <div className="text-center py-12 text-[#737373] font-['Onest']">
                {t('admin.authors.empty', 'Ainda não há autores.')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-4 pr-6 font-['Onest'] font-semibold text-[24px] tracking-[-0.48px] text-[#0a0a0a]">{t('admin.authors.col_name', 'Nome')}</th>
                      <th className="pb-4 px-4 font-['Onest'] font-semibold text-[24px] tracking-[-0.48px] text-[#0a0a0a]">{t('admin.authors.col_role', 'Cargo')}</th>
                      <th className="pb-4 px-4 font-['Onest'] font-semibold text-[24px] tracking-[-0.48px] text-[#0a0a0a]">{t('admin.authors.col_email', 'E-mail')}</th>
                      <th className="pb-4 pl-4 font-['Onest'] font-semibold text-[24px] tracking-[-0.48px] text-[#0a0a0a] text-center">{t('admin.authors.col_options', 'Opções')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(author => (
                      <tr key={author.id} className="align-middle">
                        <td className="py-3 pr-6">
                          <button type="button" onClick={() => openEdit(author)} className="flex items-center gap-3 hover:text-[#009368] cursor-pointer text-left">
                            <InitialsAvatar name={author.name} photoUrl={author.photo_url ? blogService.getFileUrl(author.photo_url) : null} size="md" />
                            <span className="font-['Onest'] font-medium text-[18px] text-[#0a0a0a]">{author.name}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 font-['Onest'] font-medium text-[18px] text-[#0a0a0a]">{localizedRole(author) || '—'}</td>
                        <td className="py-3 px-4 font-['Onest'] text-[16px] text-[#404040]">{author.email || '—'}</td>
                        <td className="py-3 pl-4">
                          <div className="flex items-center justify-center gap-4">
                            <button type="button" onClick={() => openEdit(author)} className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer" aria-label={t('common.edit')}>
                              <LuSquarePen className="w-6 h-6" strokeWidth={1.75} />
                            </button>
                            <button type="button" onClick={() => handleDelete(author)} className="text-[#dc2626] hover:opacity-75 cursor-pointer" aria-label={t('common.delete')}>
                              <LuTrash2 className="w-6 h-6" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && <AuthorFormModal
        onClose={() => { setModalOpen(false); setEditingAuthor(null); }}
        author={editingAuthor}
        onSaved={(saved) => {
          setAuthors(prev => {
            const exists = prev.some(a => a.id === saved.id);
            return exists ? prev.map(a => a.id === saved.id ? saved : a) : [...prev, saved];
          });
        }}
      />}
    </AdminPageTemplate>
  );
}
