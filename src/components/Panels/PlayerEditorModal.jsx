import { useEffect, useMemo, useState } from 'react';
import { Camera, Trash2, X } from 'lucide-react';
import { POSITIONS_LIST } from '../../data/positions';
import { buildFotmobPlayerPhotoPath, normalizeFotmobId } from '../../utils/fotmob';

/**
 * Modal overlay for editing a single player.
 */
export default function PlayerEditorModal({ player, team, teamId, dispatch, onClose }) {
  const [photoInput, setPhotoInput] = useState(player?.fotmobId || '');

  useEffect(() => {
    setPhotoInput(player?.fotmobId || '');
  }, [player?.fotmobId, player?.id]);

  const photoPath = useMemo(
    () => buildFotmobPlayerPhotoPath(player?.fotmobId),
    [player?.fotmobId]
  );

  if (!player) return null;

  const update = (updates) =>
    dispatch({ type: 'UPDATE_PLAYER', teamId, playerId: player.id, updates });

  const applyFotmobId = () => {
    update({ fotmobId: normalizeFotmobId(photoInput) });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="glass-stronger w-[420px] max-w-[92vw] rounded-3xl p-5"
        style={{ boxShadow: '0 18px 50px rgba(0,0,0,0.45)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm uppercase tracking-[0.18em] text-txt-primary">
              Editar Jogador
            </h3>
            <p className="text-xs text-txt-secondary">
              Ajuste identidade, funcao e foto do atleta.
            </p>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-txt-secondary transition-colors hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold"
            style={{ background: player.colorOverride || team.primaryColor, color: team.numberColor }}
          >
            {player.number}
          </div>

          <div className="min-w-0 flex-1">
            <input
              className="mb-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-txt-primary outline-none focus:ring-1 focus:ring-accent"
              value={player.name}
              placeholder="Nome completo"
              onChange={(event) => update({ name: event.target.value })}
            />

            <div className="flex gap-2">
              <input
                type="number"
                className="w-20 rounded-xl bg-white/5 px-2 py-1.5 text-xs text-txt-primary outline-none focus:ring-1 focus:ring-accent"
                value={player.number}
                min={1}
                max={99}
                onChange={(event) =>
                  update({ number: Number.parseInt(event.target.value, 10) || 1 })
                }
              />

              <select
                className="flex-1 cursor-pointer appearance-none rounded-xl bg-white/5 px-2 py-1.5 pr-6 text-xs text-txt-primary outline-none"
                value={player.position}
                onChange={(event) => update({ position: event.target.value })}
              >
                {POSITIONS_LIST.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-txt-secondary">
            Instrucao tática
          </label>
          <textarea
            className="w-full resize-none rounded-2xl bg-white/5 px-3 py-2 text-xs text-txt-primary outline-none focus:ring-1 focus:ring-accent"
            rows={2}
            placeholder="Ex: Pressionar a saida, atacar o meio, fechar a segunda trave..."
            value={player.instruction || ''}
            onChange={(event) => update({ instruction: event.target.value })}
          />
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center gap-2">
            <Camera size={14} className="text-accent" />
            <div>
              <div className="text-xs font-semibold text-txt-primary">Foto do jogador</div>
              <div className="text-[11px] text-txt-secondary">
                Cole o ID ou o link do jogador no FotMob para ativar o modo Foto.
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-xs text-txt-primary outline-none focus:ring-1 focus:ring-accent"
              value={photoInput}
              placeholder="Ex: 887448 ou https://www.fotmob.com/players/887448/..."
              onChange={(event) => setPhotoInput(event.target.value)}
              onBlur={applyFotmobId}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyFotmobId();
                }
              }}
            />

            {player.fotmobId && (
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-xs text-txt-secondary transition-colors hover:bg-white/10 hover:text-txt-primary"
                onClick={() => {
                  setPhotoInput('');
                  update({ fotmobId: null });
                }}
              >
                <Trash2 size={13} />
                Remover
              </button>
            )}
          </div>

          {photoPath && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-black/20 px-3 py-2">
              <img
                src={photoPath}
                alt={player.name}
                className="h-12 w-12 rounded-full border border-white/10 object-cover"
              />
              <div>
                <div className="text-xs font-semibold text-txt-primary">Preview FotMob</div>
                <div className="text-[11px] text-txt-secondary">
                  O jogador aparece no campo quando a barra inferior estiver em "Foto".
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 flex gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-txt-secondary">
              Cor individual
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-8 cursor-pointer rounded-lg"
                value={player.colorOverride || team.primaryColor}
                onChange={(event) => update({ colorOverride: event.target.value })}
              />

              {player.colorOverride && (
                <button
                  className="cursor-pointer text-xs text-txt-secondary underline"
                  onClick={() => update({ colorOverride: null })}
                >
                  Resetar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded accent-green-500"
              checked={player.isCaptain}
              onChange={() => dispatch({ type: 'SET_CAPTAIN', teamId, playerId: player.id })}
            />
            <span className="text-xs text-txt-primary">Capitao (C)</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded accent-yellow-500"
              checked={player.isKeyPlayer}
              onChange={(event) => update({ isKeyPlayer: event.target.checked })}
            />
            <span className="text-xs text-txt-primary">Jogador chave</span>
          </label>
        </div>
      </div>
    </div>
  );
}
