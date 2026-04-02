import FORMATIONS from '../data/formations';
import initialState, { orientFormationPosition } from './initialState';

const POSITION_PREFERENCES = {
  GK: ['GK'],
  LB: ['LB', 'LWB', 'LM', 'LW', 'CB', 'RB'],
  RB: ['RB', 'RWB', 'RM', 'RW', 'CB', 'LB'],
  LWB: ['LWB', 'LB', 'LM', 'LW', 'CB'],
  RWB: ['RWB', 'RB', 'RM', 'RW', 'CB'],
  CB: ['CB', 'CDM', 'LB', 'RB', 'LWB', 'RWB'],
  CDM: ['CDM', 'CM', 'CAM', 'CB'],
  CM: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
  CAM: ['CAM', 'CM', 'CF', 'SS', 'ST'],
  LM: ['LM', 'LW', 'LWB', 'LB', 'CM'],
  RM: ['RM', 'RW', 'RWB', 'RB', 'CM'],
  LW: ['LW', 'LM', 'LWB', 'LB', 'CF', 'ST'],
  RW: ['RW', 'RM', 'RWB', 'RB', 'CF', 'ST'],
  CF: ['CF', 'ST', 'SS', 'CAM', 'LW', 'RW'],
  SS: ['SS', 'CF', 'ST', 'CAM'],
  ST: ['ST', 'CF', 'SS', 'CAM', 'LW', 'RW'],
};

function mergeLoadedState(loadedState) {
  const baseState = initialState();

  return {
    ...baseState,
    ...loadedState,
    teams: {
      home: {
        ...baseState.teams.home,
        ...loadedState?.teams?.home,
        players: loadedState?.teams?.home?.players || baseState.teams.home.players,
      },
      away: {
        ...baseState.teams.away,
        ...loadedState?.teams?.away,
        players: loadedState?.teams?.away?.players || baseState.teams.away.players,
      },
    },
    arrows: Array.isArray(loadedState?.arrows) ? loadedState.arrows : baseState.arrows,
    ui: {
      ...baseState.ui,
      ...loadedState?.ui,
    },
  };
}

function normalizePosition(position) {
  return String(position || '').trim().toUpperCase();
}

function getPositionScore(slotPosition, playerPosition) {
  const slot = normalizePosition(slotPosition);
  const player = normalizePosition(playerPosition);
  const preferences = POSITION_PREFERENCES[slot] || [slot];
  const exactMatchIndex = preferences.indexOf(player);

  if (exactMatchIndex !== -1) return exactMatchIndex;
  if (!player) return Number.POSITIVE_INFINITY;

  if (['CM', 'CDM', 'CAM'].includes(slot) && ['CM', 'CDM', 'CAM'].includes(player)) {
    return preferences.length + 1;
  }

  if (['LW', 'LM'].includes(slot) && ['LW', 'LM', 'LWB', 'LB'].includes(player)) {
    return preferences.length + 2;
  }

  if (['RW', 'RM'].includes(slot) && ['RW', 'RM', 'RWB', 'RB'].includes(player)) {
    return preferences.length + 2;
  }

  if (['CF', 'SS', 'ST'].includes(slot) && ['CF', 'SS', 'ST', 'CAM'].includes(player)) {
    return preferences.length + 3;
  }

  return Number.POSITIVE_INFINITY;
}

function orderPlayersForFormation(players, formation) {
  const slots = FORMATIONS[formation]?.positions || [];
  const pool = Array.isArray(players)
    ? players.map((player, index) => ({ ...player, __originalIndex: index }))
    : [];

  // Pre-calculate best available score per slot so that slots with exact
  // matches (score = 0) are processed before slots that need approximate
  // matching. This avoids a greedy slot stealing a perfect-match player
  // from a later slot (e.g., LW stealing the ST before the ST slot runs).
  const slotOrder = slots.map((slot, idx) => {
    let best = Number.POSITIVE_INFINITY;
    for (const candidate of pool) {
      if (!candidate) continue;
      const s = getPositionScore(slot.pos, candidate.position);
      if (s < best) best = s;
    }
    return { idx, best };
  });
  slotOrder.sort((a, b) => a.best - b.best || a.idx - b.idx);

  const result = new Array(slots.length).fill(null);

  for (const { idx } of slotOrder) {
    const slot = slots[idx];
    let bestPoolIndex = -1;
    let bestScore = Number.POSITIVE_INFINITY;

    pool.forEach((candidate, candidateIndex) => {
      if (!candidate) return;

      const score = getPositionScore(slot.pos, candidate.position);
      const currentBest = bestPoolIndex === -1 ? null : pool[bestPoolIndex];

      if (
        score < bestScore ||
        (score === bestScore &&
          currentBest &&
          candidate.__originalIndex < currentBest.__originalIndex)
      ) {
        bestScore = score;
        bestPoolIndex = candidateIndex;
      }
    });

    if (bestPoolIndex === -1 || !Number.isFinite(bestScore)) {
      bestPoolIndex = pool.findIndex(Boolean);
    }

    if (bestPoolIndex === -1) continue;

    const selected = pool[bestPoolIndex];
    pool[bestPoolIndex] = null;
    if (!selected) continue;

    const { __originalIndex, ...player } = selected;
    result[idx] = player;
  }

  return result;
}

export default function reducer(state, action) {
  switch (action.type) {
    case 'SET_TEAM_FIELD': {
      const { teamId, field, value } = action;
      return {
        ...state,
        teams: {
          ...state.teams,
          [teamId]: { ...state.teams[teamId], [field]: value },
        },
      };
    }

    case 'SET_FORMATION': {
      const { teamId, formation } = action;
      const isAway = teamId === 'away';
      const f = FORMATIONS[formation];
      const oldPlayers = orderPlayersForFormation(state.teams[teamId].players, formation);
      const newPlayers = f.positions.map((p, i) => ({
        ...oldPlayers[i],
        position: p.pos,
        ...orientFormationPosition(p, isAway),
      }));
      return {
        ...state,
        teams: {
          ...state.teams,
          [teamId]: { ...state.teams[teamId], formation, players: newPlayers },
        },
      };
    }

    case 'UPDATE_PLAYER': {
      const { teamId, playerId, updates } = action;
      const players = state.teams[teamId].players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      );
      return {
        ...state,
        teams: {
          ...state.teams,
          [teamId]: { ...state.teams[teamId], players },
        },
      };
    }

    case 'MOVE_PLAYER': {
      const { teamId, playerId, x, y } = action;
      const players = state.teams[teamId].players.map((p) =>
        p.id === playerId ? { ...p, x, y } : p
      );
      return {
        ...state,
        teams: {
          ...state.teams,
          [teamId]: { ...state.teams[teamId], players },
        },
      };
    }

    case 'SET_CAPTAIN': {
      // Enforce single captain per team — unset all others, set the target
      const { teamId, playerId } = action;
      const players = state.teams[teamId].players.map((p) => ({
        ...p,
        isCaptain: p.id === playerId ? !p.isCaptain : false,
      }));
      return {
        ...state,
        teams: {
          ...state.teams,
          [teamId]: { ...state.teams[teamId], players },
        },
      };
    }

    case 'SET_UI':
      return { ...state, ui: { ...state.ui, ...action.updates } };

    case 'ADD_ARROW':
      return { ...state, arrows: [...state.arrows, action.arrow] };

    case 'REMOVE_ARROW':
      return {
        ...state,
        arrows: state.arrows.filter((a) => a.id !== action.id),
        ui: { ...state.ui, selectedArrow: state.ui.selectedArrow === action.id ? null : state.ui.selectedArrow },
      };

    case 'UPDATE_ARROW': {
      const { arrowId, updates } = action;
      return {
        ...state,
        arrows: state.arrows.map((a) => (a.id === arrowId ? { ...a, ...updates } : a)),
      };
    }

    case 'CLEAR_ARROWS':
      return { ...state, arrows: [], ui: { ...state.ui, selectedArrow: null } };

    case 'FLIP_SIDES': {
      const flipPlayers = (players) =>
        players.map((p) => ({ ...p, x: 100 - p.x, y: 100 - p.y }));
      return {
        ...state,
        teams: {
          home: { ...state.teams.home, players: flipPlayers(state.teams.home.players) },
          away: { ...state.teams.away, players: flipPlayers(state.teams.away.players) },
        },
      };
    }

    case 'RESET_POSITIONS': {
      const homeF = FORMATIONS[state.teams.home.formation];
      const awayF = FORMATIONS[state.teams.away.formation];
      const orderedHomePlayers = orderPlayersForFormation(
        state.teams.home.players,
        state.teams.home.formation
      );
      const orderedAwayPlayers = orderPlayersForFormation(
        state.teams.away.players,
        state.teams.away.formation
      );
      const resetHome = orderedHomePlayers.map((p, i) => ({
        ...state.teams.home.players[i],
        ...p,
        ...orientFormationPosition(homeF.positions[i], false),
      }));
      const resetAway = orderedAwayPlayers.map((p, i) => ({
        ...state.teams.away.players[i],
        ...p,
        ...orientFormationPosition(awayF.positions[i], true),
      }));
      return {
        ...state,
        teams: {
          home: { ...state.teams.home, players: resetHome },
          away: { ...state.teams.away, players: resetAway },
        },
      };
    }

    case 'REORDER_PLAYER': {
      const { teamId, playerId, direction } = action;
      const players = [...state.teams[teamId].players];
      const idx = players.findIndex((p) => p.id === playerId);
      if (idx === -1) return state;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= players.length) return state;
      [players[idx], players[newIdx]] = [players[newIdx], players[idx]];
      return {
        ...state,
        teams: {
          ...state.teams,
          [teamId]: { ...state.teams[teamId], players },
        },
      };
    }

    case 'LOAD_LIVE_TEAM': {
      const { teamId, teamData, players: apiPlayers } = action;
      const isAway = teamId === 'away';
      const resolvedFormation = FORMATIONS[teamData.formation] ? teamData.formation : '4-3-3';
      const f = FORMATIONS[resolvedFormation];
      const idOffset = isAway ? 100 : 0;
      const orderedApiPlayers = orderPlayersForFormation(apiPlayers, resolvedFormation);

      const newPlayers = f.positions.map((pos, i) => ({
        id: idOffset + i + 1,
        name: orderedApiPlayers[i]?.name || `Jogador ${i + 1}`,
        number: orderedApiPlayers[i]?.number || i + 1,
        fotmobId: orderedApiPlayers[i]?.fotmobId || null,
        position: orderedApiPlayers[i]?.position || pos.pos,
        role: '',
        instruction: '',
        ...orientFormationPosition(pos, isAway),
        isCaptain: false,
        isKeyPlayer: false,
        colorOverride: null,
        direction: null,
      }));

      return {
        ...state,
        teams: {
          ...state.teams,
          [teamId]: {
            ...state.teams[teamId],
            name: teamData.name,
            shortName: teamData.shortName,
            primaryColor: teamData.primaryColor,
            secondaryColor: teamData.secondaryColor,
            numberColor: teamData.numberColor,
            pattern: teamData.pattern || state.teams[teamId].pattern,
            formation: resolvedFormation,
            players: newPlayers,
          },
        },
      };
    }

    case 'LOAD_STATE':
      return mergeLoadedState(action.state);

    default:
      return state;
  }
}
