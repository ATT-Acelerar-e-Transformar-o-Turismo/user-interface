import PropTypes from 'prop-types';
import ChartTypeGlyph from './ChartTypeGlyph';

// One selectable chart-type tile: checkbox + label + a lightweight SVG preview.
// Previews are pure SVG (no chart engine), so the whole 15-tile grid renders
// instantly and can never wedge the main thread the way live ApexCharts did.
export default function ChartTypeOption({ type, label, checked, onToggle }) {
  return (
    <label
      className={`flex flex-col gap-2 cursor-pointer border rounded-lg p-2 transition-colors ${checked ? 'border-[#009368] bg-[#009368]/5' : 'border-[#e5e5e5] hover:border-[#d4d4d4]'}`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="w-[18px] h-[18px] rounded border-[#d4d4d4] accent-[#009368]"
          checked={checked}
          onChange={onToggle}
        />
        <span className="text-[14px] font-medium text-[#0a0a0a]">{label}</span>
      </div>
      <div className={`w-full rounded bg-white flex items-center justify-center py-1 ${checked ? 'text-[#009368]' : 'text-[#9ca3af]'}`}>
        <ChartTypeGlyph type={type} />
      </div>
    </label>
  );
}

ChartTypeOption.propTypes = {
  type: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};
