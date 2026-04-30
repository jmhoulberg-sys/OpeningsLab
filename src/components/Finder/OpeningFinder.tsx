import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Home, RotateCcw, Sparkles } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import { Chess } from 'chess.js';
import type { Color, Opening, OpeningLine } from '../../types';
import { OPENINGS } from '../../data/openings';
import { STARTING_FEN, applyMove, fenAfterMoves } from '../../engine/chessEngine';

const WOOD_LIGHT = '#e6d0a9';
const WOOD_DARK = '#9b6a3c';
const NORMALIZE_RE = /[+#!?]/g;

interface OpeningFinderProps {
  onBack: () => void;
  onStartPractice: (opening: Opening, line: OpeningLine) => void;
}

interface LocalLineMatch {
  opening: Opening;
  line: OpeningLine;
  nextSan: string | null;
  matchedMoves: number;
  exactPath: boolean;
}

interface RouteMoveChoice {
  san: string;
  sources: string[];
  practiceTargets: number;
}

type CatalogBranch = {
  id: string;
  name: string;
  path: string[];
  color: Color | 'both';
  description: string;
  generic?: boolean;
};

const CATALOG_BRANCHES: CatalogBranch[] = [
  { id: 'kings-pawn', name: "King's Pawn Game", path: ['e4'], color: 'both', generic: true, description: 'The main gateway to open games, Sicilians, French, Caro-Kann, and more.' },
  { id: 'queens-pawn', name: "Queen's Pawn Game", path: ['d4'], color: 'both', generic: true, description: 'The main gateway to Queen’s Gambits, Indian Defenses, London setups, and Stonewall ideas.' },
  { id: 'english-opening', name: 'English Opening', path: ['c4'], color: 'white', description: 'White starts from the flank and often reaches reversed Sicilian or Catalan-like structures.' },
  { id: 'reti-opening', name: 'Reti Opening', path: ['Nf3', 'd5', 'c4'], color: 'white', description: 'A flexible hypermodern setup that pressures the center instead of occupying it immediately.' },
  { id: 'anti-reti-d4', name: 'Reti: ...d4 Space Grab', path: ['Nf3', 'd5', 'c4', 'd4'], color: 'black', description: 'Black grabs space before White can fully unwind the flank pressure.' },
  { id: 'birds-opening', name: "Bird's Opening", path: ['f4'], color: 'white', description: 'White stakes kingside space and can steer toward Dutch-like attacking structures.' },
  { id: 'froms-gambit', name: "From's Gambit vs Bird", path: ['f4', 'e5'], color: 'black', description: 'Black immediately challenges Bird’s Opening with a forcing central gambit.' },
  { id: 'nimzowitsch-larsen', name: 'Nimzowitsch-Larsen Attack', path: ['b3'], color: 'white', description: 'White fianchettoes early and pressures the long diagonal.' },
  { id: 'anti-larsen-e5', name: 'Nimzowitsch-Larsen: ...e5 Setup', path: ['b3', 'e5', 'Bb2', 'Nc6'], color: 'black', description: 'Black builds a classical center before White’s bishop pressure becomes annoying.' },
  { id: 'sokolsky-opening', name: 'Sokolsky Opening', path: ['b4'], color: 'white', description: 'A queenside flank opening that gains space and asks Black to react immediately.' },
  { id: 'anti-sokolsky-e5', name: 'Sokolsky: ...e5 and ...Bxb4', path: ['b4', 'e5', 'Bb2', 'Bxb4'], color: 'black', description: 'Black strikes the center and can often take the b-pawn after the e-pawn clears the bishop.' },
  { id: 'grobs-attack', name: "Grob's Attack", path: ['g4'], color: 'white', description: 'A provocative flank opening with tactical ambitions and real structural risk.' },
  { id: 'anti-grob-d5', name: 'Grob Refutation: ...d5 and ...Bxg4', path: ['g4', 'd5', 'Bg2', 'Bxg4'], color: 'black', description: 'Black occupies the center and can win the advanced g-pawn once the diagonal opens.' },
  { id: 'van-geet-opening', name: 'Van Geet Opening', path: ['Nc3'], color: 'white', description: 'White develops first and keeps the central pawn structure undecided.' },
  { id: 'anti-van-geet-d5', name: 'Van Geet: ...d5 and ...d4', path: ['Nc3', 'd5', 'e4', 'd4'], color: 'black', description: 'Black claims space and pushes the knight around after White commits to e4.' },
  { id: 'polish-defense', name: 'Polish Defense', path: ['d4', 'b5'], color: 'black', description: 'Black fights from the queenside with an offbeat pawn thrust.' },
  { id: 'anti-polish-e4', name: 'Polish Defense: e4 Center', path: ['d4', 'b5', 'e4', 'Bb7', 'Bd3'], color: 'white', description: 'White takes the center and develops before Black’s queenside idea becomes useful.' },
  { id: 'owen-defense', name: "Owen's Defense", path: ['e4', 'b6'], color: 'black', description: 'Black fianchettoes the queen bishop and pressures e4 from the flank.' },
  { id: 'anti-owen-d4', name: "Owen's Defense: d4 and Bd3", path: ['e4', 'b6', 'd4', 'Bb7', 'Bd3'], color: 'white', description: 'White builds a full center and covers e4 before Black’s bishop pressure bites.' },
  { id: 'st-george-defense', name: 'St. George Defense', path: ['e4', 'a6'], color: 'black', description: 'A provocative queenside setup that often follows with ...b5.' },
  { id: 'anti-st-george-d4', name: 'St. George: d4 and Nf3', path: ['e4', 'a6', 'd4', 'b5', 'Nf3'], color: 'white', description: 'White occupies the center while Black spends tempi on queenside pawns.' },
  { id: 'nimzowitsch-defense', name: 'Nimzowitsch Defense', path: ['e4', 'Nc6'], color: 'black', description: 'Black develops first and challenges White to define the center.' },
  { id: 'modern-defense', name: 'Modern Defense', path: ['e4', 'g6'], color: 'black', description: 'Black lets White build a center, then attacks it with piece pressure and pawn breaks.' },
  { id: 'anti-modern-austrian', name: 'Modern Defense: Austrian Setup', path: ['e4', 'g6', 'd4', 'Bg7', 'Nc3', 'd6', 'f4'], color: 'white', description: 'White builds a broad attacking center with the same aggressive idea used against the Pirc.' },
  { id: 'pirc-defense', name: 'Pirc Defense', path: ['e4', 'd6', 'd4', 'Nf6'], color: 'black', description: 'Black delays central contact and strikes at White’s broad pawn center.' },
  { id: 'pirc-austrian', name: 'Pirc Austrian Attack', path: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'f4'], color: 'white', description: 'White uses f4 to build a massive center and make Black prove the hypermodern setup.' },
  { id: 'philidor-defense', name: 'Philidor Defense', path: ['e4', 'e5', 'Nf3', 'd6'], color: 'black', description: 'Black supports e5 solidly and accepts a compact position.' },
  { id: 'anti-philidor-d4', name: 'Philidor: 3.d4 Challenge', path: ['e4', 'e5', 'Nf3', 'd6', 'd4'], color: 'white', description: 'White immediately asks whether Black can hold the center without falling behind in development.' },
  { id: 'petrov-defense', name: 'Petrov Defense', path: ['e4', 'e5', 'Nf3', 'Nf6'], color: 'black', description: 'A symmetrical counterattack on e4 with a reputation for solidity.' },
  { id: 'petrov-classical-d4', name: 'Petrov Classical: d4', path: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4'], color: 'white', description: 'White accepts the symmetry, then takes central space after the knight exchange.' },
  { id: 'latvian-gambit', name: 'Latvian Gambit', path: ['e4', 'e5', 'Nf3', 'f5'], color: 'black', description: 'Black immediately gambits for initiative in a sharp open game.' },
  { id: 'anti-latvian-nxe5', name: 'Latvian Gambit Refutation: Nxe5', path: ['e4', 'e5', 'Nf3', 'f5', 'Nxe5'], color: 'white', description: 'White accepts the tactical challenge and attacks Black’s exposed center.' },
  { id: 'elephant-gambit', name: 'Elephant Gambit', path: ['e4', 'e5', 'Nf3', 'd5'], color: 'black', description: 'Black challenges the center at once and invites tactical play.' },
  { id: 'anti-elephant-exd5', name: 'Elephant Gambit: exd5', path: ['e4', 'e5', 'Nf3', 'd5', 'exd5'], color: 'white', description: 'White takes the center pawn and forces Black to justify the early pawn break.' },
  { id: 'vienna-game', name: 'Vienna Game', path: ['e4', 'e5', 'Nc3'], color: 'white', description: 'White develops the queen knight first and keeps f4 attacking ideas available.' },
  { id: 'bishops-opening', name: "Bishop's Opening", path: ['e4', 'e5', 'Bc4'], color: 'white', description: 'White targets f7 immediately and can transpose to Italian or Vienna structures.' },
  { id: 'kings-gambit', name: "King's Gambit", path: ['e4', 'e5', 'f4'], color: 'white', description: 'White sacrifices a flank pawn to pull Black’s center apart and accelerate development.' },
  { id: 'falkbeer-countergambit', name: 'Falkbeer Countergambit vs King’s Gambit', path: ['e4', 'e5', 'f4', 'd5'], color: 'black', description: 'Black counters in the center instead of passively accepting White’s attacking script.' },
  { id: 'center-game', name: 'Center Game', path: ['e4', 'e5', 'd4'], color: 'white', description: 'White opens the center immediately and accepts early queen activity.' },
  { id: 'anti-center-game-nc6', name: 'Center Game: ...Nc6 Tempo', path: ['e4', 'e5', 'd4', 'exd4', 'Qxd4', 'Nc6'], color: 'black', description: 'Black develops with tempo against White’s early queen.' },
  { id: 'danish-gambit', name: 'Danish Gambit', path: ['e4', 'e5', 'd4', 'exd4', 'c3'], color: 'white', description: 'White offers pawns for open diagonals and rapid piece activity.' },
  { id: 'anti-danish-d5', name: 'Danish Gambit: ...d5 Break', path: ['e4', 'e5', 'd4', 'exd4', 'c3', 'd5'], color: 'black', description: 'Black returns central tension immediately and refuses to let White attack for free.' },
  { id: 'ponziani-opening', name: 'Ponziani Opening', path: ['e4', 'e5', 'Nf3', 'Nc6', 'c3'], color: 'white', description: 'White prepares d4 with a direct central build.' },
  { id: 'ponziani-jaenisch', name: 'Ponziani: Jaenisch Counterattack', path: ['e4', 'e5', 'Nf3', 'Nc6', 'c3', 'Nf6'], color: 'black', description: 'Black immediately attacks e4, using the fact that White’s c-pawn blocks Nc3.' },
  { id: 'ponziani-d5', name: 'Ponziani: ...d5 Equalizer', path: ['e4', 'e5', 'Nf3', 'Nc6', 'c3', 'd5'], color: 'black', description: 'Black challenges the center at once, one of the most direct counters to the Ponziani.' },
  { id: 'ponziani-f5', name: 'Ponziani Countergambit', path: ['e4', 'e5', 'Nf3', 'Nc6', 'c3', 'f5'], color: 'black', description: 'Black offers a pawn for fast activity and pressure against White’s center.' },
  { id: 'italian-game', name: 'Italian Game', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], color: 'white', description: 'White develops naturally and points the bishop at f7.' },
  { id: 'giuoco-piano', name: 'Giuoco Piano', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'], color: 'both', description: 'A classical Italian structure with natural development and central tension.' },
  { id: 'evans-gambit', name: 'Evans Gambit', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'], color: 'white', description: 'White sacrifices a pawn to drag the bishop away and seize the center.' },
  { id: 'evans-accepted', name: 'Evans Gambit Accepted', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4', 'Bxb4'], color: 'black', description: 'Black accepts the pawn and must be ready to meet White’s rapid central build.' },
  { id: 'two-knights-defense', name: 'Two Knights Defense', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'], color: 'black', description: 'Black develops actively and invites sharp play around f7 and e4.' },
  { id: 'anti-fried-liver-na5', name: 'Anti-Fried Liver: 5...Na5', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Na5'], color: 'black', description: 'Black avoids the classic Fried Liver sacrifice by hitting the bishop instead of grabbing on d5.' },
  { id: 'fried-liver-attack', name: 'Fried Liver Attack', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7'], color: 'white', description: 'White sacrifices on f7 to expose the black king in a forcing attack.' },
  { id: 'four-knights-game', name: 'Four Knights Game', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6'], color: 'both', description: 'Both sides develop knights first and keep the center flexible.' },
  { id: 'scotch-game', name: 'Scotch Game', path: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'], color: 'white', description: 'White opens the center early and makes development concrete.' },
  { id: 'scotch-gambit', name: 'Scotch Gambit', path: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Bc4'], color: 'white', description: 'White mixes Scotch central play with Italian attacking development.' },
  { id: 'ruy-lopez', name: 'Ruy Lopez', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], color: 'white', description: 'Classical pressure on the e5 pawn and Black knight.' },
  { id: 'berlin-defense', name: 'Berlin Defense', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'], color: 'black', description: 'Black attacks e4 immediately and heads for resilient structures.' },
  { id: 'morphy-defense', name: 'Ruy Lopez: Morphy Defense', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'], color: 'black', description: 'Black questions the bishop and begins the main Ruy Lopez conversation.' },
  { id: 'exchange-ruy', name: 'Ruy Lopez Exchange', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6'], color: 'white', description: 'White gives up the bishop pair to damage Black’s queenside structure.' },
  { id: 'marshall-attack', name: 'Marshall Attack', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'O-O', 'c3', 'd5'], color: 'black', description: 'Black sacrifices central material for a direct kingside initiative.' },
  { id: 'sicilian-defense', name: 'Sicilian Defense', path: ['e4', 'c5'], color: 'black', description: 'Black creates an asymmetrical fight and contests d4 from the flank.' },
  { id: 'open-sicilian', name: 'Open Sicilian', path: ['e4', 'c5', 'Nf3', 'd6', 'd4'], color: 'white', description: 'White opens the center and asks Black to choose a Sicilian structure.' },
  { id: 'alapin', name: 'Alapin Sicilian', path: ['e4', 'c5', 'c3'], color: 'white', description: 'A direct center-building route against the Sicilian.' },
  { id: 'closed-sicilian', name: 'Closed Sicilian', path: ['e4', 'c5', 'Nc3'], color: 'white', description: 'Keep the center closed and build kingside pressure.' },
  { id: 'smith-morra', name: 'Smith-Morra Gambit', path: ['e4', 'c5', 'd4'], color: 'white', description: 'A pawn sacrifice for fast development and open files.' },
  { id: 'grand-prix-attack', name: 'Grand Prix Attack', path: ['e4', 'c5', 'Nc3', 'Nc6', 'f4'], color: 'white', description: 'White aims for a fast kingside attack against the Sicilian.' },
  { id: 'najdorf', name: 'Sicilian Najdorf', path: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'], color: 'black', description: 'Black uses ...a6 for flexible queenside control and rich counterplay.' },
  { id: 'dragon', name: 'Sicilian Dragon', path: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'], color: 'black', description: 'Black fianchettoes and plays for long diagonal pressure.' },
  { id: 'scheveningen', name: 'Sicilian Scheveningen', path: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e6'], color: 'black', description: 'Black builds a compact ...e6/...d6 center.' },
  { id: 'sveshnikov', name: 'Sicilian Sveshnikov', path: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e5'], color: 'black', description: 'Black accepts long-term holes for dynamic piece activity.' },
  { id: 'taimanov', name: 'Sicilian Taimanov', path: ['e4', 'c5', 'Nf3', 'e6', 'd4', 'cxd4', 'Nxd4', 'Nc6'], color: 'black', description: 'Black develops flexibly with ...e6 and ...Nc6.' },
  { id: 'kan-sicilian', name: 'Sicilian Kan', path: ['e4', 'c5', 'Nf3', 'e6', 'd4', 'cxd4', 'Nxd4', 'a6'], color: 'black', description: 'Black uses ...a6 early to control b5 and choose a setup later.' },
  { id: 'accelerated-dragon', name: 'Accelerated Dragon', path: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'g6'], color: 'black', description: 'Black fianchettoes quickly and often avoids early ...d6.' },
  { id: 'french-defense', name: 'French Defense', path: ['e4', 'e6'], color: 'black', description: 'A compact center with ...d5 and long-term pawn-chain play.' },
  { id: 'french-advance', name: 'French Advance', path: ['e4', 'e6', 'd4', 'd5', 'e5'], color: 'white', description: 'White gains space and locks the center.' },
  { id: 'french-exchange', name: 'French Exchange', path: ['e4', 'e6', 'd4', 'd5', 'exd5'], color: 'white', description: 'White simplifies the center and heads for symmetrical structures.' },
  { id: 'french-tarrasch', name: 'French Tarrasch', path: ['e4', 'e6', 'd4', 'd5', 'Nd2'], color: 'white', description: 'White supports e4 and avoids some Winawer pins.' },
  { id: 'french-w.advance', name: 'French Winawer', path: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'], color: 'black', description: 'Black pins the knight and creates imbalanced pawn structures.' },
  { id: 'caro-kann-defense', name: 'Caro-Kann Defense', path: ['e4', 'c6'], color: 'black', description: 'Solid development around ...d5 and a durable pawn structure.' },
  { id: 'caro-advance', name: 'Caro-Kann Advance', path: ['e4', 'c6', 'd4', 'd5', 'e5'], color: 'white', description: 'White claims space and asks Black to undermine it.' },
  { id: 'caro-classical', name: 'Caro-Kann Classical', path: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'], color: 'black', description: 'Black develops the light bishop before closing the structure.' },
  { id: 'scandinavian-defense', name: 'Scandinavian Defense', path: ['e4', 'd5'], color: 'black', description: 'Black challenges e4 immediately and accepts early queen development.' },
  { id: 'scandinavian-main-nc3', name: 'Scandinavian Main Line: 3.Nc3', path: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3'], color: 'white', description: 'White hits the early queen with tempo and develops naturally.' },
  { id: 'scandinavian-nf3', name: 'Scandinavian: 3.Nf3 Setup', path: ['e4', 'd5', 'exd5', 'Qxd5', 'Nf3'], color: 'white', description: 'A flexible setup that delays Nc3 and keeps development smooth.' },
  { id: 'scandinavian-d4', name: 'Scandinavian: 3.d4 Center', path: ['e4', 'd5', 'exd5', 'Qxd5', 'd4'], color: 'white', description: 'White takes central space and develops with a broad pawn center.' },
  { id: 'scandinavian-modern-d4', name: 'Modern Scandinavian: 3.d4', path: ['e4', 'd5', 'exd5', 'Nf6', 'd4'], color: 'white', description: 'White builds the center against the delayed recapture setup.' },
  { id: 'scandinavian-modern-c4', name: 'Modern Scandinavian: 3.c4', path: ['e4', 'd5', 'exd5', 'Nf6', 'c4'], color: 'white', description: 'White tries to hold the extra pawn and asks Black to prove compensation.' },
  { id: 'scandinavian-portuguese-f3', name: 'Portuguese Scandinavian: 4.f3', path: ['e4', 'd5', 'exd5', 'Nf6', 'd4', 'Bg4', 'f3'], color: 'white', description: 'White challenges the bishop and grabs space in a sharp Modern Scandinavian branch.' },
  { id: 'alekhine-defense', name: 'Alekhine Defense', path: ['e4', 'Nf6'], color: 'black', description: 'Black invites White forward and attacks the overextended center later.' },
  { id: 'queens-gambit', name: "Queen's Gambit", path: ['d4', 'd5', 'c4'], color: 'white', description: 'Pressure Black central pawn structure from move two.' },
  { id: 'qga', name: "Queen's Gambit Accepted", path: ['d4', 'd5', 'c4', 'dxc4'], color: 'black', description: 'Black accepts the pawn and makes White prove compensation.' },
  { id: 'qgd', name: "Queen's Gambit Declined", path: ['d4', 'd5', 'c4', 'e6'], color: 'black', description: 'Black supports d5 and builds a solid classical defense.' },
  { id: 'slav-defense', name: 'Slav Defense', path: ['d4', 'd5', 'c4', 'c6'], color: 'black', description: 'Black supports d5 while keeping the light bishop free.' },
  { id: 'semi-slav', name: 'Semi-Slav Defense', path: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'e6'], color: 'black', description: 'Black combines Slav structure with Queen’s Gambit Declined solidity.' },
  { id: 'chigorin-defense', name: 'Chigorin Defense', path: ['d4', 'd5', 'c4', 'Nc6'], color: 'black', description: 'Black prioritizes piece pressure over a traditional pawn structure.' },
  { id: 'albin-countergambit', name: 'Albin Countergambit', path: ['d4', 'd5', 'c4', 'e5'], color: 'black', description: 'Black sacrifices a pawn for central disruption.' },
  { id: 'anti-albin-g3', name: 'Albin Countergambit: g3 Setup', path: ['d4', 'd5', 'c4', 'e5', 'dxe5', 'd4', 'Nf3', 'Nc6', 'g3'], color: 'white', description: 'White develops calmly and prepares to challenge Black’s advanced d-pawn.' },
  { id: 'tarrasch-defense', name: 'Tarrasch Defense', path: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'c5'], color: 'black', description: 'Black accepts an isolated queen pawn for active piece play.' },
  { id: 'catalan-opening', name: 'Catalan Opening', path: ['d4', 'Nf6', 'c4', 'e6', 'g3'], color: 'white', description: 'White combines queen-pawn pressure with a kingside fianchetto.' },
  { id: 'london-system', name: 'London System', path: ['d4', 'd5', 'Bf4'], color: 'white', description: 'White builds a reliable structure around Bf4, e3, and Nf3.' },
  { id: 'colle-system', name: 'Colle System', path: ['d4', 'd5', 'Nf3', 'Nf6', 'e3'], color: 'white', description: 'White builds quietly and prepares central expansion.' },
  { id: 'stonewall-attack', name: 'Stonewall Attack', path: ['d4', 'd5', 'e3', 'Nf6', 'Bd3'], color: 'white', description: 'White aims for a sturdy central wall and kingside attacking chances.' },
  { id: 'trompowsky', name: 'Trompowsky Attack', path: ['d4', 'Nf6', 'Bg5'], color: 'white', description: 'White immediately questions the knight and avoids mainline Indian defenses.' },
  { id: 'veresov', name: 'Veresov Attack', path: ['d4', 'd5', 'Nc3', 'Nf6', 'Bg5'], color: 'white', description: 'White develops actively and pressures the center with pieces.' },
  { id: 'benoni-defense', name: 'Benoni Defense', path: ['d4', 'Nf6', 'c4', 'c5'], color: 'black', description: 'Black challenges White’s center and accepts dynamic pawn imbalances.' },
  { id: 'modern-benoni', name: 'Modern Benoni', path: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e6'], color: 'black', description: 'Black invites a space disadvantage in exchange for queenside and central breaks.' },
  { id: 'anti-modern-benoni-f4', name: 'Modern Benoni: Flick-Knife Setup', path: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e6', 'Nc3', 'exd5', 'cxd5', 'd6', 'e4', 'g6', 'f4'], color: 'white', description: 'White grabs space and prepares a direct kingside/central clamp.' },
  { id: 'benko-gambit', name: 'Benko Gambit', path: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5'], color: 'black', description: 'Black sacrifices a queenside pawn for long-term file pressure.' },
  { id: 'benko-accepted', name: 'Benko Gambit Accepted', path: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5', 'cxb5', 'a6', 'bxa6'], color: 'white', description: 'White accepts the material and must be ready to neutralize Black’s queenside pressure.' },
  { id: 'budapest-gambit', name: 'Budapest Gambit', path: ['d4', 'Nf6', 'c4', 'e5'], color: 'black', description: 'Black offers a pawn to disrupt White’s queen-pawn setup.' },
  { id: 'anti-budapest-bf4', name: 'Budapest Gambit: Bf4', path: ['d4', 'Nf6', 'c4', 'e5', 'dxe5', 'Ng4', 'Bf4'], color: 'white', description: 'White develops while holding the extra pawn and covering key central squares.' },
  { id: 'kings-indian-defense', name: "King's Indian Defense", path: ['d4', 'Nf6', 'c4', 'g6'], color: 'black', description: 'Let White build the center, then strike it later.' },
  { id: 'grunfeld-defense', name: 'Grunfeld Defense', path: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'], color: 'black', description: 'Black attacks White’s center from distance with tactical counterplay.' },
  { id: 'nimzo-indian', name: 'Nimzo-Indian Defense', path: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'], color: 'black', description: 'Black pins the knight and fights White’s center with piece pressure.' },
  { id: 'queens-indian', name: "Queen's Indian Defense", path: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'], color: 'black', description: 'Black fianchettoes and plays a flexible, light-square strategy.' },
  { id: 'bogo-indian', name: 'Bogo-Indian Defense', path: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+'], color: 'black', description: 'Black checks early and fights for a compact, flexible structure.' },
  { id: 'dutch-defense', name: 'Dutch Defense', path: ['d4', 'f5'], color: 'black', description: 'Black takes kingside space and fights for e4.' },
  { id: 'staunton-gambit', name: 'Staunton Gambit', path: ['d4', 'f5', 'e4'], color: 'white', description: 'White sacrifices against the Dutch to open lines quickly.' },
  { id: 'hopton-attack', name: 'Hopton Attack vs Dutch', path: ['d4', 'f5', 'Bg5'], color: 'white', description: 'White immediately pressures Black’s kingside setup and makes development awkward.' },
  { id: 'englund-gambit', name: 'Englund Gambit', path: ['d4', 'e5'], color: 'black', description: 'Black offers a dubious center pawn to create traps against queen-pawn players.' },
  { id: 'anti-englund-bf4', name: 'Englund Gambit: Safe Bf4 Response', path: ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3', 'Qe7', 'Bf4'], color: 'white', description: 'White keeps the extra pawn, develops naturally, and avoids the common queen trap patterns.' },
  { id: 'english-symmetrical', name: 'English Symmetrical', path: ['c4', 'c5'], color: 'both', description: 'Both sides contest the queenside and central light squares.' },
  { id: 'english-reversed-sicilian', name: 'English: Reversed Sicilian', path: ['c4', 'e5'], color: 'white', description: 'White plays an English with colors reversed and an extra tempo.' },
  { id: 'english-four-knights', name: 'English Four Knights', path: ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6'], color: 'both', description: 'A flexible English structure with natural knight development.' },
];

function normalizeSan(san: string) {
  return san.replace(NORMALIZE_RE, '').trim();
}

function pathsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((move, index) => normalizeSan(move) === normalizeSan(b[index]));
}

function pathStartsWith(path: string[], prefix: string[]) {
  if (prefix.length > path.length) return false;
  return prefix.every((move, index) => normalizeSan(move) === normalizeSan(path[index]));
}

function lineMoves(line: OpeningLine) {
  return line.moves.map((move) => move.san);
}

function getLocalLineMatches(path: string[]) {
  return OPENINGS.flatMap((opening) =>
    opening.lines.map((line) => {
      const moves = lineMoves(line);
      const exactPath = pathStartsWith(moves, path);
      const pathContainsLineStart = pathStartsWith(path, moves);
      if (!exactPath && !pathContainsLineStart) return null;

      return {
        opening,
        line,
        nextSan: exactPath ? moves[path.length] ?? null : null,
        matchedMoves: Math.min(path.length, moves.length),
        exactPath,
      } satisfies LocalLineMatch;
    }),
  ).filter((match): match is LocalLineMatch => match !== null);
}

function getCatalogBranches(path: string[]) {
  const matching = CATALOG_BRANCHES
    .filter((branch) => pathStartsWith(branch.path, path) || pathStartsWith(path, branch.path));
  const hasSpecificBranch = matching.some((branch) => !branch.generic && branch.path.length >= path.length);

  return matching
    .filter((branch) => !(branch.generic && path.length >= 2 && hasSpecificBranch))
    .sort((a, b) => {
      const aExact = pathsEqual(a.path, path) ? 1 : 0;
      const bExact = pathsEqual(b.path, path) ? 1 : 0;
      if (bExact !== aExact) return bExact - aExact;
      if (a.path.length !== b.path.length) return a.path.length - b.path.length;
      return a.name.localeCompare(b.name);
    });
}

function getRouteMoveChoices(path: string[], color: Color, fen: string) {
  const choices = new Map<string, RouteMoveChoice>();

  function addChoice(san: string, source: string, practiceTarget = false) {
    if (!applyMove(fen, san)) return;

    const key = normalizeSan(san);
    const current = choices.get(key) ?? {
      san,
      sources: [],
      practiceTargets: 0,
    };

    if (!current.sources.includes(source)) {
      current.sources.push(source);
    }
    if (practiceTarget) {
      current.practiceTargets += 1;
    }
    choices.set(key, current);
  }

  CATALOG_BRANCHES
    .forEach((branch) => {
      if (!pathStartsWith(branch.path, path)) return;
      const nextSan = branch.path[path.length];
      if (nextSan) addChoice(nextSan, branch.name);
    });

  OPENINGS.forEach((opening) => {
    opening.lines.forEach((line) => {
      const moves = lineMoves(line);
      if (!pathStartsWith(moves, path)) return;
      const nextSan = moves[path.length];
      if (nextSan) addChoice(nextSan, line.name, opening.playerColor === color);
    });
  });

  return [...choices.values()].sort((a, b) => {
    if (b.practiceTargets !== a.practiceTargets) return b.practiceTargets - a.practiceTargets;
    if (b.sources.length !== a.sources.length) return b.sources.length - a.sources.length;
    return a.san.localeCompare(b.san);
  });
}

function getPositionName(path: string[]) {
  const exactCatalog = CATALOG_BRANCHES.find((branch) => pathsEqual(branch.path, path));
  if (exactCatalog) return exactCatalog.name;

  const exactOpening = OPENINGS.find((opening) => opening.setupMoves.length > 0 && pathsEqual(opening.setupMoves, path));
  if (exactOpening) return exactOpening.name;

  if (path.length === 0) return 'Starting position';
  if (path.length === 1) return `${path[0]} systems`;
  return `After ${path[path.length - 1]}`;
}

function pathToFen(path: string[]) {
  return path.length === 0 ? STARTING_FEN : fenAfterMoves(path);
}

function sideToMove(fen: string): Color {
  try {
    return new Chess(fen).turn() === 'w' ? 'white' : 'black';
  } catch {
    return 'white';
  }
}

function getMoveNumber(path: string[], san: string) {
  const ply = path.length;
  const moveNo = Math.floor(ply / 2) + 1;
  return ply % 2 === 0 ? `${moveNo}. ${san}` : `${moveNo}... ${san}`;
}

function boardMoveToSan(fen: string, from: string, to: string, piece?: string) {
  try {
    const chess = new Chess(fen);
    const promotion =
      piece?.[1] === 'P' &&
      ((piece[0] === 'w' && to[1] === '8') || (piece[0] === 'b' && to[1] === '1'))
        ? 'q'
        : undefined;
    const move = chess.move({ from, to, promotion });
    return move?.san ?? null;
  } catch {
    return null;
  }
}

function resolveSanArrow(fen: string, san: string): [Square, Square, string] | null {
  try {
    const chess = new Chess(fen);
    const normalised = normalizeSan(san);
    const move = chess
      .moves({ verbose: true })
      .find((candidate) => normalizeSan(candidate.san) === normalised);

    return move ? [move.from as Square, move.to as Square, 'rgba(56, 189, 248, 0.95)'] : null;
  } catch {
    return null;
  }
}

function getBranchNextMove(path: string[], branch: CatalogBranch) {
  return pathStartsWith(branch.path, path) ? branch.path[path.length] ?? null : null;
}

export default function OpeningFinder({ onBack, onStartPractice }: OpeningFinderProps) {
  const [playerColor, setPlayerColor] = useState<Color | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [boardWidth, setBoardWidth] = useState(480);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [previewSan, setPreviewSan] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const activePath = path.slice(0, cursor);
  const currentFen = pathToFen(activePath);
  const turn = sideToMove(currentFen);
  const localMatches = useMemo(() => getLocalLineMatches(activePath), [activePath.join('|')]);
  const routeMoveChoices = useMemo(
    () => getRouteMoveChoices(activePath, playerColor ?? 'white', currentFen),
    [activePath.join('|'), playerColor, currentFen],
  );
  const catalogBranches = useMemo(
    () => getCatalogBranches(activePath),
    [activePath.join('|')],
  );
  const previewArrow = previewSan ? resolveSanArrow(currentFen, previewSan) : null;

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;

    const update = () => setBoardWidth(Math.max(260, Math.floor(Math.min(node.clientWidth, node.clientHeight || node.clientWidth))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [playerColor]);

  function chooseMove(san: string) {
    const nextFen = applyMove(currentFen, san);
    if (!nextFen) return;
    const nextPath = [...activePath, san];
    setPath(nextPath);
    setCursor(nextPath.length);
    setSelectedSquare(null);
    setPreviewSan(null);
  }

  function chooseBoardMove(from: string, to: string, piece?: string) {
    const san = boardMoveToSan(currentFen, from, to, piece);
    if (!san) return false;
    chooseMove(san);
    return true;
  }

  function handleSquareClick(square: string) {
    if (!selectedSquare) {
      setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (!chooseBoardMove(selectedSquare, square)) {
      setSelectedSquare(square);
    }
  }

  function jumpToBranch(branchPath: string[]) {
    const legalPrefix = branchPath.reduce<string[]>((moves, move) => {
      const fen = pathToFen(moves);
      return applyMove(fen, move) ? [...moves, move] : moves;
    }, []);
    setPath(legalPrefix);
    setCursor(legalPrefix.length);
    setPreviewSan(null);
  }

  if (!playerColor) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-6 text-slate-100 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col justify-center">
          <button
            onClick={onBack}
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-900 px-3 py-2 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <Home size={16} />
            Back
          </button>
          <section className="rounded-[26px] border border-stone-800/65 bg-stone-950/80 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:p-7">
            <div className="max-w-3xl">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Finder beta</div>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">Find your opening</h1>
              <p className="mt-3 text-base leading-relaxed text-stone-300 sm:text-lg">
                Choose a side, follow the most common replies, and see which routes become practiceable lines.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(['white', 'black'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => setPlayerColor(color)}
                  className="rounded-[22px] border border-stone-700/55 bg-stone-900/70 p-5 text-left transition-all hover:border-sky-300/55 hover:bg-stone-800 cursor-pointer"
                >
                  <div className="text-2xl font-black capitalize text-white">{color}</div>
                  <div className="mt-2 text-sm leading-relaxed text-stone-400">
                    Explore the tree from {color === 'white' ? 'the first move' : "White's first choice"}, then pick the branch you want to train.
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const rightTitle = turn === playerColor ? 'Your course moves' : 'Likely course replies';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brand-bg text-slate-100">
      <header className="border-b border-stone-800/80 bg-stone-950 px-4 py-3">
        <div className="mx-auto grid max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-900 px-3 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="min-w-0 text-center">
            <div className="truncate text-lg font-black text-white">{getPositionName(activePath)}</div>
            <div className="mt-0.5 truncate text-xs font-semibold text-stone-500">
              Playing {playerColor}. {activePath.length ? activePath.join(' ') : 'Choose the first move.'}
            </div>
          </div>
          <button
            onClick={() => {
              setPath([]);
              setCursor(0);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-700/45 bg-stone-900 px-3 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </header>

      <main className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 gap-3 p-3 lg:grid-cols-[330px_minmax(0,1fr)_380px]">
        <aside className="min-h-0 overflow-y-auto rounded-[22px] border border-stone-800/65 bg-stone-950/72 p-3">
          <PanelHeading eyebrow="Routes" title="Possible openings" />
          <div className="mt-3 space-y-3">
            {catalogBranches.map((branch) => {
              const active = pathsEqual(branch.path, activePath);
              const nextSan = getBranchNextMove(activePath, branch);
              return (
                <button
                  key={branch.id}
                  onClick={() => jumpToBranch(branch.path)}
                  onMouseEnter={() => setPreviewSan(nextSan)}
                  onFocus={() => setPreviewSan(nextSan)}
                  onMouseLeave={() => setPreviewSan(null)}
                  onBlur={() => setPreviewSan(null)}
                  className={`w-full rounded-2xl border p-3 text-left transition-colors cursor-pointer ${
                    active
                      ? 'border-sky-300/35 bg-sky-500/14'
                      : 'border-stone-800/70 bg-stone-900/65 hover:bg-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate text-sm font-black text-white">{branch.name}</div>
                    <span className="rounded-full bg-stone-800 px-2 py-1 text-[11px] font-semibold uppercase text-stone-300">
                      {branch.color === 'both' ? 'all' : branch.color}
                    </span>
                  </div>
                  <div className="mt-2 text-xs leading-relaxed text-stone-400">{branch.description}</div>
                  <div className="mt-2 truncate text-[11px] font-semibold text-sky-200/80">{branch.path.join(' ')}</div>
                </button>
              );
            })}

            {localMatches.slice(0, 7).map((match) => {
              const playable = match.opening.playerColor === playerColor;
              return (
                <div
                  key={`${match.opening.id}-${match.line.id}`}
                  onMouseEnter={() => setPreviewSan(match.nextSan)}
                  onFocus={() => setPreviewSan(match.nextSan)}
                  onMouseLeave={() => setPreviewSan(null)}
                  onBlur={() => setPreviewSan(null)}
                  className={`rounded-2xl border p-3 ${
                    playable
                      ? 'border-emerald-300/18 bg-emerald-400/8'
                      : 'border-stone-800/60 bg-stone-900/40 opacity-55'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <BookOpen size={15} className={playable ? 'mt-0.5 text-emerald-300' : 'mt-0.5 text-stone-500'} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-white">{match.line.name}</div>
                      <div className="mt-0.5 truncate text-xs text-stone-400">{match.opening.name}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-stone-500">
                    {playable ? 'Available to practice' : `Built for ${match.opening.playerColor}`}
                    {match.nextSan ? ` · next ${match.nextSan}` : ''}
                  </div>
                  {playable && (
                    <button
                      onClick={() => onStartPractice(match.opening, match.line)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-300 cursor-pointer"
                    >
                      <Sparkles size={15} />
                      Practice this line
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-stone-800/65 bg-stone-950/50">
          <div className="border-b border-stone-800/60 p-3">
            <RouteBar path={activePath} cursor={cursor} total={path.length} onBack={() => setCursor(Math.max(0, cursor - 1))} onForward={() => setCursor(Math.min(path.length, cursor + 1))} />
          </div>
          <div ref={boardRef} className="flex min-h-0 flex-1 items-center justify-center p-3">
            <Chessboard
              position={currentFen}
              boardWidth={boardWidth}
              boardOrientation={playerColor}
              arePiecesDraggable
              onPieceDrop={(from, to, piece) => chooseBoardMove(from, to, piece)}
              onSquareClick={handleSquareClick}
              customArrows={previewArrow ? [previewArrow] : []}
              customSquareStyles={
                selectedSquare
                  ? { [selectedSquare]: { backgroundColor: 'rgba(56, 189, 248, 0.46)' } }
                  : undefined
              }
              customBoardStyle={{
                borderRadius: '18px',
                backgroundColor: 'transparent',
                boxShadow: '0 18px 46px rgba(0,0,0,0.28)',
              }}
              customDarkSquareStyle={{ backgroundColor: WOOD_DARK }}
              customLightSquareStyle={{ backgroundColor: WOOD_LIGHT }}
              animationDuration={160}
            />
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto rounded-[22px] border border-stone-800/65 bg-stone-950/72 p-3">
          <PanelHeading eyebrow="Route choices" title={rightTitle} />
          <div className="mt-3 space-y-2">
            {routeMoveChoices.length === 0 && (
              <RailNotice text="No local route moves from this position yet. Step back or choose another route." />
            )}
            {routeMoveChoices.map((move) => (
              <button
                key={move.san}
                onClick={() => chooseMove(move.san)}
                onMouseEnter={() => setPreviewSan(move.san)}
                onFocus={() => setPreviewSan(move.san)}
                onMouseLeave={() => setPreviewSan(null)}
                onBlur={() => setPreviewSan(null)}
                className="w-full rounded-2xl border border-stone-800/70 bg-stone-900/70 p-3 text-left transition-colors hover:bg-stone-800 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-sm font-black text-white">{getMoveNumber(activePath, move.san)}</div>
                  {move.practiceTargets > 0 && (
                    <span className="rounded-full bg-emerald-400/12 px-2 py-1 text-[11px] font-bold text-emerald-300">
                      practice
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs font-semibold leading-relaxed text-stone-400">
                  {move.sources.slice(0, 3).join(', ')}
                  {move.sources.length > 3 ? ` +${move.sources.length - 3} more` : ''}
                </div>
              </button>
            ))}

            <div className="mt-4 rounded-2xl border border-stone-800/70 bg-stone-900/45 p-3">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">
                Opening database
              </div>
              <div className="mt-1 text-sm font-bold text-stone-300">Coming soon</div>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                Frequencies will plug into the same panel when the Vercel Lichess API is enabled.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function PanelHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300/85">{eyebrow}</div>
      <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
    </div>
  );
}

function RailNotice({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-stone-800/70 bg-stone-900/60 p-3 text-sm font-semibold leading-relaxed text-stone-400">
      {text}
    </div>
  );
}

function RouteBar({
  path,
  cursor,
  total,
  onBack,
  onForward,
}: {
  path: string[];
  cursor: number;
  total: number;
  onBack: () => void;
  onForward: () => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={cursor === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700/45 bg-stone-900 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
          aria-label="Step back"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={onForward}
          disabled={cursor >= total}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700/45 bg-stone-900 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
          aria-label="Step forward"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-stone-800/65 bg-stone-900/55 px-3 py-2">
        <div className="flex min-h-[24px] flex-wrap items-center gap-1.5">
          {path.length === 0 ? (
            <span className="text-sm font-semibold text-stone-500">Start from the initial position</span>
          ) : (
            path.map((move, index) => (
              <span
                key={`${move}-${index}`}
                className="rounded-lg bg-stone-800 px-2 py-1 text-xs font-bold text-stone-200"
              >
                {getMoveNumber(path.slice(0, index), move)}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="hidden items-center gap-2 text-xs font-semibold text-stone-500 sm:flex">
        <ArrowLeft size={13} />
        explore
        <ArrowRight size={13} />
      </div>
    </div>
  );
}
