import { useReducer, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import reducer from './state/reducer';
import initialState from './state/initialState';

import Header from './components/Header';
import PitchCanvas from './components/Pitch/PitchCanvas';
import TeamPanel from './components/Panels/TeamPanel';
import PlayerEditorModal from './components/Panels/PlayerEditorModal';
import LiveTeamSearch from './components/Panels/LiveTeamSearch';
import BottomToolbar from './components/Toolbar/BottomToolbar';

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  const svgRef = useRef(null);
  const { teams, arrows, ui } = state;

  // ── Persistence ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tactical-board-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.teams) dispatch({ type: 'LOAD_STATE', state: parsed });
      }
    } catch {
      /* ignore corrupt data */
    }
  }, []);

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem('tactical-board-state', JSON.stringify(state));
    } catch {
      /* storage full */
    }
  }, [state]);

  const handleExport = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tatica.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_UI', updates: { arrowDrawing: null, arrowMode: null, eraserMode: false, selectedArrow: null, showPlayerEditor: false, showLiveSearch: null } });
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && ui.selectedArrow) {
        e.preventDefault();
        dispatch({ type: 'REMOVE_ARROW', id: ui.selectedArrow });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [ui.selectedArrow]);

  // ── Selected player object ──
  const selectedPlayerObj = useMemo(() => {
    if (!ui.selectedPlayer) return null;
    const t = teams[ui.selectedPlayer.teamId];
    return t?.players.find((p) => p.id === ui.selectedPlayer.id) || null;
  }, [ui.selectedPlayer, teams]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface-primary font-body">
      <Header onSave={handleSave} onExport={handleExport} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ── */}
        {ui.showLeftPanel && (
          <div className="glass w-64 flex-shrink-0 flex flex-col overflow-hidden z-10 animate-fade-in border-r border-white/[0.08]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
              <span className="text-xs font-bold tracking-wider">
                <span style={{ color: teams.home.primaryColor }}>●</span>{' '}
                <span className="text-txt-primary">{teams.home.name}</span>
              </span>
              <button
                onClick={() => dispatch({ type: 'SET_UI', updates: { showLeftPanel: false } })}
                className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer text-txt-secondary"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
            <TeamPanel team={teams.home} teamId="home" dispatch={dispatch} selectedPlayer={ui.selectedPlayer} />
          </div>
        )}

        {/* ── PITCH AREA ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Collapsed panel toggles */}
          {!ui.showLeftPanel && (
            <div className="absolute top-1/2 -translate-y-1/2 left-1 z-20">
              <button
                onClick={() => dispatch({ type: 'SET_UI', updates: { showLeftPanel: true } })}
                className="glass rounded-lg p-1.5 cursor-pointer hover:bg-white/10 transition-colors text-txt-secondary"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          {!ui.showRightPanel && ui.showAwayTeam && (
            <div className="absolute top-1/2 -translate-y-1/2 right-1 z-20">
              <button
                onClick={() => dispatch({ type: 'SET_UI', updates: { showRightPanel: true } })}
                className="glass rounded-lg p-1.5 cursor-pointer hover:bg-white/10 transition-colors text-txt-secondary"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          )}

          <PitchCanvas teams={teams} arrows={arrows} ui={ui} dispatch={dispatch} svgRef={svgRef} />
          <BottomToolbar ui={ui} dispatch={dispatch} />
        </div>

        {/* ── RIGHT PANEL ── */}
        {ui.showAwayTeam && ui.showRightPanel && (
          <div className="glass w-64 flex-shrink-0 flex flex-col overflow-hidden z-10 animate-fade-in border-l border-white/[0.08]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
              <button
                onClick={() => dispatch({ type: 'SET_UI', updates: { showRightPanel: false } })}
                className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer text-txt-secondary"
              >
                <ChevronRight size={14} />
              </button>
              <span className="text-xs font-bold tracking-wider">
                <span className="text-txt-primary">{teams.away.name}</span>{' '}
                <span style={{ color: teams.away.primaryColor }}>●</span>
              </span>
            </div>
            <TeamPanel team={teams.away} teamId="away" dispatch={dispatch} selectedPlayer={ui.selectedPlayer} />
          </div>
        )}
      </div>

      {/* ── Player Editor Modal ── */}
      {ui.showPlayerEditor && selectedPlayerObj && (
        <PlayerEditorModal
          player={selectedPlayerObj}
          team={teams[ui.selectedPlayer.teamId]}
          teamId={ui.selectedPlayer.teamId}
          dispatch={dispatch}
          onClose={() => dispatch({ type: 'SET_UI', updates: { showPlayerEditor: false } })}
        />
      )}

      {/* ── Live Team Search Modal ── */}
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
