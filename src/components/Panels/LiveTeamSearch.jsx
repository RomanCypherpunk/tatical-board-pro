import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Search, Loader2, AlertCircle, Globe } from 'lucide-react';
import TEAMS_DB from '../../data/teamsDatabase';

/**
 * Modal overlay for searching real teams via API-Football
 * and loading their latest match lineup into the tactical board.
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

  // Debounced search
  const handleSearch = useCallback((value) => {
    setQuery(value);
    setSearchError(null);
    clearTimeout(debounceRef.current);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search-team?q=${encodeURIComponent(value)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Erro ao buscar times.');
        }
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        setSearchError(err.message);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, []);

  // Load lineup for selected team
  const handleSelectTeam = useCallback(async (team) => {
    setSelectedTeam(team);
    setLineupError(null);
    setLoadingLineup(true);
    setLineup(null);

    try {
      const res = await fetch(`/api/team-lineup?teamId=${team.id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao buscar escalação.');
      }
      const data = await res.json();
      setLineup(data);
    } catch (err) {
      setLineupError(err.message);
    } finally {
      setLoadingLineup(false);
    }
  }, []);

  // Apply lineup to the tactical board
  const handleApply = useCallback(() => {
    if (!lineup) return;

    // Cross-reference with local teams database for curated colors
    const localTeam = TEAMS_DB.find(
      (t) => t.name.toLowerCase() === lineup.team.name.toLowerCase()
    );

    const teamData = {
      name: lineup.team.name,
      shortName: localTeam?.shortName || lineup.team.shortName,
      primaryColor: localTeam?.primaryColor || lineup.team.primaryColor || '#E63946',
      secondaryColor: localTeam?.secondaryColor || lineup.team.secondaryColor || '#FFFFFF',
      numberColor: localTeam?.numberColor || lineup.team.numberColor || '#FFFFFF',
      formation: lineup.team.formation,
    };

    dispatch({
      type: 'LOAD_LIVE_TEAM',
      teamId,
      teamData,
      players: lineup.players,
    });

    onClose();
  }, [lineup, teamId, dispatch, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md mx-4 rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh]"
        style={{ backgroundColor: '#1A1D27' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-accent" />
            <span className="text-sm font-bold text-txt-primary">Buscar Escalação Real</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-txt-secondary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
            <Search size={14} className="text-txt-secondary flex-shrink-0" />
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-sm outline-none text-txt-primary placeholder:text-txt-secondary/50"
              placeholder="Buscar time (ex: Flamengo, Barcelona...)"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searching && <Loader2 size={14} className="text-accent animate-spin" />}
          </div>
          {searchError && (
            <div className="flex items-center gap-1.5 mt-2 text-red-400 text-xs">
              <AlertCircle size={12} />
              {searchError}
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Search results */}
          {!selectedTeam && results.length > 0 && (
            <div className="p-2 flex flex-col gap-0.5">
              {results.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left cursor-pointer w-full"
                >
                  <img
                    src={team.logo}
                    alt=""
                    className="w-8 h-8 object-contain flex-shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-txt-primary truncate">{team.name}</div>
                    <div className="text-xs text-txt-secondary">{team.country}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!selectedTeam && !searching && query.length >= 3 && results.length === 0 && !searchError && (
            <div className="px-4 py-8 text-center text-txt-secondary text-sm">
              Nenhum time encontrado para "{query}"
            </div>
          )}

          {/* Empty state */}
          {!selectedTeam && query.length < 3 && (
            <div className="px-4 py-8 text-center text-txt-secondary text-sm">
              Digite o nome de um time para buscar a escalação do último jogo oficial.
            </div>
          )}

          {/* Lineup preview */}
          {selectedTeam && (
            <div className="p-4">
              {/* Back button */}
              <button
                onClick={() => { setSelectedTeam(null); setLineup(null); setLineupError(null); }}
                className="text-xs text-accent hover:underline mb-3 cursor-pointer"
              >
                ← Voltar aos resultados
              </button>

              {/* Team header */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedTeam.logo}
                  alt=""
                  className="w-10 h-10 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <div className="text-sm font-bold text-txt-primary">{selectedTeam.name}</div>
                  <div className="text-xs text-txt-secondary">{selectedTeam.country}</div>
                </div>
              </div>

              {/* Loading */}
              {loadingLineup && (
                <div className="flex items-center gap-2 justify-center py-6 text-txt-secondary text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Buscando escalação...
                </div>
              )}

              {/* Error */}
              {lineupError && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 rounded-xl px-3 py-2">
                  <AlertCircle size={14} />
                  {lineupError}
                </div>
              )}

              {/* Lineup data */}
              {lineup && (
                <div className="space-y-3">
                  {/* Match info (if available) */}
                  {lineup.fixture ? (
                    <div className="bg-white/5 rounded-xl px-3 py-2 text-xs text-txt-secondary">
                      <span className="font-semibold text-txt-primary">
                        {lineup.fixture.home} {lineup.fixture.score} {lineup.fixture.away}
                      </span>
                      {lineup.fixture.date && (
                        <span className="ml-2">
                          ({new Date(lineup.fixture.date + 'T00:00:00').toLocaleDateString('pt-BR')})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-xl px-3 py-2 text-xs text-txt-secondary">
                      Elenco atual da temporada
                    </div>
                  )}

                  {/* Formation */}
                  <div className="text-xs text-txt-secondary">
                    Formação: <span className="font-semibold text-txt-primary">{lineup.team.formation}</span>
                  </div>

                  {/* Players list */}
                  <div className="space-y-0.5">
                    {lineup.players.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 text-xs">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{
                            backgroundColor: lineup.team.primaryColor || '#3B82F6',
                            color: lineup.team.numberColor || '#FFFFFF',
                          }}
                        >
                          {p.number}
                        </span>
                        <span className="flex-1 text-txt-primary font-medium truncate">{p.name}</span>
                        <span className="text-txt-secondary text-[10px] font-medium">{p.position}</span>
                      </div>
                    ))}
                  </div>

                  {/* Apply button */}
                  <button
                    onClick={handleApply}
                    className="w-full mt-2 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-bold transition-colors cursor-pointer"
                  >
                    Carregar Escalação
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
