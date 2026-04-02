import { useState, useRef, useCallback, useEffect } from 'react';
import { AlertCircle, Globe, Loader2, Search, X } from 'lucide-react';
import TEAMS_DB from '../../data/teamsDatabase';
import { getFormationLabel } from '../../data/formations';

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function findLocalTeam(lineupName) {
  const key = normalizeKey(lineupName);

  return TEAMS_DB.find((team) => {
    const teamName = normalizeKey(team.name);
    const aliases = (team.aliases || []).map(normalizeKey);
    return teamName === key || aliases.includes(key);
  });
}

/**
 * Modal overlay for searching FotMob teams and loading their lineup or squad.
 */
export default function LiveTeamSearch({ teamId, dispatch, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [lineup, setLineup] = useState(null);
  const [loadingLineup, setLoadingLineup] = useState(false);
  const [lineupError, setLineupError] = useState(null);

  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    setSearchError(null);
    clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);

      try {
        const response = await fetch(`/api/search-team?q=${encodeURIComponent(value)}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erro ao buscar times.');
        }

        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        setSearchError(err.message);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const handleSelectTeam = useCallback(async (team) => {
    setSelectedTeam(team);
    setLineup(null);
    setLineupError(null);
    setLoadingLineup(true);

    try {
      const response = await fetch(`/api/team-lineup?teamId=${team.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao buscar elenco.');
      }

      const data = await response.json();
      setLineup(data);
    } catch (err) {
      setLineupError(err.message);
    } finally {
      setLoadingLineup(false);
    }
  }, []);

  const handleApply = useCallback(() => {
    if (!lineup) return;

    const localTeam = findLocalTeam(lineup.team.name);

    const teamData = {
      name: localTeam?.name || lineup.team.name,
      shortName: localTeam?.shortName || lineup.team.shortName,
      primaryColor: localTeam?.primaryColor || lineup.team.primaryColor || '#14C96B',
      secondaryColor: localTeam?.secondaryColor || lineup.team.secondaryColor || '#FFFFFF',
      numberColor: localTeam?.numberColor || lineup.team.numberColor || '#FFFFFF',
      pattern: localTeam?.pattern || 'solid',
      formation: lineup.team.formation,
    };

    dispatch({
      type: 'LOAD_LIVE_TEAM',
      teamId,
      teamData,
      players: lineup.players,
    });

    onClose();
  }, [dispatch, lineup, onClose, teamId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
        style={{ backgroundColor: '#101F17' }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-accent" />
            <span className="font-display text-sm uppercase tracking-[0.18em] text-txt-primary">
              FotMob
            </span>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-txt-secondary transition-colors hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-white/[0.08] px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2">
            <Search size={14} className="flex-shrink-0 text-txt-secondary" />
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-sm text-txt-primary outline-none placeholder:text-txt-secondary/50"
              placeholder="Buscar clube ou selecao (ex: Brasil, Flamengo, Barcelona)"
              value={query}
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
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {!selectedTeam && results.length > 0 && (
            <div className="flex flex-col gap-1 p-2">
              {results.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <img
                    src={team.logo}
                    alt=""
                    className="h-9 w-9 flex-shrink-0 object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-txt-primary truncate">
                      {team.name}
                    </div>
                    <div className="text-xs text-txt-secondary">
                      {team.country || 'FotMob'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!selectedTeam &&
            !searching &&
            query.length >= 2 &&
            results.length === 0 &&
            !searchError && (
              <div className="px-4 py-8 text-center text-sm text-txt-secondary">
                Nenhum time encontrado para "{query}"
              </div>
            )}

          {!selectedTeam && query.length < 2 && (
            <div className="px-4 py-8 text-center text-sm text-txt-secondary">
              Digite o nome de um clube ou selecao para buscar lineup ou elenco atual.
            </div>
          )}

          {selectedTeam && (
            <div className="p-4">
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setLineup(null);
                  setLineupError(null);
                }}
                className="mb-3 cursor-pointer text-xs text-accent hover:underline"
              >
                ← Voltar aos resultados
              </button>

              <div className="mb-4 flex items-center gap-3">
                <img
                  src={selectedTeam.logo}
                  alt=""
                  className="h-10 w-10 object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />

                <div>
                  <div className="font-display text-sm uppercase tracking-[0.16em] text-txt-primary">
                    {selectedTeam.name}
                  </div>
                  <div className="text-xs text-txt-secondary">
                    {selectedTeam.country || 'FotMob'}
                  </div>
                </div>
              </div>

              {loadingLineup && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-txt-secondary">
                  <Loader2 size={16} className="animate-spin" />
                  Buscando elenco...
                </div>
              )}

              {lineupError && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-400/10 px-3 py-2 text-xs text-red-400">
                  <AlertCircle size={14} />
                  {lineupError}
                </div>
              )}

              {lineup && (
                <div className="space-y-3">
                  {lineup.fixture ? (
                    <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-txt-secondary">
                      <span className="font-semibold text-txt-primary">
                        {lineup.fixture.home} {lineup.fixture.score} {lineup.fixture.away}
                      </span>
                      {lineup.fixture.date && (
                        <span className="ml-2">
                          ({new Date(`${lineup.fixture.date}T00:00:00`).toLocaleDateString('pt-BR')})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-txt-secondary">
                      {lineup.team.isNationalTeam
                        ? 'Elenco atual da selecao'
                        : 'Elenco atual da temporada'}
                    </div>
                  )}

                  <div className="text-xs text-txt-secondary">
                    Formacao:{' '}
                    <span className="font-semibold text-txt-primary">
                      {getFormationLabel(lineup.team.formation)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {lineup.players.map((player, index) => (
                      <div
                        key={`${player.fotmobId || player.name}-${index}`}
                        className="flex items-center gap-2 rounded-xl px-2 py-1 text-xs hover:bg-white/5"
                      >
                        <span
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: lineup.team.primaryColor || '#14C96B',
                            color: lineup.team.numberColor || '#FFFFFF',
                          }}
                        >
                          {player.number}
                        </span>

                        <span className="flex-1 truncate font-medium text-txt-primary">
                          {player.name}
                        </span>
                        <span className="text-[10px] font-medium text-txt-secondary">
                          {player.position}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleApply}
                    className="mt-2 w-full cursor-pointer rounded-2xl bg-accent py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
                  >
                    Carregar no quadro
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
