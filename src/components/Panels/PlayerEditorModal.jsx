import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Camera, Loader2, Search, Trash2, UserRound, X } from 'lucide-react';
import { POSITIONS_LIST } from '../../data/positions';
import { buildFotmobPlayerPhotoPath, normalizeFotmobId } from '../../utils/fotmob';

/**
 * Modal overlay for editing a single player.
 */
export default function PlayerEditorModal({ player, team, teamId, dispatch, onClose }) {
  const [photoInput, setPhotoInput] = useState(player?.fotmobId || '');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setPhotoInput(player?.fotmobId || '');
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  }, [player?.fotmobId, player?.id]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

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

  const handleSearch = (value) => {
    setSearchQuery(value);
    setSearchError(null);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);

      try {
        const response = await fetch(`/api/search-player?q=${encodeURIComponent(value.trim())}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erro ao buscar jogador.');
        }

        const data = await response.json();
        setSearchResults(data.results || []);
      } catch (err) {
        setSearchError(err.message);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleApplyPlayer = (result) => {
    update({
      name: result.name || player.name,
      position:
        result.position && POSITIONS_LIST.includes(result.position)
          ? result.position
          : player.position,
      number: Number.isFinite(result.number) ? result.number : player.number,
      fotmobId: result.fotmobId || player.fotmobId,
      role: result.subtitle || player.role || '',
    });
    setPhotoInput(result.fotmobId || '');
    setShowSearch(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="glass-stronger w-[460px] max-w-[94vw] rounded-3xl border-t border-accent/[0.08] p-6"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="scrollbar-thin max-h-[82vh] overflow-y-auto pr-1">
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
              className="cursor-pointer rounded-xl p-1.5 text-txt-secondary transition-all duration-200 hover:bg-white/[0.08] hover:text-txt-primary"
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
                className="mb-1 w-full rounded-xl border border-white/[0.06] bg-white/[0.05] px-3 py-2 text-sm text-txt-primary outline-none transition-colors duration-200 focus:border-accent/40 focus:bg-white/[0.08]"
                value={player.name}
                placeholder="Nome completo"
                onChange={(event) => update({ name: event.target.value })}
              />

              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-20 rounded-xl border border-white/[0.06] bg-white/[0.05] px-2 py-1.5 text-xs text-txt-primary outline-none transition-colors duration-200 focus:border-accent/40 focus:bg-white/[0.08]"
                  value={player.number}
                  min={1}
                  max={99}
                  onChange={(event) =>
                    update({ number: Number.parseInt(event.target.value, 10) || 1 })
                  }
                />

                <select
                  className="flex-1 cursor-pointer appearance-none rounded-xl border border-white/[0.06] bg-white/[0.05] px-2 py-1.5 pr-6 text-xs text-txt-primary outline-none transition-colors duration-200 focus:border-accent/40"
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

          <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserRound size={14} className="text-accent" />
                <div>
                  <div className="text-xs font-semibold text-txt-primary">
                    Buscar jogador real
                  </div>
                  <div className="text-[11px] text-txt-secondary">
                    Procure um atleta no FotMob e aplique nome, posicao e foto.
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-[11px] font-semibold text-txt-primary transition-colors hover:bg-white/10"
                onClick={() => setShowSearch((current) => !current)}
              >
                <Search size={13} />
                {showSearch ? 'Fechar' : 'Buscar'}
              </button>
            </div>

            {showSearch && (
              <>
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2">
                  <Search size={14} className="flex-shrink-0 text-txt-secondary" />
                  <input
                    className="flex-1 bg-transparent text-sm text-txt-primary outline-none placeholder:text-txt-secondary/50"
                    placeholder="Ex: Arrascaeta, Neymar, Rodri..."
                    value={searchQuery}
                    onChange={(event) => handleSearch(event.target.value)}
                  />
                  {searching && <Loader2 size={14} className="animate-spin text-accent" />}
                </div>

                {searchError && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle size={12} />
                    {searchError}
                  </div>
                )}

                {searchQuery.trim().length >= 2 && searchResults.length > 0 && (
                  <div className="scrollbar-thin mt-3 max-h-52 space-y-1 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.fotmobId}
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                        onClick={() => handleApplyPlayer(result)}
                      >
                        <img
                          src={result.photo}
                          alt=""
                          className="h-10 w-10 flex-shrink-0 rounded-full border border-white/10 object-cover"
                          onError={(event) => {
                            event.currentTarget.style.visibility = 'hidden';
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-txt-primary">
                            {result.name}
                          </div>
                          <div className="truncate text-[11px] text-txt-secondary">
                            {result.subtitle || 'FotMob'}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {result.position && (
                            <span className="rounded-lg bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-txt-primary">
                              {result.position}
                            </span>
                          )}
                          {result.number && (
                            <span className="text-[10px] text-txt-secondary">#{result.number}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.trim().length >= 2 &&
                  !searching &&
                  !searchError &&
                  searchResults.length === 0 && (
                    <div className="mt-3 text-xs text-txt-secondary">
                      Nenhum jogador encontrado para "{searchQuery}"
                    </div>
                  )}
              </>
            )}
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-txt-secondary">
              Instrucao tatica
            </label>
            <textarea
              className="w-full resize-none rounded-2xl border border-white/[0.06] bg-white/[0.05] px-3 py-2 text-xs text-txt-primary outline-none transition-colors duration-200 focus:border-accent/40 focus:bg-white/[0.08]"
              rows={2}
              placeholder="Ex: Pressionar a saida, atacar o meio, fechar a segunda trave..."
              value={player.instruction || ''}
              onChange={(event) => update({ instruction: event.target.value })}
            />
          </div>

          <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
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
                className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.05] px-3 py-2 text-xs text-txt-primary outline-none transition-colors duration-200 focus:border-accent/40 focus:bg-white/[0.08]"
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

          <div className="flex gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
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
    </div>
  );
}
