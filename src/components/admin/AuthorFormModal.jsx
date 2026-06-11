import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { LuX, LuUpload, LuUser, LuTrash2 } from 'react-icons/lu';
import FormInput from '../forms/FormInput';
import FormTextarea from '../forms/FormTextarea';
import useSlideOver from '../../hooks/useSlideOver';
import authorService from '../../services/authorService';
import blogService from '../../services/blogService';

// "Novo autor" slide-over form (Figma node 2923:9397).
//
// The design shows more fields than the backend persists. The author API
// accepts: name, email, role, orcid, linkedin (+ instagram/facebook/github,
// not in this design). Fields the API does NOT accept — Apelido (folded into
// `name`), Descrição PT/EN, Instituição, Scopus ID, ResearchGate — are still
// rendered to match the design but are not sent on save.
const EMPTY = {
  nome: '', apelido: '', email: '',
  description: '', description_en: '',
  institution: '', role: '',
  orcid: '', scopus: '', researchgate: '', linkedin: '',
};

function SectionTitle({ children }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-['Onest'] font-medium text-[24px] text-[#0a0a0a]">{children}</h3>
      <div className="h-px w-full bg-[#e5e5e5]" />
    </div>
  );
}
SectionTitle.propTypes = { children: PropTypes.node };

export default function AuthorFormModal({ onClose, author = null, onSaved }) {
  const { t } = useTranslation();
  const [data, setData] = useState(EMPTY);
  const [lang, setLang] = useState('pt');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { requestClose, backdropClass, panelClass } = useSlideOver(onClose);

  // Profile photo upload state.
  // - `photoFile` is the new file the user picked this session (uploaded on save).
  // - `photoPreview` is the URL shown in the modal: either a local object URL
  //   for a freshly picked file, or the server URL for the existing photo.
  // - `removePhoto` flags that the user clicked Remove on an existing photo;
  //   honoured on save by clearing `photo_url` via the update call.
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const photoInputRef = useRef(null);

  const isEdit = !!author?.id;

  useEffect(() => {
    if (author) {
      // Split the stored full name back into first/last for the two inputs.
      const parts = (author.name || '').trim().split(/\s+/);
      setData({
        ...EMPTY,
        nome: parts.slice(0, -1).join(' ') || parts[0] || '',
        apelido: parts.length > 1 ? parts[parts.length - 1] : '',
        email: author.email || '',
        role: author.role || '',
        orcid: author.orcid || '',
        linkedin: author.linkedin || '',
      });
      setPhotoPreview(author.photo_url ? blogService.getFileUrl(author.photo_url) : null);
    } else {
      setData(EMPTY);
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setRemovePhoto(false);
  }, [author]);

  // Object URLs leak unless revoked. Only the freshly picked file's preview
  // is a blob — the server URL doesn't need cleanup.
  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('admin.authors.invalid_photo', 'Selecione um ficheiro de imagem.'));
      return;
    }
    setPhotoFile(file);
    setRemovePhoto(false);
    setError(null);
  };

  const handlePhotoRemove = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    // Only mark removal when editing an author that actually had a photo —
    // otherwise there's nothing to clear server-side.
    setRemovePhoto(Boolean(author?.photo_url));
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [requestClose]);

  const set = (key) => (value) => setData(prev => ({ ...prev, [key]: value }));

  const canSave = data.nome.trim() && data.apelido.trim() && data.email.trim();

  const handleSave = async () => {
    if (!canSave) return;
    // Only the backend-supported fields are sent. Description / institution /
    // scopus / researchgate are captured in the UI but not persisted.
    const payload = {
      name: `${data.nome.trim()} ${data.apelido.trim()}`.trim(),
      email: data.email.trim() || undefined,
      role: data.role.trim() || undefined,
      orcid: data.orcid.trim() || undefined,
      linkedin: data.linkedin.trim() || undefined,
    };
    try {
      setSaving(true);
      setError(null);
      let saved = isEdit
        ? await authorService.update(author.id, payload)
        : await authorService.create(payload);

      // Photo step is best-effort relative to the core save: if the upload
      // fails we surface the error but the author has already been saved.
      if (photoFile && saved?.id) {
        try {
          const result = await authorService.uploadPhoto(saved.id, photoFile);
          saved = { ...saved, photo_url: result.photo_url };
        } catch (uploadErr) {
          setError(uploadErr.userMessage || uploadErr.message
            || t('admin.authors.photo_upload_error', 'Autor guardado, mas a foto não foi carregada.'));
        }
      } else if (removePhoto && isEdit && saved?.id) {
        // Clear the existing photo by updating photo_url to empty. The
        // backend's AuthorUpdate doesn't expose `photo_url` directly today,
        // so we fall back to the existing PUT payload — if the field gets
        // added later this picks it up automatically.
        try {
          saved = await authorService.update(saved.id, { ...payload, photo_url: '' });
        } catch (_) { /* swallow — photo removal is non-fatal */ }
      }

      onSaved?.(saved);
      requestClose();
    } catch (err) {
      setError(err.userMessage || err.message || t('admin.authors.save_error', 'Não foi possível guardar o autor.'));
    } finally {
      setSaving(false);
    }
  };

  const languageTabs = (
    <div className="flex gap-1 p-1 bg-[#f5f5f5] rounded-xl">
      {[{ k: 'pt', l: 'Português' }, { k: 'en', l: 'English' }].map(({ k, l }) => (
        <button
          key={k}
          type="button"
          onClick={() => setLang(k)}
          className={`flex-1 py-2 px-4 rounded-lg font-['Onest'] font-medium text-[14px] transition-colors cursor-pointer ${
            lang === k ? 'bg-[#fffefc] text-[#0a0a0a] shadow-sm' : 'text-[#404040] hover:text-[#0a0a0a]'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-['Onest']">
      <div className={backdropClass} onClick={requestClose} aria-hidden />

      <aside className={`relative h-full w-full max-w-[807px] bg-[#fffefc] shadow-2xl flex flex-col ${panelClass}`}>
        {/* Header */}
        <div className="bg-[#f3f4f6] border-b border-[#e0e0e0] px-8 pt-10 pb-8 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-[32px] leading-none tracking-[-0.32px] text-[#0a0a0a]">
              {isEdit ? t('admin.authors.edit_title', 'Editar autor') : t('admin.authors.new_title', 'Novo autor')}
            </h2>
            <button type="button" onClick={requestClose} aria-label={t('common.close', 'Fechar')} className="text-[#404040] hover:text-[#0a0a0a] cursor-pointer">
              <LuX className="w-6 h-6" strokeWidth={1.75} />
            </button>
          </div>
          <p className="font-medium text-[18px] leading-6 text-[#0a0a0a]">
            {t('admin.authors.new_subtitle', 'Preencha todos os campos obrigatórios para adicionar um novo autor.')}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-10">
          {error && (
            <div className="rounded-xl border border-[#dc2626]/30 bg-[#dc2626]/5 px-4 py-3 text-[#dc2626] text-sm">{error}</div>
          )}

          {/* Informações pessoais */}
          <div className="flex flex-col gap-6">
            <SectionTitle>{t('admin.authors.section_personal', 'Informações pessoais')}</SectionTitle>

            {/* Profile picture */}
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-full bg-[#f3f4f6] border border-[#e5e5e5] overflow-hidden flex items-center justify-center shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <LuUser className="w-10 h-10 text-[#a3a3a3]" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-medium text-[15px] text-[#0a0a0a]">
                  {t('admin.authors.profile_picture', 'Fotografia de perfil')}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[14px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] transition-colors cursor-pointer"
                  >
                    <LuUpload className="w-4 h-4" strokeWidth={1.75} />
                    {photoPreview
                      ? t('admin.authors.change_photo', 'Mudar foto')
                      : t('admin.authors.upload_photo', 'Carregar foto')}
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handlePhotoRemove}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[14px] text-[#dc2626] hover:bg-[#dc2626]/10 transition-colors cursor-pointer"
                    >
                      <LuTrash2 className="w-4 h-4" strokeWidth={1.75} />
                      {t('common.remove', 'Remover')}
                    </button>
                  )}
                </div>
                <p className="text-[12px] text-[#737373]">
                  {t('admin.authors.photo_hint', 'PNG, JPG ou WebP — quadrada de preferência.')}
                </p>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoPick}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormInput label={t('admin.authors.first_name', 'Nome')} name="author_nome" value={data.nome} onChange={set('nome')} placeholder="Ex. Mariana" required />
              <FormInput label={t('admin.authors.last_name', 'Apelido')} name="author_apelido" value={data.apelido} onChange={set('apelido')} placeholder="Ex. Rodrigues" required />
            </div>
            <FormInput label={t('admin.authors.email', 'E-mail')} name="author_email" type="email" value={data.email} onChange={set('email')} placeholder="marianarodrigues@universidade.pt" required />
          </div>

          {/* Descrição (visual only — not persisted) */}
          <div className="flex flex-col gap-6">
            {languageTabs}
            {lang === 'pt' ? (
              <FormTextarea label={t('admin.authors.description', 'Descrição')} name="author_desc_pt" value={data.description} onChange={set('description')} placeholder={t('admin.authors.description_placeholder', 'Escreva uma descrição')} rows={5} required />
            ) : (
              <FormTextarea label={t('admin.authors.description', 'Descrição')} name="author_desc_en" value={data.description_en} onChange={set('description_en')} placeholder={t('admin.authors.description_placeholder', 'Escreva uma descrição')} rows={5} />
            )}
          </div>

          {/* Afiliação */}
          <div className="flex flex-col gap-6">
            <SectionTitle>{t('admin.authors.section_affiliation', 'Afiliação')}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormInput label={t('admin.authors.institution', 'Instituição')} name="author_institution" value={data.institution} onChange={set('institution')} placeholder="Ex. Universidade de Aveiro" />
              <FormInput label={t('admin.authors.role', 'Cargo')} name="author_role" value={data.role} onChange={set('role')} placeholder="Ex. Investigadora" />
            </div>
          </div>

          {/* Identificadores */}
          <div className="flex flex-col gap-6">
            <SectionTitle>{t('admin.authors.section_identifiers', 'Identificadores')}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormInput label="ORCID" name="author_orcid" value={data.orcid} onChange={set('orcid')} placeholder="0000-0000-0000-0000" />
              <FormInput label="Scopus ID" name="author_scopus" value={data.scopus} onChange={set('scopus')} placeholder="57201234567" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormInput label="ResearchGate" name="author_rg" value={data.researchgate} onChange={set('researchgate')} placeholder={t('admin.authors.url_or_username', 'URL ou username')} />
              <FormInput label="LinkedIn" name="author_linkedin" value={data.linkedin} onChange={set('linkedin')} placeholder={t('admin.authors.url_or_username', 'URL ou username')} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#fafafa] border-t border-[#e0e0e0] px-8 py-6 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[17px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] transition-colors cursor-pointer"
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#009368] hover:bg-[#007d57] font-medium text-[17px] text-[#fafafa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? t('common.processing', 'A processar...') : (isEdit ? t('admin.authors.save', 'Guardar autor') : t('admin.authors.add', 'Adicionar autor'))}
          </button>
        </div>
      </aside>
    </div>
  );
}

AuthorFormModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  author: PropTypes.object,
  onSaved: PropTypes.func,
};
