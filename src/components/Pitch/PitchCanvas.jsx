import { useCallback } from 'react';
import PitchSVG from './PitchSVG';
import PlayerMarker from './PlayerMarker';
import ArrowSVG from './ArrowSVG';
import ShirtPatternDefs from './ShirtPatternDefs';
import ARROW_STYLES from '../../data/arrowStyles';
import { PITCH_W, PITCH_H, FL, FT, FW, FH } from './constants';

/**
 * The main pitch area — composes the SVG field, players, arrows, and shirt patterns.
 * Handles arrow drawing, selection, and deletion.
 */
export default function PitchCanvas({ teams, arrows, ui, dispatch, svgRef }) {
  const handlePitchClick = useCallback(
    (e) => {
      // Deselect arrow if clicking on empty pitch
      if (ui.selectedArrow && !ui.arrowMode) {
        dispatch({ type: 'SET_UI', updates: { selectedArrow: null } });
      }

      if (!ui.arrowMode) return;
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      const px = ((svgP.x - FL) / FW) * 100;
      const py = ((svgP.y - FT) / FH) * 100;
      if (px < 0 || px > 100 || py < 0 || py > 100) return;

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
    [ui.arrowMode, ui.arrowDrawing, ui.selectedArrow, dispatch, svgRef]
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
      <svg
        ref={svgRef}
        viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-w-full max-h-full"
        style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.4))' }}
        onClick={handlePitchClick}
      >
        <PitchSVG theme={ui.pitchStyle} />

        {/* Shirt pattern definitions */}
        <ShirtPatternDefs teamId="home" primaryColor={teams.home.primaryColor}
          secondaryColor={teams.home.secondaryColor} pattern={teams.home.pattern} />
        {showAway && (
          <ShirtPatternDefs teamId="away" primaryColor={teams.away.primaryColor}
            secondaryColor={teams.away.secondaryColor} pattern={teams.away.pattern} />
        )}

        {/* Tactical arrows */}
        {arrows.map((a) => (
          <ArrowSVG
            key={a.id}
            arrow={a}
            isSelected={ui.selectedArrow === a.id}
            dispatch={dispatch}
          />
        ))}

        {/* Arrow drawing preview dot */}
        {ui.arrowDrawing && (
          <circle
            cx={FL + (ui.arrowDrawing.fromX / 100) * FW}
            cy={FT + (ui.arrowDrawing.fromY / 100) * FH}
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
            isSelected={ui.selectedPlayer?.id === player.id && ui.selectedPlayer?.teamId === 'home'}
            onSelect={() => selectPlayer('home', player.id)}
            onOpenEditor={() => openEditor('home', player.id)}
            onDragEnd={(x, y) =>
              dispatch({ type: 'MOVE_PLAYER', teamId: 'home', playerId: player.id, x, y })
            }
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
              isSelected={ui.selectedPlayer?.id === player.id && ui.selectedPlayer?.teamId === 'away'}
              onSelect={() => selectPlayer('away', player.id)}
              onOpenEditor={() => openEditor('away', player.id)}
              onDragEnd={(x, y) =>
                dispatch({ type: 'MOVE_PLAYER', teamId: 'away', playerId: player.id, x, y })
              }
            />
          ))}
      </svg>
    </div>
  );
}
