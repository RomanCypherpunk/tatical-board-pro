import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Pencil,
  Shield,
  Star,
} from 'lucide-react';
import FORMATIONS, { FORMATION_KEYS } from '../../data/formations';
import SHIRT_PATTERNS from '../../data/shirtPatterns';

const formationKeys = FORMATION_KEYS.filter((formation) => FORMATIONS[formation]);

const SELECT_STYLE = {
  backgroundColor: '#101F17',
  color: '#F5F7F5',
  border: '1px solid rgba(255,255,255,0.12)',
};

const OPTION_STYLE = {
  backgroundColor: '#101F17',
  color: '#F5F7F5',
};

export default function TeamPanel({ team, teamId, dispatch, selectedPlayer }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="space-y-4 border-b border-white/[0.08] p-4">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold"
            style={{ background: team.primaryColor, color: team.numberColor }}
          >
            {team.shortName.slice(0, 3)}
          </div>

          <input
            className="flex-1 border-b border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-txt-primary outline-none transition-colors focus:border-accent"
            value={team.name}
            onChange={(event) =>
              dispatch({
                type: 'SET_TEAM_FIELD',
                teamId,
                field: 'name',
                value: event.target.value,
              })
            }
            placeholder="Nome do time"
          />

          <input
            className="w-12 rounded bg-white/5 px-1.5 py-0.5 text-center text-xs text-txt-primary outline-none focus:ring-1 focus:ring-accent"
            value={team.shortName}
            maxLength={4}
            onChange={(event) =>
              dispatch({
                type: 'SET_TEAM_FIELD',
                teamId,
                field: 'shortName',
                value: event.target.value.toUpperCase(),
              })
            }
            placeholder="SIG"
          />
        </div>

        <div className="flex items-center gap-3.5">
          <ColorPicker
            label="Primaria"
            value={team.primaryColor}
            onChange={(value) =>
              dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'primaryColor', value })
            }
          />
          <ColorPicker
            label="Secundaria"
            value={team.secondaryColor}
            onChange={(value) =>
              dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'secondaryColor', value })
            }
          />
          <ColorPicker
            label="Texto"
            value={team.numberColor}
            onChange={(value) =>
              dispatch({ type: 'SET_TEAM_FIELD', teamId, field: 'numberColor', value })
            }
          />

          <ShirtPreview
            pattern={team.pattern}
            primary={team.primaryColor}
            secondary={team.secondaryColor}
            numberColor={team.numberColor}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-medium text-txt-secondary">Camisa</label>
          <div className="flex flex-wrap gap-2">
            {SHIRT_PATTERNS.map(({ key, label }) => (
              <PatternSwatch
                key={key}
                patternKey={key}
                label={label}
                primary={team.primaryColor}
                secondary={team.secondaryColor}
                selected={team.pattern === key}
                onClick={() =>
                  dispatch({
                    type: 'SET_TEAM_FIELD',
                    teamId,
                    field: 'pattern',
                    value: key,
                  })
                }
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => dispatch({ type: 'SET_UI', updates: { showLiveSearch: teamId } })}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-accent/20 bg-accent/[0.12] py-2.5 text-xs font-semibold text-accent transition-all duration-200 hover:bg-accent/[0.2] hover:shadow-[0_0_12px_rgba(20,201,107,0.15)]"
        >
          <Globe size={12} />
          Buscar Elenco no FotMob
        </button>

        <div className="flex items-center gap-2">
          <label className="flex-shrink-0 text-xs font-medium text-txt-secondary">Formacao</label>
          <select
            className="flex-1 appearance-none rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
            style={SELECT_STYLE}
            value={team.formation}
            onChange={(event) =>
              dispatch({
                type: 'SET_FORMATION',
                teamId,
                formation: event.target.value,
              })
            }
          >
            {formationKeys.map((formation) => (
              <option key={formation} value={formation} style={OPTION_STYLE}>
                {formation}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-2.5">
        <label className="mb-1.5 block px-1 font-display text-[11px] uppercase tracking-[0.16em] text-txt-secondary">
          Jogadores ({team.players.length})
        </label>

        <div className="flex flex-col gap-1">
          {team.players.map((player, index) => (
            <PlayerRow
              key={player.id}
              player={player}
              team={team}
              teamId={teamId}
              dispatch={dispatch}
              isActive={selectedPlayer?.id === player.id && selectedPlayer?.teamId === teamId}
              isFirst={index === 0}
              isLast={index === team.players.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ player, team, teamId, dispatch, isActive, isFirst, isLast }) {
  const [editField, setEditField] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const numRef = useRef(null);
  const nameRef = useRef(null);
  const posRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (editField === 'number' && numRef.current) {
      numRef.current.focus();
      numRef.current.select();
    }

    if (editField === 'name' && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
    }

    if (editField === 'position' && posRef.current) {
      posRef.current.focus();
      posRef.current.select();
    }
  }, [editField]);

  useEffect(() => {
    if (!showMenu) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showMenu]);

  const update = (updates) =>
    dispatch({ type: 'UPDATE_PLAYER', teamId, playerId: player.id, updates });

  const openEditor = () =>
    dispatch({
      type: 'SET_UI',
      updates: {
        selectedPlayer: { teamId, id: player.id },
        selectedTeam: teamId,
        showPlayerEditor: true,
      },
    });

  const stopAndEdit = (event, field) => {
    event.stopPropagation();
    setEditField(field);
  };

  const commit = () => setEditField(null);

  return (
    <div
      className="group relative flex items-center gap-1.5 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-white/[0.03]"
      style={{
        background: isActive ? 'rgba(20, 201, 107, 0.1)' : undefined,
        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
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
      onDoubleClick={(event) => {
        event.stopPropagation();
        openEditor();
      }}
    >
      <div
        className="flex h-6 w-6 flex-shrink-0 cursor-text items-center justify-center rounded-full text-[10px] font-bold shadow-sm"
        style={{ background: player.colorOverride || team.primaryColor, color: team.numberColor }}
        onClick={(event) => stopAndEdit(event, 'number')}
        title="Editar numero"
      >
        {editField === 'number' ? (
          <input
            ref={numRef}
            className="h-5 w-5 bg-transparent text-center text-[10px] font-bold outline-none"
            style={{ color: team.numberColor }}
            value={player.number}
            maxLength={2}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, '');
              update({ number: nextValue ? Number(nextValue) : '' });
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
            }}
          />
        ) : (
          player.number
        )}
      </div>

      <div
        className="min-w-0 flex-1 cursor-text"
        onClick={(event) => stopAndEdit(event, 'name')}
        title="Editar nome"
      >
        {editField === 'name' ? (
          <input
            ref={nameRef}
            className="w-full rounded bg-white/10 px-1 py-0 text-xs font-medium text-txt-primary outline-none"
            value={player.name}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => update({ name: event.target.value })}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
            }}
          />
        ) : (
          <span className="block truncate text-xs font-medium text-txt-primary transition-colors hover:text-accent">
            {player.name}
          </span>
        )}
      </div>

      <div
        className="flex-shrink-0 cursor-text"
        onClick={(event) => stopAndEdit(event, 'position')}
        title="Editar posicao"
      >
        {editField === 'position' ? (
          <input
            ref={posRef}
            className="w-10 rounded bg-white/10 px-1 py-0 text-center text-[10px] font-medium text-txt-primary outline-none"
            value={player.position}
            maxLength={4}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => update({ position: event.target.value.toUpperCase() })}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
            }}
          />
        ) : (
          <span className="block w-8 text-center text-[10px] font-medium text-txt-secondary transition-colors hover:text-accent">
            {player.position}
          </span>
        )}
      </div>

      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          className="flex h-5 w-5 items-center justify-center rounded text-txt-secondary opacity-0 transition-all hover:bg-white/10 hover:text-txt-primary group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            setShowMenu((current) => !current);
          }}
          title="Mais opcoes"
        >
          <Pencil size={11} />
        </button>

        {showMenu && (
          <div
            className="animate-fade-in absolute right-0 top-6 z-50 flex min-w-[168px] flex-col gap-0.5 rounded-xl border border-white/[0.1] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: '#101F17' }}
            onClick={(event) => event.stopPropagation()}
          >
            <OptionBtn
              icon={<Pencil size={12} />}
              label="Editar jogador"
              onClick={() => {
                openEditor();
                setShowMenu(false);
              }}
            />
            <div className="my-0.5 h-px bg-white/10" />
            <OptionBtn
              icon={<Shield size={12} />}
              label="Capitao"
              active={player.isCaptain}
              onClick={() => {
                dispatch({ type: 'SET_CAPTAIN', teamId, playerId: player.id });
                setShowMenu(false);
              }}
            />
            <OptionBtn
              icon={<Star size={12} />}
              label="Destaque"
              active={player.isKeyPlayer}
              onClick={() => {
                update({ isKeyPlayer: !player.isKeyPlayer });
                setShowMenu(false);
              }}
            />
            <div className="my-0.5 h-px bg-white/10" />
            <OptionBtn
              icon={<ChevronUp size={12} />}
              label="Mover para cima"
              disabled={isFirst}
              onClick={() => {
                dispatch({
                  type: 'REORDER_PLAYER',
                  teamId,
                  playerId: player.id,
                  direction: 'up',
                });
                setShowMenu(false);
              }}
            />
            <OptionBtn
              icon={<ChevronDown size={12} />}
              label="Mover para baixo"
              disabled={isLast}
              onClick={() => {
                dispatch({
                  type: 'REORDER_PLAYER',
                  teamId,
                  playerId: player.id,
                  direction: 'down',
                });
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
      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        color: active ? '#14C96B' : '#F5F7F5',
        backgroundColor: active ? 'rgba(20, 201, 107, 0.12)' : 'transparent',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function PatternSwatch({ patternKey, label, primary, secondary, selected, onClick }) {
  const size = 24;
  const radius = size / 2;

  const getPattern = () => {
    switch (patternKey) {
      case 'cheques':
        return (
          <>
            <rect width={radius} height={radius} fill={secondary} />
            <rect x={radius} y={radius} width={radius} height={radius} fill={secondary} />
          </>
        );
      case 'half_half_h':
        return <rect y={radius} width={size} height={radius} fill={secondary} />;
      case 'half_half_v':
        return <rect x={radius} width={radius} height={size} fill={secondary} />;
      case 'stripes_v':
        return (
          <>
            {[0, 2, 4].map((index) => (
              <rect
                key={index}
                x={index * (size / 6)}
                width={size / 6}
                height={size}
                fill={secondary}
              />
            ))}
          </>
        );
      case 'stripes_h':
        return (
          <>
            {[0, 2, 4].map((index) => (
              <rect
                key={index}
                y={index * (size / 6)}
                width={size}
                height={size / 6}
                fill={secondary}
              />
            ))}
          </>
        );
      case 'stripes_thin':
        return (
          <>
            {[0, 2, 4, 6].map((index) => (
              <rect
                key={index}
                x={index * (size / 8)}
                width={size / 16}
                height={size}
                fill={secondary}
              />
            ))}
          </>
        );
      case 'stripe_diagonal':
        return (
          <polygon points={`0,0 ${size * 0.6},0 0,${size * 0.6}`} fill={secondary} />
        );
      case 'stripe_h':
        return <rect y={size * 0.35} width={size} height={size * 0.3} fill={secondary} />;
      case 'stripe_v':
        return <rect x={size * 0.35} width={size * 0.3} height={size} fill={secondary} />;
      case 'stripe_cut':
        return <polygon points={`0,0 ${size},0 0,${size}`} fill={secondary} />;
      case 'stripe_thick':
        return (
          <>
            <rect width={size / 3} height={size} fill={secondary} />
            <rect x={(size * 2) / 3} width={size / 3} height={size} fill={secondary} />
          </>
        );
      case 'quarters':
        return (
          <>
            <rect x={radius} width={radius} height={radius} fill={secondary} />
            <rect y={radius} width={radius} height={radius} fill={secondary} />
          </>
        );
      case 'vshape':
        return (
          <polygon
            points={`0,0 ${radius},${size * 0.6} ${size},0 ${size},${size * 0.35} ${radius},${size * 0.95} 0,${size * 0.35}`}
            fill={secondary}
          />
        );
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      title={label}
      className="flex-shrink-0 transition-transform duration-200 hover:scale-110 focus:outline-none"
      style={{
        borderRadius: '50%',
        outline: selected ? '2px solid #14C96B' : '2px solid transparent',
        outlineOffset: '2px',
        padding: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ borderRadius: '50%', display: 'block', overflow: 'hidden' }}
      >
        <clipPath id={`clip-swatch-${patternKey}`}>
          <circle cx={radius} cy={radius} r={radius} />
        </clipPath>
        <g clipPath={`url(#clip-swatch-${patternKey})`}>
          <rect width={size} height={size} fill={primary} />
          {getPattern()}
        </g>
      </svg>
    </button>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="rounded-lg border border-white/[0.08] p-0.5">
        <input
          type="color"
          className="h-8 w-8 cursor-pointer rounded"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <span className="text-[10px] font-medium text-txt-secondary">{label}</span>
    </div>
  );
}

function ShirtPreview({ pattern, primary, secondary, numberColor }) {
  const size = 30;

  const getPatternEl = () => {
    switch (pattern) {
      case 'cheques':
        return (
          <>
            <rect width={size / 2} height={size / 2} fill={secondary} />
            <rect
              x={size / 2}
              y={size / 2}
              width={size / 2}
              height={size / 2}
              fill={secondary}
            />
          </>
        );
      case 'half_half_h':
        return <rect y={size / 2} width={size} height={size / 2} fill={secondary} />;
      case 'half_half_v':
        return <rect x={size / 2} width={size / 2} height={size} fill={secondary} />;
      case 'stripes_v':
        return (
          <>
            {[0, 2, 4].map((index) => (
              <rect
                key={index}
                x={index * (size / 6)}
                width={size / 6}
                height={size}
                fill={secondary}
              />
            ))}
          </>
        );
      case 'stripes_h':
        return (
          <>
            {[0, 2, 4].map((index) => (
              <rect
                key={index}
                y={index * (size / 6)}
                width={size}
                height={size / 6}
                fill={secondary}
              />
            ))}
          </>
        );
      case 'stripes_thin':
        return (
          <>
            {[0, 2, 4, 6].map((index) => (
              <rect
                key={index}
                x={index * (size / 8)}
                width={size / 16}
                height={size}
                fill={secondary}
              />
            ))}
          </>
        );
      case 'stripe_diagonal':
        return (
          <polygon points={`0,0 ${size * 0.6},0 0,${size * 0.6}`} fill={secondary} />
        );
      case 'stripe_h':
        return <rect y={size * 0.35} width={size} height={size * 0.3} fill={secondary} />;
      case 'stripe_v':
        return <rect x={size * 0.35} width={size * 0.3} height={size} fill={secondary} />;
      case 'stripe_cut':
        return <polygon points={`0,0 ${size},0 0,${size}`} fill={secondary} />;
      case 'stripe_thick':
        return (
          <>
            <rect width={size / 3} height={size} fill={secondary} />
            <rect x={(size * 2) / 3} width={size / 3} height={size} fill={secondary} />
          </>
        );
      case 'quarters':
        return (
          <>
            <rect x={size / 2} width={size / 2} height={size / 2} fill={secondary} />
            <rect y={size / 2} width={size / 2} height={size / 2} fill={secondary} />
          </>
        );
      case 'vshape':
        return (
          <polygon
            points={`0,0 ${size / 2},${size * 0.6} ${size},0 ${size},${size * 0.35} ${size / 2},${size * 0.95} 0,${size * 0.35}`}
            fill={secondary}
          />
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="ml-auto flex-shrink-0 rounded-lg border border-white/10"
    >
      <rect width={size} height={size} fill={primary} rx="4" />
      {getPatternEl()}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={numberColor}
        fontSize="10"
        fontWeight="800"
        fontFamily="Sora, sans-serif"
      >
        10
      </text>
    </svg>
  );
}
