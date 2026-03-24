import { useState, useRef, useEffect } from 'react';
import { Pencil, ChevronUp, ChevronDown, Star, Shield } from 'lucide-react';
import FORMATIONS from '../../data/formations';
import SHIRT_PATTERNS from '../../data/shirtPatterns';

const formationKeys = Object.keys(FORMATIONS);

const SELECT_STYLE = {
  backgroundColor: '#1e2233',
  color: '#f1f3f5',
  border: '1px solid rgba(255,255,255,0.12)',
};

const OPTION_STYLE = { backgroundColor: '#1e2233', color: '#f1f3f5' };

export default function TeamPanel({ team, teamId, dispatch, selectedPlayer }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Team Identity + Colors ── */}
      <div className="p-3 border-b border-white/[0.08] space-y-2.5">
        {/* Name + Abbreviation */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: team.primaryColor, color: team.numberColor }}
          >
            {team.shortName.slice(0, 2)}
          </div>
          <input
            className="flex-1 bg-transparent text-sm font-semibold outline-none border-b border-transparent focus:border-accent transition-colors px-1 py-0.5 text-txt-primary"
            value={team.name}
            onChange={(e) =>
              dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'name', value: e.target.value })
            }
            placeholder="Nome do Time"
          />
          <input
            className="w-12 bg-white/5 rounded px-1.5 py-0.5 text-xs text-center outline-none focus:ring-1 focus:ring-accent text-txt-primary"
            value={team.shortName}
            maxLength={4}
            onChange={(e) =>
              dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'shortName', value: e.target.value.toUpperCase() })
            }
            placeholder="ABR"
          />
        </div>

        {/* Colors + shirt preview */}
        <div className="flex items-center gap-3">
          <ColorPicker
            label="Primária"
            value={team.primaryColor}
            onChange={(v) => dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'primaryColor', value: v })}
          />
          <ColorPicker
            label="Secundária"
            value={team.secondaryColor}
            onChange={(v) => dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'secondaryColor', value: v })}
          />
          <ColorPicker
            label="Nº/Texto"
            value={team.numberColor}
            onChange={(v) => dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'numberColor', value: v })}
          />
          <ShirtPreview
            pattern={team.pattern}
            primary={team.primaryColor}
            secondary={team.secondaryColor}
            numberColor={team.numberColor}
          />
        </div>

        {/* Pattern swatches */}
        <div>
          <label className="text-[10px] text-txt-secondary block mb-1.5">Camisa</label>
          <div className="flex flex-wrap gap-1.5">
            {SHIRT_PATTERNS.map(({ key, label }) => (
              <PatternSwatch
                key={key}
                patternKey={key}
                label={label}
                primary={team.primaryColor}
                secondary={team.secondaryColor}
                selected={team.pattern === key}
                onClick={() => dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'pattern', value: key })}
              />
            ))}
          </div>
        </div>

        {/* Formation dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-txt-secondary flex-shrink-0">Formação</label>
          <select
            className="flex-1 text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer font-semibold appearance-none"
            style={SELECT_STYLE}
            value={team.formation}
            onChange={(e) => dispatch({ type: 'SET_FORMATION', teamId, formation: e.target.value })}
          >
            {formationKeys.map((f) => (
              <option key={f} value={f} style={OPTION_STYLE}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Player Roster ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <label className="text-xs font-semibold block mb-1 px-1 text-txt-secondary">
          Jogadores ({team.players.length})
        </label>
        <div className="flex flex-col gap-0.5">
          {team.players.map((player, idx) => (
            <PlayerRow
              key={player.id}
              player={player}
              team={team}
              teamId={teamId}
              dispatch={dispatch}
              isActive={selectedPlayer?.id === player.id && selectedPlayer?.teamId === teamId}
              isFirst={idx === 0}
              isLast={idx === team.players.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Single player row — inline edits on number/name/position + pencil menu. */
function PlayerRow({ player, team, teamId, dispatch, isActive, isFirst, isLast }) {
  const [editField, setEditField] = useState(null); // 'number' | 'name' | 'position'
  const [showMenu, setShowMenu] = useState(false);
  const numRef = useRef(null);
  const nameRef = useRef(null);
  const posRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (editField === 'number' && numRef.current) { numRef.current.focus(); numRef.current.select(); }
    if (editField === 'name' && nameRef.current) { nameRef.current.focus(); nameRef.current.select(); }
    if (editField === 'position' && posRef.current) { posRef.current.focus(); posRef.current.select(); }
  }, [editField]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showMenu]);

  const update = (updates) =>
    dispatch({ type: 'UPDATE_PLAYER', teamId, playerId: player.id, updates });

  const stopAndEdit = (e, field) => {
    e.stopPropagation();
    setEditField(field);
  };

  const commit = () => setEditField(null);

  return (
    <div
      className="flex items-center gap-1 rounded-lg px-1.5 py-1 transition-all duration-150 group relative"
      style={{
        background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
      }}
      onClick={() =>
        dispatch({
          type: 'SET_UI',
          updates: {
            selectedPlayer: isActive ? null : { teamId, id: player.id },
            selectedTeam: teamId,
          },
        })
      }
    >
      {/* Number badge */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 cursor-text"
        style={{ background: player.colorOverride || team.primaryColor, color: team.numberColor }}
        onClick={(e) => stopAndEdit(e, 'number')}
        title="Editar número"
      >
        {editField === 'number' ? (
          <input
            ref={numRef}
            className="w-5 h-5 bg-transparent text-center text-[10px] font-bold outline-none"
            style={{ color: team.numberColor }}
            value={player.number}
            maxLength={2}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const n = e.target.value.replace(/\D/g, '');
              update({ number: n ? Number(n) : '' });
            }}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          />
        ) : player.number}
      </div>

      {/* Name */}
      <div
        className="flex-1 min-w-0 cursor-text"
        onClick={(e) => stopAndEdit(e, 'name')}
        title="Editar nome"
      >
        {editField === 'name' ? (
          <input
            ref={nameRef}
            className="w-full bg-white/10 rounded px-1 py-0 text-xs font-medium outline-none text-txt-primary"
            value={player.name}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => update({ name: e.target.value })}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          />
        ) : (
          <span className="text-xs font-medium truncate block text-txt-primary hover:text-accent transition-colors">
            {player.name}
          </span>
        )}
      </div>

      {/* Position */}
      <div
        className="flex-shrink-0 cursor-text"
        onClick={(e) => stopAndEdit(e, 'position')}
        title="Editar posição"
      >
        {editField === 'position' ? (
          <input
            ref={posRef}
            className="w-9 text-center bg-white/10 rounded px-1 py-0 text-[10px] font-medium outline-none text-txt-primary"
            value={player.position}
            maxLength={4}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => update({ position: e.target.value.toUpperCase() })}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          />
        ) : (
          <span className="text-[10px] text-txt-secondary font-medium w-8 text-center block hover:text-accent transition-colors">
            {player.position}
          </span>
        )}
      </div>

      {/* Pencil icon + context menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all text-txt-secondary hover:text-txt-primary"
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
          title="Mais opções"
        >
          <Pencil size={11} />
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-6 z-50 rounded-xl shadow-2xl border border-white/10 p-1 min-w-[158px] flex flex-col gap-0.5"
            style={{ backgroundColor: '#1e2233' }}
            onClick={(e) => e.stopPropagation()}
          >
            <OptionBtn
              icon={<Shield size={12} />}
              label="Capitão"
              active={player.isCaptain}
              onClick={() => { dispatch({ type: 'SET_CAPTAIN', teamId, playerId: player.id }); setShowMenu(false); }}
            />
            <OptionBtn
              icon={<Star size={12} />}
              label="Destaque"
              active={player.isKeyPlayer}
              onClick={() => { update({ isKeyPlayer: !player.isKeyPlayer }); setShowMenu(false); }}
            />
            <div className="h-px bg-white/10 my-0.5" />
            <OptionBtn
              icon={<ChevronUp size={12} />}
              label="Mover para cima"
              disabled={isFirst}
              onClick={() => {
                dispatch({ type: 'REORDER_PLAYER', teamId, playerId: player.id, direction: 'up' });
                setShowMenu(false);
              }}
            />
            <OptionBtn
              icon={<ChevronDown size={12} />}
              label="Mover para baixo"
              disabled={isLast}
              onClick={() => {
                dispatch({ type: 'REORDER_PLAYER', teamId, playerId: player.id, direction: 'down' });
                setShowMenu(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function OptionBtn({ icon, label, active, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs w-full text-left transition-colors hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        color: active ? '#3B82F6' : '#f1f3f5',
        backgroundColor: active ? 'rgba(59,130,246,0.12)' : 'transparent',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/** Small pattern swatch circle */
function PatternSwatch({ patternKey, label, primary, secondary, selected, onClick }) {
  const s = 20;
  const r = s / 2;

  const getPattern = () => {
    switch (patternKey) {
      case 'cheques':
        return (
          <>
            <rect width={r} height={r} fill={secondary} />
            <rect x={r} y={r} width={r} height={r} fill={secondary} />
          </>
        );
      case 'half_half_h': return <rect y={r} width={s} height={r} fill={secondary} />;
      case 'half_half_v': return <rect x={r} width={r} height={s} fill={secondary} />;
      case 'stripes_v':
        return <>{[0, 2, 4].map((i) => <rect key={i} x={i * (s / 6)} width={s / 6} height={s} fill={secondary} />)}</>;
      case 'stripes_h':
        return <>{[0, 2, 4].map((i) => <rect key={i} y={i * (s / 6)} width={s} height={s / 6} fill={secondary} />)}</>;
      case 'stripes_thin':
        return <>{[0, 2, 4, 6].map((i) => <rect key={i} x={i * (s / 8)} width={s / 16} height={s} fill={secondary} />)}</>;
      case 'stripe_diagonal':
        return <polygon points={`0,0 ${s * 0.6},0 0,${s * 0.6}`} fill={secondary} />;
      case 'stripe_h': return <rect y={s * 0.35} width={s} height={s * 0.3} fill={secondary} />;
      case 'stripe_v': return <rect x={s * 0.35} width={s * 0.3} height={s} fill={secondary} />;
      case 'stripe_cut':
        return <polygon points={`0,0 ${s},0 0,${s}`} fill={secondary} />;
      case 'stripe_thick':
        return (
          <>
            <rect width={s / 3} height={s} fill={secondary} />
            <rect x={s * 2 / 3} width={s / 3} height={s} fill={secondary} />
          </>
        );
      case 'quarters':
        return (
          <>
            <rect x={r} width={r} height={r} fill={secondary} />
            <rect y={r} width={r} height={r} fill={secondary} />
          </>
        );
      case 'vshape':
        return (
          <polygon
            points={`0,0 ${r},${s * 0.6} ${s},0 ${s},${s * 0.35} ${r},${s * 0.95} 0,${s * 0.35}`}
            fill={secondary}
          />
        );
      default: return null;
    }
  };

  return (
    <button
      onClick={onClick}
      title={label}
      className="flex-shrink-0 focus:outline-none"
      style={{
        borderRadius: '50%',
        outline: selected ? '2px solid #3B82F6' : '2px solid transparent',
        outlineOffset: '2px',
        padding: 0,
      }}
    >
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        style={{ borderRadius: '50%', display: 'block', overflow: 'hidden' }}
      >
        <clipPath id={`clip-swatch-${patternKey}`}>
          <circle cx={r} cy={r} r={r} />
        </clipPath>
        <g clipPath={`url(#clip-swatch-${patternKey})`}>
          <rect width={s} height={s} fill={primary} />
          {getPattern()}
        </g>
      </svg>
    </button>
  );
}

/** Small color input with label */
function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <input
        type="color"
        className="w-6 h-6 rounded cursor-pointer border-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="text-[9px] text-txt-secondary">{label}</span>
    </div>
  );
}

/** Inline SVG preview of the selected shirt pattern */
function ShirtPreview({ pattern, primary, secondary, numberColor }) {
  const s = 28;
  const getPatternEl = () => {
    switch (pattern) {
      case 'cheques':
        return <><rect width={s / 2} height={s / 2} fill={secondary} /><rect x={s / 2} y={s / 2} width={s / 2} height={s / 2} fill={secondary} /></>;
      case 'half_half_h': return <rect y={s / 2} width={s} height={s / 2} fill={secondary} />;
      case 'half_half_v': return <rect x={s / 2} width={s / 2} height={s} fill={secondary} />;
      case 'stripes_v': return <>{[0, 2, 4].map((i) => <rect key={i} x={i * (s / 6)} width={s / 6} height={s} fill={secondary} />)}</>;
      case 'stripes_h': return <>{[0, 2, 4].map((i) => <rect key={i} y={i * (s / 6)} width={s} height={s / 6} fill={secondary} />)}</>;
      case 'stripes_thin': return <>{[0, 2, 4, 6].map((i) => <rect key={i} x={i * (s / 8)} width={s / 16} height={s} fill={secondary} />)}</>;
      case 'stripe_diagonal': return <polygon points={`0,0 ${s * 0.6},0 0,${s * 0.6}`} fill={secondary} />;
      case 'stripe_h': return <rect y={s * 0.35} width={s} height={s * 0.3} fill={secondary} />;
      case 'stripe_v': return <rect x={s * 0.35} width={s * 0.3} height={s} fill={secondary} />;
      case 'stripe_cut': return <polygon points={`0,0 ${s},0 0,${s}`} fill={secondary} />;
      case 'stripe_thick': return <><rect width={s / 3} height={s} fill={secondary} /><rect x={s * 2 / 3} width={s / 3} height={s} fill={secondary} /></>;
      case 'quarters': return <><rect x={s / 2} width={s / 2} height={s / 2} fill={secondary} /><rect y={s / 2} width={s / 2} height={s / 2} fill={secondary} /></>;
      case 'vshape': return <polygon points={`0,0 ${s / 2},${s * 0.6} ${s},0 ${s},${s * 0.35} ${s / 2},${s * 0.95} 0,${s * 0.35}`} fill={secondary} />;
      default: return null;
    }
  };
  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className="rounded-md border border-white/10 flex-shrink-0 ml-auto"
    >
      <rect width={s} height={s} fill={primary} rx="3" />
      {getPatternEl()}
      <text
        x={s / 2}
        y={s / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={numberColor}
        fontSize="10"
        fontWeight="800"
        fontFamily="Inter, sans-serif"
      >
        10
      </text>
    </svg>
  );
}
