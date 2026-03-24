/**
 * Pitch visual themes — each defines field color, line color, and stripe behavior.
 */
const PITCH_THEMES = {
  green: {
    field: '#2D8B4E',
    fieldDark: '#267A43',
    line: 'rgba(255,255,255,0.85)',
    stripe: true,
    label: 'Verde',
  },
  dark: {
    field: '#1E293B',
    fieldDark: '#1E293B',
    line: '#94A3B8',
    stripe: false,
    label: 'Escuro',
  },
  white: {
    field: '#F8FAFC',
    fieldDark: '#F8FAFC',
    line: '#1E293B',
    stripe: false,
    label: 'Branco',
  },
  chalk: {
    field: '#1B4332',
    fieldDark: '#1B4332',
    line: '#D4E09B',
    stripe: false,
    label: 'Giz',
  },
};

export default PITCH_THEMES;
