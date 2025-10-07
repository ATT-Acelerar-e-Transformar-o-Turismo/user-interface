/**
 * Color utility functions for determining optimal foreground colors
 */

/**
 * Calculate the relative luminance of a color
 * Based on WCAG 2.1 guidelines
 * @param {string} color - Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns {number} Relative luminance value between 0 and 1
 */
export function getRelativeLuminance(color) {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const getRGBValue = (val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  
  const rLinear = getRGBValue(r);
  const gLinear = getRGBValue(g);
  const bLinear = getRGBValue(b);
  
  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * @param {number} luminance1 - Relative luminance of first color
 * @param {number} luminance2 - Relative luminance of second color
 * @returns {number} Contrast ratio
 */
export function getContrastRatio(luminance1, luminance2) {
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine if white or black text should be used on a given background color
 * @param {string} backgroundColor - Hex color string
 * @returns {string} Either "#FFFFFF" (white) or "#000000" (black)
 */
export function getOptimalTextColor(backgroundColor) {
  const bgLuminance = getRelativeLuminance(backgroundColor);
  const whiteLuminance = 1; // White has luminance of 1
  const blackLuminance = 0; // Black has luminance of 0
  
  const whiteContrast = getContrastRatio(bgLuminance, whiteLuminance);
  const blackContrast = getContrastRatio(bgLuminance, blackLuminance);
  
  // Return the color with better contrast
  return whiteContrast > blackContrast ? "#FFFFFF" : "#000000";
}

/**
 * Simple alternative using the YIQ color space
 * This is faster but less accurate than the WCAG method
 * @param {string} backgroundColor - Hex color string
 * @returns {string} Either "#FFFFFF" (white) or "#000000" (black)
 */
export function getOptimalTextColorSimple(backgroundColor) {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate YIQ value
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return black for light backgrounds, white for dark backgrounds
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

/**
 * Check if a color combination meets WCAG accessibility standards
 * @param {string} foreground - Hex color of text
 * @param {string} background - Hex color of background
 * @param {string} level - "AA" or "AAA" compliance level
 * @returns {object} Object with compliance information
 */
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