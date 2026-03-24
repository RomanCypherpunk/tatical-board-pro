import FORMATIONS from '../../data/formations';
import { POSITIONS_LIST } from '../../data/positions';
import SHIRT_PATTERNS from '../../data/shirtPatterns';
import { Pencil } from 'lucide-react';

const formationKeys = Object.keys(FORMATIONS);

/**
 * Side panel for configuring one team: identity, colors, pattern, formation, player roster.
 */
export default function TeamPanel({ team, teamId, dispatch, selectedPlayer }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Team Identity ── */}
      <div className="p-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-2">
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
        </div>
        <div className="flex gap-2 items-center mb-2">
          <label className="text-xs text-txt-secondary">Abrev.</label>
          <input
            className="w-14 bg-white/5 rounded px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-accent text-txt-primary"
            value={team.shortName}
            maxLength={4}
            onChange={(e) =>
              dispatch({
                type: 'SET_TEAM_FIELD',
                teamId,
                field: 'shortName',
                value: e.target.value.toUpperCase(),
              })
            }
          />
        </div>

        {/* ── 3 Color pickers ── */}
        <div className="flex gap-3 items-center">
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
        </div>
      </div>

      {/* ── Shirt Pattern Selector ── */}
      <div className="p-3 border-b border-white/[0.08]">
        <label className="text-xs font-semibold block mb-1.5 text-txt-secondary">Padrão da Camisa</label>
        <div className="grid grid-cols-4 gap-1">
          {SHIRT_PATTERNS.map(({ key, label }) => (
            <button
              key={key}
              className="text-[10px] py-1.5 px-1 rounded transition-all duration-200 cursor-pointer font-medium leading-tight"
              style={{
                background: team.pattern === key ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                color: team.pattern === key ? '#fff' : 'var(--color-txt-secondary)',
              }}
              title={label}
              onClick={() => dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'pattern', value: key })}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Mini preview */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-txt-secondary">Preview:</span>
          <ShirtPreview
            pattern={team.pattern}
            primary={team.primaryColor}
            secondary={team.secondaryColor}
            numberColor={team.numberColor}
          />
        </div>
      </div>

      {/* ── Formation Selector ── */}
      <div className="p-3 border-b border-white/[0.08]">
        <label className="text-xs font-semibold block mb-1.5 text-txt-secondary">Formação</label>
        <div className="grid grid-cols-3 gap-1">
          {formationKeys.map((f) => (
            <button
              key={f}
              className="text-xs py-1.5 px-1 rounded transition-all duration-200 cursor-pointer font-medium"
              style={{
                background: team.formation === f ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                color: team.formation === f ? '#fff' : 'var(--color-txt-secondary)',
              }}
              onClick={() => dispatch({ type: 'SET_FORMATION', teamId, formation: f })}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Player Roster ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <label className="text-xs font-semibold block mb-1.5 px-1 text-txt-secondary">
          Titulares ({team.players.length})
        </label>
        <div className="flex flex-col gap-0.5">
          {team.players.map((player) => {
            const isActive = selectedPlayer?.id === player.id && selectedPlayer?.teamId === teamId;
            return (
              <div
                key={player.id}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all duration-150 cursor-pointer group"
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
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: player.colorOverride || team.primaryColor, color: team.numberColor }}
                >
                  {player.number}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    className="w-full bg-transparent text-xs font-medium outline-none truncate text-txt-primary"
                    value={player.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_PLAYER',
                        teamId,
                        playerId: player.id,
                        updates: { name: e.target.value },
                      })
                    }
                  />
                </div>
                <select
                  className="bg-white/5 text-xs rounded px-1 py-0.5 outline-none appearance-none pr-4 cursor-pointer text-txt-secondary"
                  value={player.position}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_PLAYER',
                      teamId,
                      playerId: player.id,
                      updates: { position: e.target.value },
                    })
                  }
                >
                  {POSITIONS_LIST.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5 text-txt-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({
                      type: 'SET_UI',
                      updates: { selectedPlayer: { teamId, id: player.id }, showPlayerEditor: true },
                    });
                  }}
                >
                  <Pencil size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Small color picker with label */
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

/** Inline SVG preview of the shirt pattern at small size */
function ShirtPreview({ pattern, primary, secondary, numberColor }) {
  const s = 28;
  const patternId = `preview-${pattern}`;

  const getPatternEl = () => {
    switch (pattern) {
      case 'cheques':
        return <><rect width={s/2} height={s/2} fill={secondary} /><rect x={s/2} y={s/2} width={s/2} height={s/2} fill={secondary} /></>;
      case 'half_half_h':
        return <rect y={s/2} width={s} height={s/2} fill={secondary} />;
      case 'half_half_v':
        return <rect x={s/2} width={s/2} height={s} fill={secondary} />;
      case 'stripes_v':
        return <>{[0,2,4].map(i => <rect key={i} x={i*(s/6)} width={s/6} height={s} fill={secondary} />)}</>;
      case 'stripes_h':
        return <>{[0,2,4].map(i => <rect key={i} y={i*(s/6)} width={s} height={s/6} fill={secondary} />)}</>;
      case 'stripes_thin':
        return <>{[0,2,4,6].map(i => <rect key={i} x={i*(s/8)} width={s/16} height={s} fill={secondary} />)}</>;
      case 'stripe_diagonal':
        return <polygon points={`0,0 ${s*0.6},0 0,${s*0.6}`} fill={secondary} />;
      case 'stripe_h':
        return <rect y={s*0.35} width={s} height={s*0.3} fill={secondary} />;
      case 'stripe_v':
        return <rect x={s*0.35} width={s*0.3} height={s} fill={secondary} />;
      case 'stripe_cut':
        return <polygon points={`0,0 ${s},0 0,${s}`} fill={secondary} />;
      case 'stripe_thick':
        return <><rect width={s/3} height={s} fill={secondary} /><rect x={s*2/3} width={s/3} height={s} fill={secondary} /></>;
      case 'quarters':
        return <><rect x={s/2} width={s/2} height={s/2} fill={secondary} /><rect y={s/2} width={s/2} height={s/2} fill={secondary} /></>;
      case 'vshape':
        return <polygon points={`0,0 ${s/2},${s*0.6} ${s},0 ${s},${s*0.35} ${s/2},${s*0.95} 0,${s*0.35}`} fill={secondary} />;
      default:
        return null;
    }
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="rounded-md border border-white/10">
      <rect width={s} height={s} fill={primary} rx="3" />
      {getPatternEl()}
      <text
        x={s/2}
        y={s/2}
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
