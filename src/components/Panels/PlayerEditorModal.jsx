import { X } from 'lucide-react';
import { POSITIONS_LIST } from '../../data/positions';

/**
 * Modal overlay for detailed editing of a single player.
 */
export default function PlayerEditorModal({ player, team, teamId, dispatch, onClose }) {
  if (!player) return null;

  const update = (updates) =>
    dispatch({ type: 'UPDATE_PLAYER', teamId, playerId: player.id, updates });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass-stronger rounded-2xl p-5 w-80 max-w-[90vw]"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-txt-primary">Editar Jogador</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-txt-secondary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Identity row */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: player.colorOverride || team.primaryColor, color: team.numberColor }}
          >
            {player.number}
          </div>
          <div className="flex-1">
            <input
              className="w-full bg-white/5 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-accent mb-1 text-txt-primary"
              value={player.name}
              placeholder="Nome completo"
              onChange={(e) => update({ name: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                type="number"
                className="w-16 bg-white/5 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent text-txt-primary"
                value={player.number}
                min={1}
                max={99}
                onChange={(e) => update({ number: parseInt(e.target.value) || 1 })}
              />
              <select
                className="flex-1 bg-white/5 rounded-lg px-2 py-1 text-xs outline-none appearance-none pr-5 cursor-pointer text-txt-primary"
                value={player.position}
                onChange={(e) => update({ position: e.target.value })}
              >
                {POSITIONS_LIST.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tactical instruction */}
        <div className="mb-3">
          <label className="text-xs font-medium block mb-1 text-txt-secondary">Instrução Tática</label>
          <textarea
            className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent resize-none text-txt-primary"
            rows={2}
            placeholder="Ex: Pressionar saída de bola, inverter jogo pelo centro..."
            value={player.instruction || ''}
            onChange={(e) => update({ instruction: e.target.value })}
          />
        </div>

        {/* Color override */}
        <div className="flex gap-3 mb-3">
          <div>
            <label className="text-xs font-medium block mb-1 text-txt-secondary">Cor Individual</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="w-7 h-7 rounded cursor-pointer border-0"
                value={player.colorOverride || team.primaryColor}
                onChange={(e) => update({ colorOverride: e.target.value })}
              />
              {player.colorOverride && (
                <button
                  className="text-xs underline cursor-pointer text-txt-secondary"
                  onClick={() => update({ colorOverride: null })}
                >
                  Resetar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
              checked={player.isCaptain}
              onChange={() => dispatch({ type: 'SET_CAPTAIN', teamId, playerId: player.id })}
            />
            <span className="text-xs text-txt-primary">Capitão (C)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-yellow-500 cursor-pointer"
              checked={player.isKeyPlayer}
              onChange={(e) => update({ isKeyPlayer: e.target.checked })}
            />
            <span className="text-xs text-txt-primary">Jogador Chave</span>
          </label>
        </div>
      </div>
    </div>
  );
}
