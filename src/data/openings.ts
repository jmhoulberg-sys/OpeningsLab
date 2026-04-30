import type { Opening } from '../types';
import staffordGambit from './stafford';
import danishGambitRefutation from './danishGambit';
import caroKann from './caroKann';
import { scotchGambit, scotchGame } from './scotch';
import sicilianDefense from './sicilian';
import ruyLopez from './ruyLopez';
import queensGambit from './queensGambit';
import kingsIndianDefense from './kingsIndian';
import frenchDefense from './french';
import sicilianForWhite from './sicilianWhite';

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
  createComingSoonOpening('london-system', 'London System', 'white'),
  createComingSoonOpening('vienna-game', 'Vienna Game', 'white'),
  createComingSoonOpening('english-opening', 'English Opening', 'white'),
];

export const OPENINGS: Opening[] = [
  staffordGambit,
  scotchGambit,
  scotchGame,
  danishGambitRefutation,
  sicilianForWhite,
  caroKann,
  sicilianDefense,
  ruyLopez,
  queensGambit,
  kingsIndianDefense,
  frenchDefense,
  ...comingSoonOpenings,
];

export function getOpeningById(id: string): Opening | undefined {
  return OPENINGS.find((o) => o.id === id);
}
