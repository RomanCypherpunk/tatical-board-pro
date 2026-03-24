/**
 * Shirt pattern definitions.
 * Each pattern has a key, label, and a function that returns SVG pattern content.
 * Patterns use primaryColor and secondaryColor of the team.
 */
const SHIRT_PATTERNS = [
  { key: 'solid', label: 'Sólido' },
  { key: 'cheques', label: 'Cheques' },
  { key: 'half_half_h', label: 'Half & Half H' },
  { key: 'half_half_v', label: 'Half & Half V' },
  { key: 'stripes_v', label: 'Stripes Vertical' },
  { key: 'stripes_h', label: 'Stripes Horizontal' },
  { key: 'stripes_thin', label: 'Stripes Thin' },
  { key: 'stripe_diagonal', label: 'Stripe Diagonal' },
  { key: 'stripe_h', label: 'Stripe Horizontal' },
  { key: 'stripe_v', label: 'Stripe Vertical' },
  { key: 'stripe_cut', label: 'Stripe Cut' },
  { key: 'stripe_thick', label: 'Stripe Thick' },
  { key: 'quarters', label: 'Quarters' },
  { key: 'vshape', label: 'V-Shape' },
];

export default SHIRT_PATTERNS;
