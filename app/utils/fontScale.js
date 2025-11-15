import { moderateScale, isTablet } from './responsive';

const fontScaleMultipliers = {
  small: 0.875,
  medium: 1,
  large: 1.15,
};

export const getScaledFontSize = (baseSize, fontSizeSetting = 'medium') => {
  const multiplier = fontScaleMultipliers[fontSizeSetting] || 1;
  const scaledSize = baseSize * multiplier;
  
  if (isTablet()) {
    return moderateScale(scaledSize * 1.2);
  }
  
  return moderateScale(scaledSize);
};

export const getFontScale = (fontSizeSetting = 'medium') => {
  return fontScaleMultipliers[fontSizeSetting] || 1;
};

export const createFontSizeScale = (fontSizeSetting = 'medium') => {
  const scale = getFontScale(fontSizeSetting);
  
  return {
    xs: getScaledFontSize(10, fontSizeSetting),
    sm: getScaledFontSize(12, fontSizeSetting),
    md: getScaledFontSize(14, fontSizeSetting),
    base: getScaledFontSize(16, fontSizeSetting),
    lg: getScaledFontSize(18, fontSizeSetting),
    xl: getScaledFontSize(20, fontSizeSetting),
    xxl: getScaledFontSize(24, fontSizeSetting),
    xxxl: getScaledFontSize(28, fontSizeSetting),
  };
};
