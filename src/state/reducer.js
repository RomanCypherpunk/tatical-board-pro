import FORMATIONS from '../data/formations';

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
      const oldPlayers = state.teams[teamId].players;
      const newPlayers = f.positions.map((p, i) => ({
        ...oldPlayers[i],
        position: p.pos,
        x: p.x,
        y: isAway ? 100 - p.y : p.y,
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
        players.map((p) => ({ ...p, x: p.x, y: 100 - p.y }));
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
      const resetHome = state.teams.home.players.map((p, i) => ({
        ...p,
        x: homeF.positions[i].x,
        y: homeF.positions[i].y,
      }));
      const resetAway = state.teams.away.players.map((p, i) => ({
        ...p,
        x: awayF.positions[i].x,
        y: 100 - awayF.positions[i].y,
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

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}
