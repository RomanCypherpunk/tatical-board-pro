import FORMATIONS from '../data/formations';
import { DEFAULT_NAMES, DEFAULT_NUMBERS } from '../data/defaults';

/**
 * Creates the 11 players for a team based on a formation.
 * Away team players get y-flipped so they appear on the opposite half.
 */
export function createTeamPlayers(formation, isAway) {
  const f = FORMATIONS[formation];
  return f.positions.map((p, i) => ({
    id: (isAway ? 100 : 0) + i + 1,
    name: DEFAULT_NAMES[i] || `Jogador ${i + 1}`,
    number: DEFAULT_NUMBERS[i] || i + 1,
    position: p.pos,
    role: '',
    instruction: '',
    x: p.x,
    y: isAway ? 100 - p.y : p.y,
    isCaptain: i === 7,
    isKeyPlayer: false,
    colorOverride: null,
    direction: null,
  }));
}

export default function initialState() {
  return {
    teams: {
      home: {
        name: 'Time A',
        shortName: 'TMA',
        primaryColor: '#E63946',
        secondaryColor: '#FFFFFF',
        numberColor: '#FFFFFF',
        pattern: 'solid',
        formation: '4-3-3',
        players: createTeamPlayers('4-3-3', false),
      },
      away: {
        name: 'Time B',
        shortName: 'TMB',
        primaryColor: '#457B9D',
        secondaryColor: '#FFFFFF',
        numberColor: '#FFFFFF',
        pattern: 'solid',
        formation: '4-3-3',
        players: createTeamPlayers('4-3-3', true),
      },
    },
    arrows: [],
    ui: {
      viewMode: 'number',
      selectedPlayer: null,
      selectedTeam: 'home',
      pitchStyle: 'green',
      showLeftPanel: true,
      showRightPanel: true,
      showAwayTeam: true,
      arrowMode: null,
      eraserMode: false,
      arrowDrawing: null,
      selectedArrow: null,
      showPlayerEditor: false,
      showLiveSearch: null,
    },
  };
}
