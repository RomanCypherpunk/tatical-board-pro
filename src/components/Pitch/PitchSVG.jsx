import PITCH_THEMES from '../../data/pitchThemes';
import { PITCH_W, PITCH_H, FW, FH, FL, FT, FR, FB, CX, CY } from './constants';

const FIELD_WIDTH_METERS = 68;
const FIELD_LENGTH_METERS = 105;
const CENTER_CIRCLE_RADIUS = 9.15;
const PENALTY_DEPTH = 16.5;
const PENALTY_WIDTH = 40.32;
const GOAL_AREA_DEPTH = 5.5;
const GOAL_AREA_WIDTH = 18.32;
const GOAL_WIDTH = 7.32;
const PENALTY_SPOT_DISTANCE = 11;
const CORNER_ARC_RADIUS = 1;

function metersToWidth(value) {
  return (value / FIELD_WIDTH_METERS) * FW;
}

function metersToHeight(value) {
  return (value / FIELD_LENGTH_METERS) * FH;
}

/**
 * Renders the football pitch as an SVG group.
 */
export default function PitchSVG({ theme }) {
  const t = PITCH_THEMES[theme];
  const lineW = theme === 'white' ? 1.35 : 2;

  const penaltyWidth = metersToWidth(PENALTY_WIDTH);
  const penaltyDepth = metersToHeight(PENALTY_DEPTH);
  const goalAreaWidth = metersToWidth(GOAL_AREA_WIDTH);
  const goalAreaDepth = metersToHeight(GOAL_AREA_DEPTH);
  const goalWidth = metersToWidth(GOAL_WIDTH);
  const centerRadius = metersToWidth(CENTER_CIRCLE_RADIUS);
  const penaltySpot = metersToHeight(PENALTY_SPOT_DISTANCE);
  const cornerRadius = metersToWidth(CORNER_ARC_RADIUS);
  const goalFrameDepth = 18;

  const arcYOffset = penaltyDepth - penaltySpot;
  const arcXOffset = Math.sqrt(Math.max(centerRadius ** 2 - arcYOffset ** 2, 0));
  const topArcY = FT + penaltyDepth;
  const bottomArcY = FB - penaltyDepth;

  return (
    <g>
      <defs>
        <radialGradient id="pitch-depth-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={PITCH_W} height={PITCH_H} fill={t.field} rx="18" />

      {t.stripe &&
        Array.from({ length: 13 }).map((_, index) => (
          <rect
            key={index}
            x={FL}
            y={FT + index * (FH / 13)}
            width={FW}
            height={FH / 13}
            fill={index % 2 === 0 ? t.field : t.fieldDark}
          />
        ))}

      <rect x={FL} y={FT} width={FW} height={FH} fill="url(#pitch-depth-glow)" rx="2" />
      <rect x={FL} y={FT} width={FW} height={FH} fill="none" stroke={t.line} strokeWidth={lineW} rx="2" />
      <line x1={FL} y1={CY} x2={FR} y2={CY} stroke={t.line} strokeWidth={lineW} />

      <circle cx={CX} cy={CY} r={centerRadius} fill="none" stroke={t.line} strokeWidth={lineW} />
      <circle cx={CX} cy={CY} r={3} fill={t.line} />

      <rect
        x={CX - penaltyWidth / 2}
        y={FT}
        width={penaltyWidth}
        height={penaltyDepth}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
      <rect
        x={CX - goalAreaWidth / 2}
        y={FT}
        width={goalAreaWidth}
        height={goalAreaDepth}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
      <circle cx={CX} cy={FT + penaltySpot} r={3} fill={t.line} />
      <path
        d={`M ${CX - arcXOffset} ${topArcY} A ${centerRadius} ${centerRadius} 0 0 1 ${CX + arcXOffset} ${topArcY}`}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
      <rect
        x={CX - goalWidth / 2}
        y={FT - goalFrameDepth}
        width={goalWidth}
        height={goalFrameDepth}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
        strokeDasharray="4 3"
        opacity="0.45"
      />

      <rect
        x={CX - penaltyWidth / 2}
        y={FB - penaltyDepth}
        width={penaltyWidth}
        height={penaltyDepth}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
      <rect
        x={CX - goalAreaWidth / 2}
        y={FB - goalAreaDepth}
        width={goalAreaWidth}
        height={goalAreaDepth}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
      <circle cx={CX} cy={FB - penaltySpot} r={3} fill={t.line} />
      <path
        d={`M ${CX - arcXOffset} ${bottomArcY} A ${centerRadius} ${centerRadius} 0 0 0 ${CX + arcXOffset} ${bottomArcY}`}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
      <rect
        x={CX - goalWidth / 2}
        y={FB}
        width={goalWidth}
        height={goalFrameDepth}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
        strokeDasharray="4 3"
        opacity="0.45"
      />

      <path
        d={`M ${FL} ${FT + cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 1 ${FL + cornerRadius} ${FT}`}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
      <path
        d={`M ${FR - cornerRadius} ${FT} A ${cornerRadius} ${cornerRadius} 0 0 1 ${FR} ${FT + cornerRadius}`}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
      <path
        d={`M ${FL} ${FB - cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 0 ${FL + cornerRadius} ${FB}`}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
      <path
        d={`M ${FR - cornerRadius} ${FB} A ${cornerRadius} ${cornerRadius} 0 0 0 ${FR} ${FB - cornerRadius}`}
        fill="none"
        stroke={t.line}
        strokeWidth={lineW}
      />
    </g>
  );
}
