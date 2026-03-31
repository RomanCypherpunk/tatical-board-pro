import { useCallback, useEffect, useRef, useState } from 'react';
import { FB, FH, FL, FR, FT, FW, pctToSvg } from './constants';
import DIRECTIONS from '../../data/directions';
import { buildFotmobPlayerPhotoUrl } from '../../utils/fotmob';

const RADIUS = 18;
const DIRECTION_ARROW_LENGTH = 30;

function InlinePatternDefs({ patternKey, primaryColor, secondaryColor, cx, cy, id }) {
  if (!patternKey || patternKey === 'solid') return null;

  const boxX = cx - RADIUS;
  const boxY = cy - RADIUS;
  const size = RADIUS * 2;

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

function getNameBadgeText(name) {
  return String(name || '').trim().toUpperCase();
}

export default function PlayerMarker({
  player,
  team,
  teamId,
  viewMode,
  isSelected,
  onSelect,
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

  const cx = dragging && dragPos ? dragPos.x : sx;
  const cy = dragging && dragPos ? dragPos.y : sy;

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
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());

      setDragPos({
        x: Math.max(FL + RADIUS, Math.min(FR - RADIUS, svgPoint.x)),
        y: Math.max(FT + RADIUS, Math.min(FB - RADIUS, svgPoint.y)),
      });
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;

    setDragging(false);

    if (dragPos) {
      const percentX = ((dragPos.x - FL) / FW) * 100;
      const percentY = ((dragPos.y - FT) / FH) * 100;
      onDragEnd(Math.round(percentX * 10) / 10, Math.round(percentY * 10) / 10);
    }

    setDragPos(null);
  }, [dragging, dragPos, onDragEnd]);

  let markerText = String(player.number);
  let markerFontSize = 14;
  let markerWeight = 800;
  let showNameBadge = false;

  if (viewMode === 'name') {
    markerText = getPlayerInitials(player.name);
    markerFontSize = 11.5;
    markerWeight = 700;
    showNameBadge = true;
  } else if (viewMode === 'position') {
    markerText = player.position;
    markerFontSize = player.position.length >= 3 ? 10.5 : 12.5;
    markerWeight = 800;
  } else if (viewMode === 'photo' && !showPhoto) {
    markerText = getPlayerInitials(player.name);
    markerFontSize = 11.5;
    markerWeight = 700;
  }

  const nameBadgeText = getNameBadgeText(player.name);
  const charWidth = 5.8;
  const badgePadding = 7;
  const badgeWidth = nameBadgeText.length * charWidth + badgePadding * 2;
  const badgeHeight = 15;
  const defaultBadgeY = cy + RADIUS + 12;
  const badgeY =
    defaultBadgeY + badgeHeight / 2 > FB - 5 ? cy - RADIUS - 12 : defaultBadgeY;

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
      {!player.colorOverride && !showPhoto && (
        <InlinePatternDefs
          patternKey={team.pattern}
          primaryColor={team.primaryColor}
          secondaryColor={team.secondaryColor}
          cx={cx}
          cy={cy}
          id={patternId}
        />
      )}

      {showPhoto && (
        <defs>
          <clipPath id={photoClipId}>
            <circle cx={cx} cy={cy} r={RADIUS} />
          </clipPath>
        </defs>
      )}

      <circle cx={cx + 2} cy={cy + 3} r={RADIUS} fill="rgba(0,0,0,0.35)" />

      {isSelected && (
        <circle cx={cx} cy={cy} r={RADIUS + 6} fill="none" stroke="rgba(20,201,107,0.72)" strokeWidth="2.5">
          <animate attributeName="r" values={`${RADIUS + 4};${RADIUS + 10};${RADIUS + 4}`} dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}

      <circle cx={cx} cy={cy} r={RADIUS} fill={showPhoto ? '#08120D' : fillColor} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

      {showPhoto && (
        <image
          href={photoUrl}
          x={cx - RADIUS}
          y={cy - RADIUS}
          width={RADIUS * 2}
          height={RADIUS * 2}
          clipPath={`url(#${photoClipId})`}
          preserveAspectRatio="xMidYMid slice"
          onError={() => setPhotoFailed(true)}
        />
      )}

      {player.isKeyPlayer && (
        <circle cx={cx} cy={cy} r={RADIUS + 2} fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.7">
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
            cx={cx + RADIUS * 0.8}
            cy={cy + RADIUS * 0.75}
            r={7.5}
            fill={team.primaryColor}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="1"
          />
          <text
            x={cx + RADIUS * 0.8}
            y={cy + RADIUS * 0.75}
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize="8"
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
            cx={cx + RADIUS * 0.72}
            cy={cy - RADIUS * 0.72}
            r={7}
            fill="#FFD700"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1"
          />
          <text
            x={cx + RADIUS * 0.72}
            y={cy - RADIUS * 0.72}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#000"
            fontSize="8"
            fontWeight="900"
            fontFamily="Sora, sans-serif"
            style={{ pointerEvents: 'none' }}
          >
            C
          </text>
        </g>
      )}

      {showNameBadge && (
        <g style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <rect
            x={cx - badgeWidth / 2}
            y={badgeY - badgeHeight / 2}
            width={badgeWidth}
            height={badgeHeight}
            rx={4}
            fill={team.primaryColor}
            opacity={0.94}
          />
          <text
            x={cx}
            y={badgeY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fontWeight="700"
            fontFamily="Sora, sans-serif"
            fill={textColor}
            letterSpacing="0.3"
          >
            {nameBadgeText}
          </text>
        </g>
      )}

      {player.direction &&
        (() => {
          const direction = DIRECTIONS.find((item) => item.key === player.direction);
          if (!direction) return null;

          const startX = cx + direction.dx * (RADIUS + 4);
          const startY = cy + direction.dy * (RADIUS + 4);
          const endX = cx + direction.dx * (RADIUS + DIRECTION_ARROW_LENGTH);
          const endY = cy + direction.dy * (RADIUS + DIRECTION_ARROW_LENGTH);
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
                strokeWidth="2.5"
                opacity="0.85"
                markerEnd={`url(#${markerId})`}
              />
            </g>
          );
        })()}
    </g>
  );
}
