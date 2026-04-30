import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Home, RotateCcw, Sparkles } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
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
};

const CATALOG_BRANCHES: CatalogBranch[] = [
  { id: 'open-sicilian', name: 'Open Sicilian', path: ['e4', 'c5', 'Nf3', 'd6', 'd4'], color: 'white', description: 'White opens the center and asks Black to choose a Sicilian structure.' },
  { id: 'alapin', name: 'Alapin Sicilian', path: ['e4', 'c5', 'c3'], color: 'white', description: 'A direct center-building route against the Sicilian.' },
  { id: 'closed-sicilian', name: 'Closed Sicilian', path: ['e4', 'c5', 'Nc3'], color: 'white', description: 'Keep the center closed and build kingside pressure.' },
  { id: 'smith-morra', name: 'Smith-Morra Gambit', path: ['e4', 'c5', 'd4'], color: 'white', description: 'A pawn sacrifice for fast development and open files.' },
  { id: 'kings-pawn', name: "King's Pawn Game", path: ['e4'], color: 'both', description: 'The main gateway to open games, Sicilians, French, Caro-Kann, and more.' },
  { id: 'ruy-lopez', name: 'Ruy Lopez', path: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], color: 'white', description: 'Classical pressure on the e5 pawn and Black knight.' },
  { id: 'scotch', name: 'Scotch Game', path: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'], color: 'white', description: 'Open the center early and make development concrete.' },
  { id: 'french', name: 'French Defense', path: ['e4', 'e6'], color: 'black', description: 'A compact center with ...d5 and long-term pawn-chain play.' },
  { id: 'caro-kann', name: 'Caro-Kann Defense', path: ['e4', 'c6'], color: 'black', description: 'Solid development around ...d5 and a durable pawn structure.' },
  { id: 'queens-gambit', name: "Queen's Gambit", path: ['d4', 'd5', 'c4'], color: 'white', description: 'Pressure Black central pawn structure from move two.' },
  { id: 'kings-indian', name: "King's Indian Defense", path: ['d4', 'Nf6', 'c4', 'g6'], color: 'black', description: 'Let White build the center, then strike it later.' },
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

function getCatalogBranches(path: string[], color: Color) {
  return CATALOG_BRANCHES
    .filter((branch) => branch.color === 'both' || branch.color === color)
    .filter((branch) => pathStartsWith(branch.path, path) || pathStartsWith(path, branch.path))
    .sort((a, b) => {
      const aExact = pathsEqual(a.path, path) ? 1 : 0;
      const bExact = pathsEqual(b.path, path) ? 1 : 0;
      if (bExact !== aExact) return bExact - aExact;
      return a.path.length - b.path.length;
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
    .filter((branch) => branch.color === 'both' || branch.color === color)
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

export default function OpeningFinder({ onBack, onStartPractice }: OpeningFinderProps) {
  const [playerColor, setPlayerColor] = useState<Color | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [boardWidth, setBoardWidth] = useState(480);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
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
    () => getCatalogBranches(activePath, playerColor ?? 'white'),
    [activePath.join('|'), playerColor],
  );

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
            {catalogBranches.slice(0, 6).map((branch) => {
              const active = pathsEqual(branch.path, activePath);
              return (
                <button
                  key={branch.id}
                  onClick={() => jumpToBranch(branch.path)}
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
