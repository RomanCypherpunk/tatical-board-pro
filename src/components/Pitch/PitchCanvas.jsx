import { useCallback, useState } from 'react';
import PitchSVG from './PitchSVG';
import PlayerMarker from './PlayerMarker';
import ArrowSVG from './ArrowSVG';
import ShirtPatternDefs from './ShirtPatternDefs';
import ARROW_STYLES from '../../data/arrowStyles';
import { pitchPercentToDisplayPoint } from './geometry';
import {
  canonicalToPercent,
  eventToCanonicalPoint,
  getPitchTransform,
  getPitchViewport,
  isInsidePitch,
} from './geometry';

/**
 * The main pitch area — composes the SVG field, players, arrows, and shirt patterns.
 * Handles arrow drawing, selection, and deletion.
 */
const SWAP_THRESHOLD = 8; // percentage units (~50px in SVG space)

function findSwapTarget(dragX, dragY, dragTeamId, dragPlayerId, teams) {
  const players = teams[dragTeamId]?.players || [];
  let closest = null;
  let closestDist = Infinity;
  players.forEach((p) => {
    if (p.id === dragPlayerId) return;
    const dx = p.x - dragX;
    const dy = p.y - dragY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < SWAP_THRESHOLD && dist < closestDist) {
      closest = { id: p.id, teamId: dragTeamId };
      closestDist = dist;
    }
  });
  return closest;
}

export default function PitchCanvas({ teams, arrows, ui, dispatch, svgRef }) {
  const [swapTarget, setSwapTarget] = useState(null); // { teamId, id } | null
  const pitchOrientation = ui.pitchOrientation || 'horizontal';
  const { width: viewWidth, height: viewHeight, aspectRatio } = getPitchViewport(pitchOrientation);
  const pitchTransform = getPitchTransform(pitchOrientation);
  const arrowPreviewPoint = ui.arrowDrawing
    ? pitchPercentToDisplayPoint(ui.arrowDrawing.fromX, ui.arrowDrawing.fromY, pitchOrientation)
    : null;

  const handlePitchClick = useCallback(
    (e) => {
      // Deselect arrow if clicking on empty pitch
      if (ui.selectedArrow && !ui.arrowMode) {
        dispatch({ type: 'SET_UI', updates: { selectedArrow: null } });
      }

      if (!ui.arrowMode) return;
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = eventToCanonicalPoint(svg, e, pitchOrientation);
      if (!isInsidePitch(x, y)) return;

      const { x: px, y: py } = canonicalToPercent(x, y);

      if (!ui.arrowDrawing) {
        dispatch({ type: 'SET_UI', updates: { arrowDrawing: { fromX: px, fromY: py } } });
      } else {
        dispatch({
          type: 'ADD_ARROW',
          arrow: {
            id: `arrow-${Date.now()}`,
            fromX: ui.arrowDrawing.fromX,
            fromY: ui.arrowDrawing.fromY,
            toX: px,
            toY: py,
            type: ui.arrowMode,
            color: ARROW_STYLES[ui.arrowMode].defaultColor,
            curved: false,
          },
        });
        dispatch({ type: 'SET_UI', updates: { arrowDrawing: null } });
      }
    },
    [ui.arrowMode, ui.arrowDrawing, ui.selectedArrow, dispatch, pitchOrientation, svgRef]
  );

  const selectPlayer = (teamId, playerId) => {
    dispatch({
      type: 'SET_UI',
      updates: { selectedPlayer: { teamId, id: playerId }, selectedTeam: teamId, selectedArrow: null },
    });
  };

  const openEditor = (teamId, playerId) => {
    dispatch({
      type: 'SET_UI',
      updates: {
        selectedPlayer: { teamId, id: playerId },
        selectedTeam: teamId,
        selectedArrow: null,
        showPlayerEditor: true,
      },
    });
  };

  const cursorStyle = ui.arrowMode ? 'crosshair' : 'default';
  const showAway = ui.showAwayTeam;

  return (
    <div
      className="flex-1 flex items-center justify-center overflow-hidden p-3 md:p-4"
      style={{ cursor: cursorStyle }}
    >
      <div
        className="max-h-full max-w-full"
        style={{
          aspectRatio,
          width: pitchOrientation === 'horizontal' ? '100%' : 'auto',
          height: pitchOrientation === 'vertical' ? '100%' : 'auto',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.4))' }}
          onClick={handlePitchClick}
        >
          <ShirtPatternDefs
            teamId="home"
            primaryColor={teams.home.primaryColor}
            secondaryColor={teams.home.secondaryColor}
            pattern={teams.home.pattern}
          />
          {showAway && (
            <ShirtPatternDefs
              teamId="away"
              primaryColor={teams.away.primaryColor}
              secondaryColor={teams.away.secondaryColor}
              pattern={teams.away.pattern}
            />
          )}

          <g transform={pitchTransform}>
            <PitchSVG theme={ui.pitchStyle} />
          </g>

          {/* Tactical arrows */}
          {arrows.map((a) => (
            <ArrowSVG
              key={a.id}
              arrow={a}
              isSelected={ui.selectedArrow === a.id}
              dispatch={dispatch}
              pitchOrientation={pitchOrientation}
            />
          ))}

          {/* Arrow drawing preview dot */}
          {arrowPreviewPoint && (
            <circle
              cx={arrowPreviewPoint.x}
              cy={arrowPreviewPoint.y}
              r={6}
              fill={ARROW_STYLES[ui.arrowMode]?.defaultColor || '#FFD700'}
              opacity="0.8"
            >
              <animate attributeName="r" values="5;8;5" dur="0.8s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Home players */}
          {teams.home.players.map((player) => (
            <PlayerMarker
              key={player.id}
              player={player}
              team={teams.home}
              teamId="home"
              viewMode={ui.viewMode}
              pitchOrientation={pitchOrientation}
              markerSize={ui.markerSize ?? 1}
              isSelected={ui.selectedPlayer?.id === player.id && ui.selectedPlayer?.teamId === 'home'}
              isSwapTarget={swapTarget?.id === player.id && swapTarget?.teamId === 'home'}
              onSelect={() => selectPlayer('home', player.id)}
              onOpenEditor={() => openEditor('home', player.id)}
              onDragMove={(x, y) => setSwapTarget(findSwapTarget(x, y, 'home', player.id, teams))}
              onDragEnd={(x, y) => {
                const target = findSwapTarget(x, y, 'home', player.id, teams);
                setSwapTarget(null);
                if (target) {
                  dispatch({ type: 'SWAP_PLAYERS', teamId: 'home', playerId: player.id, targetId: target.id });
                } else {
                  dispatch({ type: 'MOVE_PLAYER', teamId: 'home', playerId: player.id, x, y });
                }
              }}
            />
          ))}

          {/* Away players */}
          {showAway &&
            teams.away.players.map((player) => (
              <PlayerMarker
                key={player.id}
                player={player}
                team={teams.away}
                teamId="away"
                viewMode={ui.viewMode}
                pitchOrientation={pitchOrientation}
                markerSize={ui.markerSize ?? 1}
                isSelected={ui.selectedPlayer?.id === player.id && ui.selectedPlayer?.teamId === 'away'}
                isSwapTarget={swapTarget?.id === player.id && swapTarget?.teamId === 'away'}
                onSelect={() => selectPlayer('away', player.id)}
                onOpenEditor={() => openEditor('away', player.id)}
                onDragMove={(x, y) => setSwapTarget(findSwapTarget(x, y, 'away', player.id, teams))}
                onDragEnd={(x, y) => {
                  const target = findSwapTarget(x, y, 'away', player.id, teams);
                  setSwapTarget(null);
                  if (target) {
                    dispatch({ type: 'SWAP_PLAYERS', teamId: 'away', playerId: player.id, targetId: target.id });
                  } else {
                    dispatch({ type: 'MOVE_PLAYER', teamId: 'away', playerId: player.id, x, y });
                  }
                }}
              />
            ))}
        </svg>
      </div>
    </div>
  );
}
