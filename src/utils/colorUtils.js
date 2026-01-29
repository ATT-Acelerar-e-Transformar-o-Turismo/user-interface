export function getRelativeLuminance(color) {
  const hex = color.replace('#', '');

  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const getRGBValue = (val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const rLinear = getRGBValue(r);
  const gLinear = getRGBValue(g);
  const bLinear = getRGBValue(b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

export function getContrastRatio(luminance1, luminance2) {
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getOptimalTextColor(backgroundColor) {
  const bgLuminance = getRelativeLuminance(backgroundColor);
  const whiteLuminance = 1;
  const blackLuminance = 0;

  const whiteContrast = getContrastRatio(bgLuminance, whiteLuminance);
  const blackContrast = getContrastRatio(bgLuminance, blackLuminance);

  return whiteContrast > blackContrast ? "#FFFFFF" : "#000000";
}

export function getOptimalTextColorSimple(backgroundColor) {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

export function checkWCAGCompliance(foreground, background, level = "AA") {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  const contrast = getContrastRatio(fgLuminance, bgLuminance);

  const requirements = {
    AA: { normal: 4.5, large: 3 },
    AAA: { normal: 7, large: 4.5 }
  };

  const req = requirements[level];

  return {
    contrast: contrast.toFixed(2),
    passNormal: contrast >= req.normal,
    passLarge: contrast >= req.large,
    level,
    recommendation: contrast >= req.normal ? foreground : getOptimalTextColor(background)
  };
}
