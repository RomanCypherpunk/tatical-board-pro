import { useReducer, useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Minimize2, Circle } from 'lucide-react';

import reducer from './state/reducer';
import initialState from './state/initialState';

import Header from './components/Header';
import PitchCanvas from './components/Pitch/PitchCanvas';
import TeamPanel from './components/Panels/TeamPanel';
import PlayerEditorModal from './components/Panels/PlayerEditorModal';
import LiveTeamSearch from './components/Panels/LiveTeamSearch';
import BottomToolbar from './components/Toolbar/BottomToolbar';
import { exportPitchRaster } from './utils/exportPitch';

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const appRef = useRef(null);
  const svgRef = useRef(null);
  const { teams, arrows, ui } = state;

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tactical-board-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.teams) dispatch({ type: 'LOAD_STATE', state: parsed });
      }
    } catch {
      /* ignore corrupt data */
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem('tactical-board-state', JSON.stringify(state));
    } catch {
      /* storage full */
    }
  }, [isHydrated, state]);

  const handleExport = useCallback(async () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    await exportPitchRaster(svgEl, 'png');
  }, []);

  const handleTogglePitchFullscreen = useCallback(async () => {
    if (ui.pitchFullscreen) {
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch {
          /* ignore fullscreen exit failure */
        }
      }

      dispatch({ type: 'SET_UI', updates: { pitchFullscreen: false } });
      return;
    }

    dispatch({
      type: 'SET_UI',
      updates: {
        pitchFullscreen: true,
        showPlayerEditor: false,
        showLiveSearch: null,
      },
    });

    if (appRef.current?.requestFullscreen) {
      try {
        await appRef.current.requestFullscreen();
      } catch {
        /* fallback to in-app fullscreen */
      }
    }
  }, [dispatch, ui.pitchFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && ui.pitchFullscreen) {
        dispatch({ type: 'SET_UI', updates: { pitchFullscreen: false } });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [dispatch, ui.pitchFullscreen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        dispatch({
          type: 'SET_UI',
          updates: {
            arrowDrawing: null,
            arrowMode: null,
            eraserMode: false,
            selectedArrow: null,
            showPlayerEditor: false,
            showLiveSearch: null,
            pitchFullscreen: false,
          },
        });
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && ui.selectedArrow) {
        e.preventDefault();
        dispatch({ type: 'REMOVE_ARROW', id: ui.selectedArrow });
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [ui.selectedArrow]);

  const selectedPlayerObj = useMemo(() => {
    if (!ui.selectedPlayer) return null;
    const team = teams[ui.selectedPlayer.teamId];
    return team?.players.find((player) => player.id === ui.selectedPlayer.id) || null;
  }, [ui.selectedPlayer, teams]);

  return (
    <div
      ref={appRef}
      className="app-shell flex h-screen w-screen flex-col overflow-hidden bg-surface-primary font-body"
    >
      {!ui.pitchFullscreen && <Header onExport={handleExport} />}

      <div className="flex flex-1 overflow-hidden">
        {!ui.pitchFullscreen && ui.showLeftPanel && (
          <div className="glass animate-slide-in-left z-10 flex w-64 flex-shrink-0 flex-col overflow-hidden border-r border-white/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: teams.home.primaryColor, boxShadow: `0 0 6px ${teams.home.primaryColor}44` }} />
                <span className="text-txt-primary">{teams.home.name}</span>
              </span>
              <button
                onClick={() => dispatch({ type: 'SET_UI', updates: { showLeftPanel: false } })}
                className="cursor-pointer rounded-lg p-1 text-txt-secondary transition-all duration-200 hover:bg-white/[0.08] hover:text-txt-primary"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
            <TeamPanel
              team={teams.home}
              teamId="home"
              dispatch={dispatch}
              selectedPlayer={ui.selectedPlayer}
            />
          </div>
        )}

        <div className="relative flex flex-1 flex-col overflow-hidden">
          {!ui.pitchFullscreen && !ui.showLeftPanel && (
            <div className="absolute left-1.5 top-1/2 z-20 -translate-y-1/2">
              <button
                onClick={() => dispatch({ type: 'SET_UI', updates: { showLeftPanel: true } })}
                className="glass cursor-pointer rounded-xl p-2 text-txt-secondary shadow-lg transition-all duration-200 hover:bg-white/[0.08] hover:text-txt-primary"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {!ui.pitchFullscreen && !ui.showRightPanel && ui.showAwayTeam && (
            <div className="absolute right-1.5 top-1/2 z-20 -translate-y-1/2">
              <button
                onClick={() => dispatch({ type: 'SET_UI', updates: { showRightPanel: true } })}
                className="glass cursor-pointer rounded-xl p-2 text-txt-secondary shadow-lg transition-all duration-200 hover:bg-white/[0.08] hover:text-txt-primary"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          )}

          {!ui.pitchFullscreen && (
            <div className="absolute top-2 left-1/2 z-20 -translate-x-1/2">
              <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5 shadow-lg">
                <Circle size={9} className="flex-shrink-0 text-txt-secondary" />
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={ui.markerSize ?? 1}
                  onChange={(e) =>
                    dispatch({ type: 'SET_UI', updates: { markerSize: Number(e.target.value) } })
                  }
                  className="h-1 w-24 cursor-pointer accent-accent"
                  title="Tamanho das bolinhas"
                />
                <Circle size={15} className="flex-shrink-0 text-txt-secondary" />
              </div>
            </div>
          )}

          <PitchCanvas teams={teams} arrows={arrows} ui={ui} dispatch={dispatch} svgRef={svgRef} />

          {ui.pitchFullscreen && (
            <div className="pointer-events-none absolute right-4 top-4 z-30">
              <button
                onClick={handleTogglePitchFullscreen}
                className="pointer-events-auto glass flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-txt-primary shadow-lg transition-all duration-200 hover:bg-white/[0.08]"
              >
                <Minimize2 size={14} />
                Sair da tela cheia
              </button>
            </div>
          )}

          {!ui.pitchFullscreen && (
            <BottomToolbar
              ui={ui}
              dispatch={dispatch}
              onTogglePitchFullscreen={handleTogglePitchFullscreen}
            />
          )}
        </div>

        {!ui.pitchFullscreen && ui.showAwayTeam && ui.showRightPanel && (
          <div className="glass animate-slide-in-right z-10 flex w-64 flex-shrink-0 flex-col overflow-hidden border-l border-white/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <button
                onClick={() => dispatch({ type: 'SET_UI', updates: { showRightPanel: false } })}
                className="cursor-pointer rounded-lg p-1 text-txt-secondary transition-all duration-200 hover:bg-white/[0.08] hover:text-txt-primary"
              >
                <ChevronRight size={14} />
              </button>
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider">
                <span className="text-txt-primary">{teams.away.name}</span>
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: teams.away.primaryColor, boxShadow: `0 0 6px ${teams.away.primaryColor}44` }} />
              </span>
            </div>
            <TeamPanel
              team={teams.away}
              teamId="away"
              dispatch={dispatch}
              selectedPlayer={ui.selectedPlayer}
            />
          </div>
        )}
      </div>

      {ui.showPlayerEditor && selectedPlayerObj && (
        <PlayerEditorModal
          player={selectedPlayerObj}
          team={teams[ui.selectedPlayer.teamId]}
          teamId={ui.selectedPlayer.teamId}
          dispatch={dispatch}
          onClose={() => dispatch({ type: 'SET_UI', updates: { showPlayerEditor: false } })}
        />
      )}

      {ui.showLiveSearch && (
        <LiveTeamSearch
          teamId={ui.showLiveSearch}
          dispatch={dispatch}
          onClose={() => dispatch({ type: 'SET_UI', updates: { showLiveSearch: null } })}
        />
      )}
    </div>
  );
}
