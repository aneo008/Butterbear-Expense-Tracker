// Butter design system — warm, comforting palette and shape/typography tokens.
// Pull from here instead of scattering hex literals across screens.

export const colors = {
  bgCream: '#FFFBF2',
  bgCard: '#FFFFFF',
  butter: '#F5C45E',
  butterDeep: '#ECB13F',
  bearBody: '#E3C49A',
  bearShadow: '#C9A06E',
  cheekPink: '#F4A6A0',
  mint: '#A8D8C8',
  textBrown: '#5A4632',
  textSoft: '#9C8772',
  warnSoft: '#E8A87C',
  hairline: '#E3C49A44',
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

// Soft warm drop shadow used on cards.
export const cardShadow = {
  shadowColor: colors.bearShadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
};

export const softShadow = {
  shadowColor: colors.bearShadow,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};

// Font families (loaded in app/_layout via expo-font). Use the display family
// for big numbers, the body family for everything else.
export const fonts = {
  display: 'Baloo2_700Bold',
  displaySemi: 'Baloo2_600SemiBold',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
};
