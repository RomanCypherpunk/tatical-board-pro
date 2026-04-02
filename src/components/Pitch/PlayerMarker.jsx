import { useCallback, useEffect, useRef, useState } from 'react';
import { pctToSvg } from './constants';
import {
  canonicalToDisplayPoint,
  canonicalToPercent,
  clampToPitch,
  eventToCanonicalPoint,
  getDisplayPitchBounds,
  vectorToDisplay,
} from './geometry';
import DIRECTIONS from '../../data/directions';
import { buildFotmobPlayerPhotoUrl } from '../../utils/fotmob';

const REFERENCE_RADIUS = 24;
const MARKER_RADIUS = 32;
const BASE_DIRECTION_ARROW_LENGTH = 38;

function InlinePatternDefs({ patternKey, primaryColor, secondaryColor, cx, cy, id, radius }) {
  if (!patternKey || patternKey === 'solid') return null;

  const boxX = cx - radius;
  const boxY = cy - radius;
  const size = radius * 2;

  let content;

  switch (patternKey) {
    case 'cheques':
      content = (
        <>
          <rect width={size} height={size} fill={primaryColor} />
          <rect width={size / 2} height={size / 2} fill={secondaryColor} />
          <rect x={size / 2} y={size / 2} width={size / 2} height={size / 2} fill={secondaryColor} />
        </>
      );
      break;
    case 'half_half_h':
      content = (
        <>
          <rect width={size} height={size / 2} fill={primaryColor} />
          <rect y={size / 2} width={size} height={size / 2} fill={secondaryColor} />
        </>
      );
      break;
    case 'half_half_v':
      content = (
        <>
          <rect width={size / 2} height={size} fill={primaryColor} />
          <rect x={size / 2} width={size / 2} height={size} fill={secondaryColor} />
        </>
      );
      break;
    case 'stripes_v':
      content = (
        <>
          <rect width={size} height={size} fill={primaryColor} />
          {[1, 3, 5].map((index) => (
            <rect
              key={index}
              x={index * (size / 6)}
              width={size / 6}
              height={size}
              fill={secondaryColor}
            />
          ))}
        </>
      );
      break;
    case 'stripes_h':
      content = (
        <>
          <rect width={size} height={size} fill={primaryColor} />
          {[1, 3, 5].map((index) => (
            <rect
              key={index}
              y={index * (size / 6)}
              width={size}
              height={size / 6}
              fill={secondaryColor}
            />
          ))}
        </>
      );
      break;
    case 'stripes_thin':
      content = (
        <>
          <rect width={size} height={size} fill={primaryColor} />
          {[1, 3, 5, 7].map((index) => (
            <rect
              key={index}
              x={index * (size / 8)}
              width={size / 16}
              height={size}
              fill={secondaryColor}
            />
          ))}
        </>
      );
      break;
    case 'stripe_diagonal':
      content = (
        <>
          <rect width={size} height={size} fill={primaryColor} />
          <polygon points={`0,0 ${size * 0.55},0 0,${size * 0.55}`} fill={secondaryColor} />
          <polygon
            points={`${size},${size} ${size * 0.45},${size} ${size},${size * 0.45}`}
            fill={secondaryColor}
          />
        </>
      );
      break;
    case 'stripe_h':
      content = (
        <>
          <rect width={size} height={size} fill={primaryColor} />
          <rect y={size * 0.35} width={size} height={size * 0.3} fill={secondaryColor} />
        </>
      );
      break;
    case 'stripe_v':
      content = (
        <>
          <rect width={size} height={size} fill={primaryColor} />
          <rect x={size * 0.35} width={size * 0.3} height={size} fill={secondaryColor} />
        </>
      );
      break;
    case 'stripe_cut':
      content = (
        <>
          <rect width={size} height={size} fill={secondaryColor} />
          <polygon points={`0,0 ${size},0 0,${size}`} fill={primaryColor} />
        </>
      );
      break;
    case 'stripe_thick':
      content = (
        <>
          <rect width={size} height={size} fill={primaryColor} />
          <rect width={size / 3} height={size} fill={secondaryColor} />
          <rect x={(size * 2) / 3} width={size / 3} height={size} fill={secondaryColor} />
        </>
      );
      break;
    case 'quarters':
      content = (
        <>
          <rect width={size / 2} height={size / 2} fill={primaryColor} />
          <rect x={size / 2} width={size / 2} height={size / 2} fill={secondaryColor} />
          <rect y={size / 2} width={size / 2} height={size / 2} fill={secondaryColor} />
          <rect x={size / 2} y={size / 2} width={size / 2} height={size / 2} fill={primaryColor} />
        </>
      );
      break;
    case 'vshape':
      content = (
        <>
          <rect width={size} height={size} fill={primaryColor} />
          <polygon
            points={`0,0 ${size / 2},${size * 0.6} ${size},0 ${size},${size * 0.35} ${size / 2},${size * 0.95} 0,${size * 0.35}`}
            fill={secondaryColor}
          />
        </>
      );
      break;
    default:
      return null;
  }

  return (
    <defs>
      <pattern id={id} x={boxX} y={boxY} width={size} height={size} patternUnits="userSpaceOnUse">
        {content}
      </pattern>
    </defs>
  );
}

function getPlayerInitials(name) {
  const tokens = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return '?';
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();

  return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
}

function getInfoBadgeText(value) {
  return String(value || '').trim().toUpperCase();
}

export default function PlayerMarker({
  player,
  team,
  teamId,
  viewMode,
  pitchOrientation,
  isSelected,
  isSwapTarget,
  onSelect,
  onDragMove,
  onDragEnd,
  onOpenEditor,
}) {
  const { sx, sy } = pctToSvg(player.x, player.y);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    setPhotoFailed(false);
  }, [player.fotmobId, viewMode]);

  const currentCanonicalX = dragging && dragPos ? dragPos.x : sx;
  const currentCanonicalY = dragging && dragPos ? dragPos.y : sy;
  const { x: cx, y: cy } = canonicalToDisplayPoint(
    currentCanonicalX,
    currentCanonicalY,
    pitchOrientation
  );
  const pitchBounds = getDisplayPitchBounds(pitchOrientation);
  const markerRadius = MARKER_RADIUS;
  const scaleFactor = markerRadius / REFERENCE_RADIUS;
  const directionArrowLength = BASE_DIRECTION_ARROW_LENGTH * scaleFactor;

  const patternId = `pattern-${teamId}-${player.id}`;
  const photoClipId = `photo-clip-${teamId}-${player.id}`;
  const hasPattern = team.pattern && team.pattern !== 'solid';
  const fillColor = player.colorOverride
    ? player.colorOverride
    : hasPattern
      ? `url(#${patternId})`
      : team.primaryColor;
  const textColor = team.numberColor || team.secondaryColor;
  const photoUrl =
    viewMode === 'photo' && !photoFailed ? buildFotmobPlayerPhotoUrl(player.fotmobId) : null;
  const showPhoto = Boolean(photoUrl);

  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      svgRef.current = event.currentTarget.closest('svg');
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      onSelect();
    },
    [onSelect]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!dragging || !svgRef.current) return;

      event.preventDefault();
      const svg = svgRef.current;
      const { x, y } = eventToCanonicalPoint(svg, event, pitchOrientation);
      const nextPoint = clampToPitch(x, y, markerRadius);

      setDragPos({ x: nextPoint.x, y: nextPoint.y });

      if (onDragMove) {
        const { x: px, y: py } = canonicalToPercent(nextPoint.x, nextPoint.y);
        onDragMove(px, py);
      }
    },
    [dragging, markerRadius, pitchOrientation, onDragMove]
  );

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;

    setDragging(false);

    if (dragPos) {
      const { x: percentX, y: percentY } = canonicalToPercent(dragPos.x, dragPos.y);
      onDragEnd(Math.round(percentX * 10) / 10, Math.round(percentY * 10) / 10);
    }

    setDragPos(null);
  }, [dragging, dragPos, onDragEnd]);

  let markerText = String(player.number);
  let markerFontSize = 17 * scaleFactor;
  let markerWeight = 800;
  let infoBadgeText = '';

  if (viewMode === 'name') {
    infoBadgeText = getInfoBadgeText(player.name);
  } else if (viewMode === 'position') {
    infoBadgeText = getInfoBadgeText(player.position);
  } else if (viewMode === 'photo' && !showPhoto) {
    markerText = getPlayerInitials(player.name);
    markerFontSize = 14 * scaleFactor;
    markerWeight = 700;
  }

  const showInfoBadge = Boolean(infoBadgeText);
  const charWidth = 6.6 * scaleFactor;
  const badgePadding = 8 * scaleFactor;
  const badgeWidth = Math.max(infoBadgeText.length * charWidth + badgePadding * 2, markerRadius * 2.5);
  const badgeHeight = 18 * scaleFactor;
  const defaultBadgeY = cy + markerRadius + 14 * scaleFactor;
  const badgeY =
    defaultBadgeY + badgeHeight / 2 > pitchBounds.bottom - 5
      ? cy - markerRadius - 14 * scaleFactor
      : defaultBadgeY;
  const badgeX = Math.max(
    pitchBounds.left + badgeWidth / 2 + 4,
    Math.min(pitchBounds.right - badgeWidth / 2 - 4, cx)
  );

  return (
    <g
      className={dragging ? '' : 'player-transition'}
      style={{ cursor: dragging ? 'grabbing' : 'pointer' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onOpenEditor?.();
      }}
      aria-label={`${player.name} - ${player.position}`}
    >
      <defs>
        <filter id={`shadow-${teamId}-${player.id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1" dy="2" stdDeviation="3.5" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      {!player.colorOverride && !showPhoto && (
        <InlinePatternDefs
          patternKey={team.pattern}
          primaryColor={team.primaryColor}
          secondaryColor={team.secondaryColor}
          cx={cx}
          cy={cy}
          id={patternId}
          radius={markerRadius}
        />
      )}

      {showPhoto && (
        <defs>
          <clipPath id={photoClipId}>
            <circle cx={cx} cy={cy} r={markerRadius} />
          </clipPath>
        </defs>
      )}

      {isSelected && (
        <circle cx={cx} cy={cy} r={markerRadius + 6} fill="none" stroke="rgba(20,201,107,0.72)" strokeWidth="2.5">
          <animate attributeName="r" values={`${markerRadius + 4};${markerRadius + 10};${markerRadius + 4}`} dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}

      {isSwapTarget && (
        <circle
          cx={cx}
          cy={cy}
          r={markerRadius + 8}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2.5"
          strokeDasharray="7 5"
          style={{ pointerEvents: 'none' }}
        >
          <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      <circle cx={cx} cy={cy} r={markerRadius} fill={showPhoto ? '#08120D' : fillColor} stroke="rgba(255,255,255,0.3)" strokeWidth="2" filter={`url(#shadow-${teamId}-${player.id})`} />

      {showPhoto && (
        <image
          href={photoUrl}
          xlinkHref={photoUrl}
          x={cx - markerRadius}
          y={cy - markerRadius}
          width={markerRadius * 2}
          height={markerRadius * 2}
          clipPath={`url(#${photoClipId})`}
          preserveAspectRatio="xMidYMid slice"
          imageRendering="auto"
          onError={() => setPhotoFailed(true)}
        />
      )}

      {player.isKeyPlayer && (
        <circle cx={cx} cy={cy} r={markerRadius + 2} fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {!showPhoto && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColor}
          fontSize={markerFontSize}
          fontWeight={markerWeight}
          fontFamily="Sora, sans-serif"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {markerText}
        </text>
      )}

      {showPhoto && (
        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={cx + markerRadius * 0.82}
            cy={cy + markerRadius * 0.76}
            r={markerRadius * 0.375}
            fill={team.primaryColor}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="1"
          />
          <text
            x={cx + markerRadius * 0.8}
            y={cy + markerRadius * 0.75}
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize={markerRadius * 0.42}
            fontWeight="800"
            fontFamily="Sora, sans-serif"
          >
            {player.number}
          </text>
        </g>
      )}

      {player.isCaptain && (
        <g>
          <circle
            cx={cx + markerRadius * 0.72}
            cy={cy - markerRadius * 0.72}
            r={markerRadius / 3}
            fill="#FFD700"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="1.2"
          />
          <text
            x={cx + markerRadius * 0.72}
            y={cy - markerRadius * 0.72}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#000"
            fontSize={markerRadius * 0.38}
            fontWeight="900"
            fontFamily="Sora, sans-serif"
            style={{ pointerEvents: 'none' }}
          >
            C
          </text>
        </g>
      )}

      {showInfoBadge && (
        <g style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <rect
            x={badgeX - badgeWidth / 2}
            y={badgeY - badgeHeight / 2}
            width={badgeWidth}
            height={badgeHeight}
            rx={6}
            fill={team.primaryColor}
            opacity={0.94}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="0.5"
          />
          <text
            x={badgeX}
            y={badgeY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10.5 * scaleFactor}
            fontWeight="700"
            fontFamily="Sora, sans-serif"
            fill={textColor}
            letterSpacing="0.3"
          >
            {infoBadgeText}
          </text>
        </g>
      )}

      {player.direction &&
        (() => {
          const direction = DIRECTIONS.find((item) => item.key === player.direction);
          if (!direction) return null;

          const displayVector = vectorToDisplay(direction.dx, direction.dy, pitchOrientation);
          const startX = cx + displayVector.dx * (markerRadius + 4);
          const startY = cy + displayVector.dy * (markerRadius + 4);
          const endX = cx + displayVector.dx * (markerRadius + directionArrowLength);
          const endY = cy + displayVector.dy * (markerRadius + directionArrowLength);
          const markerId = `dir-${player.id}`;

          return (
            <g style={{ pointerEvents: 'none' }}>
              <defs>
                <marker
                  id={markerId}
                  viewBox="0 0 10 7"
                  refX="10"
                  refY="3.5"
                  markerWidth="7"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <polygon points="0,0 10,3.5 0,7" fill={team.primaryColor} />
                </marker>
              </defs>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={team.primaryColor}
                strokeWidth={2.5 * scaleFactor}
                opacity="0.85"
                markerEnd={`url(#${markerId})`}
              />
            </g>
          );
        })()}
    </g>
  );
}
