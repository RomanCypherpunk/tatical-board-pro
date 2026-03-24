/**
 * Arrow type definitions — visual style for each tactical arrow type.
 */
const ARROW_STYLES = {
  run: {
    dash: 'none',
    headType: 'triangle',
    defaultColor: '#FFD700',
    label: 'Corrida',
  },
  pass: {
    dash: '8 4',
    headType: 'open',
    defaultColor: '#3B82F6',
    label: 'Passe',
  },
  dribble: {
    dash: '4 4',
    headType: 'triangle',
    defaultColor: '#10B981',
    label: 'Drible',
  },
  press: {
    dash: '3 6',
    headType: 'diamond',
    defaultColor: '#EF4444',
    label: 'Pressão',
  },
};

export default ARROW_STYLES;
