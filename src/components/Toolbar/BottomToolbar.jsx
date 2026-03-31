import {
  ArrowRight,
  FlipHorizontal,
  Hash,
  Image as ImageIcon,
  MapPin,
  MousePointer,
  Pencil,
  RotateCcw,
  Trash2,
  Type,
  Users,
  X,
} from 'lucide-react';
import ARROW_STYLES from '../../data/arrowStyles';
import PITCH_THEMES from '../../data/pitchThemes';

const VIEW_MODES = [
  { mode: 'number', Icon: Hash, label: 'N' },
  { mode: 'name', Icon: Type, label: 'Nome' },
  { mode: 'position', Icon: MapPin, label: 'Pos' },
  { mode: 'photo', Icon: ImageIcon, label: 'Foto' },
];

const THEME_KEYS = Object.keys(PITCH_THEMES);

const ARROW_TYPES = Object.entries(ARROW_STYLES).map(([type, style]) => ({
  type,
  label: style.label,
  color: style.defaultColor,
}));

/**
 * Bottom toolbar with player view modes, pitch theme, arrows and actions.
 */
export default function BottomToolbar({ ui, dispatch }) {
  const setUI = (updates) => dispatch({ type: 'SET_UI', updates });

  return (
    <div className="glass z-10 flex flex-shrink-0 flex-wrap items-center justify-center gap-2 border-t border-white/[0.08] px-3 py-2">
      <div className="flex items-center gap-0.5 rounded-xl bg-white/5 p-0.5">
        {VIEW_MODES.map(({ mode, Icon, label }) => (
          <button
            key={mode}
            className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200"
            style={{
              background: ui.viewMode === mode ? 'var(--accent)' : 'transparent',
              color: ui.viewMode === mode ? '#fff' : 'var(--text-secondary)',
            }}
            onClick={() => setUI({ viewMode: mode })}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <Divider />

      <div className="flex items-center gap-1">
        {THEME_KEYS.map((key) => (
          <button
            key={key}
            className="h-6 w-6 cursor-pointer rounded-full border-2 transition-all duration-200"
            title={PITCH_THEMES[key].label}
            style={{
              background: PITCH_THEMES[key].field,
              borderColor:
                ui.pitchStyle === key ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
              transform: ui.pitchStyle === key ? 'scale(1.2)' : 'scale(1)',
            }}
            onClick={() => setUI({ pitchStyle: key })}
          />
        ))}
      </div>

      <Divider />

      <div className="flex items-center gap-0.5 rounded-xl bg-white/5 p-0.5">
        <button
          className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-all duration-200"
          style={{
            background: !ui.arrowMode ? 'var(--accent)' : 'transparent',
            color: !ui.arrowMode ? '#fff' : 'var(--text-secondary)',
          }}
          onClick={() => setUI({ arrowMode: null, arrowDrawing: null })}
        >
          <MousePointer size={13} />
        </button>

        {ARROW_TYPES.map(({ type, label, color }) => (
          <button
            key={type}
            className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-all duration-200"
            title={label}
            style={{
              background: ui.arrowMode === type ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: ui.arrowMode === type ? color : 'var(--text-secondary)',
            }}
            onClick={() =>
              setUI({
                arrowMode: ui.arrowMode === type ? null : type,
                arrowDrawing: null,
              })
            }
          >
            <ArrowRight size={13} />
            {label}
          </button>
        ))}
      </div>

      {ui.selectedArrow && (
        <>
          <Divider />
          <button
            className="flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs transition-all"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
            onClick={() => dispatch({ type: 'REMOVE_ARROW', id: ui.selectedArrow })}
          >
            <X size={13} />
            Remover Seta
          </button>
        </>
      )}

      {ui.selectedPlayer && (
        <>
          <Divider />
          <button
            className="flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs transition-all"
            style={{ background: 'rgba(20,201,107,0.14)', color: 'var(--accent)' }}
            onClick={() => setUI({ showPlayerEditor: true })}
          >
            <Pencil size={13} />
            Editar Jogador
          </button>
        </>
      )}

      <Divider />

      <ToolbarButton
        Icon={Trash2}
        label="Limpar Setas"
        onClick={() => dispatch({ type: 'CLEAR_ARROWS' })}
      />
      <ToolbarButton
        Icon={FlipHorizontal}
        label="Inverter"
        onClick={() => dispatch({ type: 'FLIP_SIDES' })}
      />
      <ToolbarButton
        Icon={RotateCcw}
        label="Resetar"
        onClick={() => dispatch({ type: 'RESET_POSITIONS' })}
      />

      <Divider />

      <button
        className="flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs transition-all duration-200"
        style={{
          background: ui.showAwayTeam ? 'rgba(20,201,107,0.15)' : 'rgba(255,255,255,0.05)',
          color: ui.showAwayTeam ? 'var(--accent)' : 'var(--text-secondary)',
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
  return <div className="h-5 w-px bg-white/[0.08]" />;
}

function ToolbarButton({ Icon, label, onClick }) {
  return (
    <button
      className="flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-txt-secondary transition-all hover:bg-white/10"
      onClick={onClick}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
