import {
  Hash,
  Type,
  MapPin,
  ArrowRight,
  Trash2,
  FlipHorizontal,
  RotateCcw,
  MousePointer,
  Eraser,
  Users,
} from 'lucide-react';
import PITCH_THEMES from '../../data/pitchThemes';
import ARROW_STYLES from '../../data/arrowStyles';

const VIEW_MODES = [
  { mode: 'number', Icon: Hash, label: 'Nº' },
  { mode: 'name', Icon: Type, label: 'Nome' },
  { mode: 'position', Icon: MapPin, label: 'Pos' },
];

const THEME_KEYS = Object.keys(PITCH_THEMES);

const ARROW_TYPES = Object.entries(ARROW_STYLES).map(([type, style]) => ({
  type,
  label: style.label,
  color: style.defaultColor,
}));

/**
 * Bottom toolbar with view mode, pitch theme, arrow tools, and action buttons.
 */
export default function BottomToolbar({ ui, dispatch }) {
  const setUI = (updates) => dispatch({ type: 'SET_UI', updates });

  return (
    <div className="glass flex-shrink-0 px-3 py-2 flex items-center gap-2 flex-wrap justify-center z-10 border-t border-white/[0.08]">
      {/* ── View Mode ── */}
      <div className="flex items-center gap-0.5 rounded-lg p-0.5 bg-white/5">
        {VIEW_MODES.map(({ mode, Icon, label }) => (
          <button
            key={mode}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-all duration-200 cursor-pointer"
            style={{
              background: ui.viewMode === mode ? 'var(--color-accent)' : 'transparent',
              color: ui.viewMode === mode ? '#fff' : 'var(--color-txt-secondary)',
            }}
            onClick={() => setUI({ viewMode: mode })}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <Divider />

      {/* ── Pitch Theme ── */}
      <div className="flex items-center gap-1">
        {THEME_KEYS.map((key) => (
          <button
            key={key}
            className="w-6 h-6 rounded-full border-2 transition-all duration-200 cursor-pointer"
            title={PITCH_THEMES[key].label}
            style={{
              background: PITCH_THEMES[key].field,
              borderColor: ui.pitchStyle === key ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
              transform: ui.pitchStyle === key ? 'scale(1.2)' : 'scale(1)',
            }}
            onClick={() => setUI({ pitchStyle: key })}
          />
        ))}
      </div>

      <Divider />

      {/* ── Arrow Tools ── */}
      <div className="flex items-center gap-0.5 rounded-lg p-0.5 bg-white/5">
        {/* Pointer (default) */}
        <button
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-all duration-200 cursor-pointer"
          style={{
            background: !ui.arrowMode && !ui.eraserMode ? 'var(--color-accent)' : 'transparent',
            color: !ui.arrowMode && !ui.eraserMode ? '#fff' : 'var(--color-txt-secondary)',
          }}
          onClick={() => setUI({ arrowMode: null, eraserMode: false, arrowDrawing: null })}
        >
          <MousePointer size={13} />
        </button>

        {/* Arrow type buttons */}
        {ARROW_TYPES.map(({ type, label, color }) => (
          <button
            key={type}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-all duration-200 cursor-pointer"
            title={label}
            style={{
              background: ui.arrowMode === type ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: ui.arrowMode === type ? color : 'var(--color-txt-secondary)',
            }}
            onClick={() =>
              setUI({
                arrowMode: ui.arrowMode === type ? null : type,
                eraserMode: false,
                arrowDrawing: null,
              })
            }
          >
            <ArrowRight size={13} /> {label}
          </button>
        ))}

        {/* Eraser */}
        <button
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-all duration-200 cursor-pointer"
          style={{
            background: ui.eraserMode ? 'rgba(239,68,68,0.2)' : 'transparent',
            color: ui.eraserMode ? '#EF4444' : 'var(--color-txt-secondary)',
          }}
          onClick={() => setUI({ eraserMode: !ui.eraserMode, arrowMode: null, arrowDrawing: null })}
        >
          <Eraser size={13} />
        </button>
      </div>

      <Divider />

      {/* ── Actions ── */}
      <ToolbarButton Icon={Trash2} label="Limpar Setas" onClick={() => dispatch({ type: 'CLEAR_ARROWS' })} />
      <ToolbarButton Icon={FlipHorizontal} label="Inverter" onClick={() => dispatch({ type: 'FLIP_SIDES' })} />
      <ToolbarButton Icon={RotateCcw} label="Resetar" onClick={() => dispatch({ type: 'RESET_POSITIONS' })} />

      <Divider />

      {/* ── Away Team Toggle ── */}
      <button
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
        style={{
          background: ui.showAwayTeam ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
          color: ui.showAwayTeam ? 'var(--color-accent)' : 'var(--color-txt-secondary)',
        }}
        onClick={() => setUI({ showAwayTeam: !ui.showAwayTeam })}
        title={ui.showAwayTeam ? 'Ocultar Time B' : 'Exibir Time B'}
      >
        <Users size={13} />
        {ui.showAwayTeam ? 'Time B On' : 'Time B Off'}
      </button>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/[0.08]" />;
}

function ToolbarButton({ Icon, label, onClick }) {
  return (
    <button
      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer text-txt-secondary"
      onClick={onClick}
    >
      <Icon size={13} /> {label}
    </button>
  );
}
