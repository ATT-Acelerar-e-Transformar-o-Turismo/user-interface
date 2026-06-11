import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { LuLink, LuUpload } from 'react-icons/lu';
import { SOURCE_API, SOURCE_UPLOAD } from '../../utils/resourceSource';

// Pill that labels an indicator's data source. API = wrapper-backed (yellow,
// link icon), Upload = manually uploaded dataset (rose, upload icon).
// Matches Figma node 2892:15199.
export default function SourcePill({ source }) {
  const { t } = useTranslation();
  if (source !== SOURCE_API && source !== SOURCE_UPLOAD) {
    return <span className="font-['Onest'] text-[14px] text-[#737373]">—</span>;
  }

  const isApi = source === SOURCE_API;
  const Icon = isApi ? LuLink : LuUpload;
  const bg = isApi ? 'bg-[#eab308]' : 'bg-[#fb7185]';
  const label = isApi ? t('admin.indicators.source_api', 'API') : t('admin.indicators.source_upload', 'Upload');

  return (
    <span className={`inline-flex items-center gap-2.5 ${bg} rounded-[22px] px-3 py-2`}>
      <Icon className="w-5 h-5 text-[#fffefc]" strokeWidth={1.75} aria-hidden="true" />
      <span className="font-['Onest'] font-medium text-[14px] tracking-[0.07px] text-[#fffefc] whitespace-nowrap">{label}</span>
    </span>
  );
}

SourcePill.propTypes = {
  source: PropTypes.oneOf([SOURCE_API, SOURCE_UPLOAD, null, undefined]),
};
