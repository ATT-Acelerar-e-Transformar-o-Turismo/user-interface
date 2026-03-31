import { useTranslation } from 'react-i18next';

/**
 * Returns a function that picks the right name field based on the current language.
 * - EN: returns `name_en` if available, falls back to `name`
 * - PT (default): returns `name`
 * Also handles plain strings (returns as-is).
 *
 * The returned function also exposes:
 *   getName.isEn  — boolean, true when current language is English
 *   getName.field(item, ptKey, enKey) — pick any pair of bilingual fields
 */
export default function useLocalizedName() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const getName = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return (isEn && item.name_en) ? item.name_en : (item.name || '');
  };

  getName.isEn = isEn;
  getName.field = (item, ptKey, enKey) => {
    if (!item) return '';
    return (isEn && item[enKey]) ? item[enKey] : (item[ptKey] || '');
  };

  return getName;
}
