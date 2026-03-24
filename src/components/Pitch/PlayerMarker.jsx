import { useState, useRef, useCallback } from 'react';
import { pctToSvg, FL, FT, FW, FH, FR, FB } from './constants';
import { getShirtFill } from './ShirtPatternDefs';
import DIRECTIONS from '../../data/directions';

const R = 18; // marker radius
const DIR_ARROW_LEN = 32; // direction arrow length from center

/**
 * Draggable player circle on the SVG pitch.
 * Uses pointer events for mouse + touch support.
 * Drag state is local to avoid re-rendering the full tree on every pixel move.
 */
export default function PlayerMarker({
  player,
  team,
  teamId,
  viewMode,
  isSelected,
  onSelect,
  onDragEnd,
}) {
  const { sx, sy } = pctToSvg(player.x, player.y);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState(null);
  const svgRef = useRef(null);

  // If player has a color override, use solid fill; otherwise use team pattern
  const hasFillOverride = !!player.colorOverride;
  const fillColor = hasFillOverride
    ? player.colorOverride
    : getShirtFill(teamId, team.pattern, team.primaryColor);
  const textColor = team.numberColor || team.secondaryColor;

  // Determine label based on view mode
  let label = '';
  if (viewMode === 'number') label = String(player.number);
  else if (viewMode === 'name') label = player.name.split(' ').pop().slice(0, 4);
  else label = player.position;

  const cx = dragging && dragPos ? dragPos.x : sx;
  const cy = dragging && dragPos ? dragPos.y : sy;

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      svgRef.current = e.currentTarget.closest('svg');
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      onSelect();
    },
    [onSelect]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging || !svgRef.current) return;
      e.preventDefault();
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      setDragPos({
        x: Math.max(FL + R, Math.min(FR - R, svgP.x)),
        y: Math.max(FT + R, Math.min(FB - R, svgP.y)),
      });
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (dragPos) {
      const px = ((dragPos.x - FL) / FW) * 100;
      const py = ((dragPos.y - FT) / FH) * 100;
      onDragEnd(Math.round(px * 10) / 10, Math.round(py * 10) / 10);
    }
    setDragPos(null);
  }, [dragging, dragPos, onDragEnd]);

  return (
    <g
      className={dragging ? '' : 'player-transition'}
      style={{ cursor: dragging ? 'grabbing' : 'pointer' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      aria-label={`${player.name} - ${player.position}`}
    >
      {/* Drop shadow */}
      <circle cx={cx + 2} cy={cy + 3} r={R} fill="rgba(0,0,0,0.35)" />

      {/* Selection pulse ring */}
      {isSelected && (
        <circle cx={cx} cy={cy} r={R + 6} fill="none" stroke="rgba(59,130,246,0.7)" strokeWidth="2.5">
          <animate attributeName="r" values={`${R + 4};${R + 10};${R + 4}`} dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Main circle with shirt pattern */}
      <circle cx={cx} cy={cy} r={R} fill={fillColor} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

      {/* Key player glow */}
      {player.isKeyPlayer && (
        <circle cx={cx} cy={cy} r={R + 2} fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={viewMode === 'number' ? 12 : 9}
        fontWeight="700"
        fontFamily="Inter, sans-serif"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>

      {/* Captain badge */}
      {player.isCaptain && (
        <g>
          <circle cx={cx + R * 0.7} cy={cy - R * 0.7} r={7} fill="#FFD700" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          <text
            x={cx + R * 0.7}
            y={cy - R * 0.7}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#000"
            fontSize="8"
            fontWeight="900"
            style={{ pointerEvents: 'none' }}
          >
            C
          </text>
        </g>
      )}

      {/* Player name below marker */}
      <text
        x={cx}
        y={cy + R + 10}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={8}
        fontWeight="700"
        fontFamily="Inter, sans-serif"
        fill="white"
        stroke="rgba(0,0,0,0.75)"
        strokeWidth={2.5}
        paintOrder="stroke"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {player.name.split(' ').pop().slice(0, 8)}
      </text>

      {/* Direction arrow */}
      {player.direction && (() => {
        const dir = DIRECTIONS.find((d) => d.key === player.direction);
        if (!dir) return null;
        const startX = cx + dir.dx * (R + 4);
        const startY = cy + dir.dy * (R + 4);
        const endX = cx + dir.dx * (R + DIR_ARROW_LEN);
        const endY = cy + dir.dy * (R + DIR_ARROW_LEN);
        const markerId = `dir-${player.id}`;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <defs>
              <marker id={markerId} viewBox="0 0 10 7" refX="10" refY="3.5"
                markerWidth="7" markerHeight="5" orient="auto-start-reverse">
                <polygon points="0,0 10,3.5 0,7" fill={fillColor} />
              </marker>
            </defs>
            <line
              x1={startX} y1={startY} x2={endX} y2={endY}
              stroke={fillColor} strokeWidth="2.5" opacity="0.85"
              markerEnd={`url(#${markerId})`}
            />
          </g>
        );
      })()}
    </g>
  );
}
