import type { Opening } from '../types';
import staffordGambit from './stafford';
import danishGambitRefutation from './danishGambit';
import caroKann from './caroKann';

function createComingSoonOpening(id: string, name: string, playerColor: Opening['playerColor'] = 'white'): Opening {
  return {
    id,
    name,
    description: 'Coming soon.',
    playerColor,
    setupMoves: [],
    lines: [],
  };
}

const comingSoonOpenings: Opening[] = [
  createComingSoonOpening('sicilian-defense', 'Sicilian Defense', 'black'),
  createComingSoonOpening('ruy-lopez', 'Ruy Lopez', 'white'),
  createComingSoonOpening('queens-gambit', "Queen's Gambit", 'white'),
  createComingSoonOpening('london-system', 'London System', 'white'),
  createComingSoonOpening('kings-indian', "King's Indian Defense", 'black'),
  createComingSoonOpening('french-defense', 'French Defense', 'black'),
  createComingSoonOpening('vienna-game', 'Vienna Game', 'white'),
  createComingSoonOpening('english-opening', 'English Opening', 'white'),
  createComingSoonOpening('scotch-game', 'Scotch Game', 'white'),
];

export const OPENINGS: Opening[] = [
  staffordGambit,
  danishGambitRefutation,
  caroKann,
  ...comingSoonOpenings,
];

export function getOpeningById(id: string): Opening | undefined {
  return OPENINGS.find((o) => o.id === id);
}
