import type { ReactElement } from 'react';
import type { CustomPieces, Piece } from 'react-chessboard/dist/chessboard/types';
import type { PieceStyle } from '../../store/settingsStore';

const PIECE_PATHS: Record<string, string[]> = {
  K: [
    'M46 8h8v9h10v8H54v10H46V25H36v-8h10V8Z',
    'M33 35c6-7 28-7 34 0l-7 37H40L33 35Z',
    'M34 72h32l4 8H30l4-8Z',
    'M25 82h50l5 9H20l5-9Z',
  ],
  Q: [
    'M26 31c5 0 9 4 9 9 0 2-1 5-3 6l8 20h20l8-20c-2-1-3-4-3-6 0-5 4-9 9-9s9 4 9 9-4 9-9 9h-1L66 72H34l-7-23h-1c-5 0-9-4-9-9s4-9 9-9Z',
    'M50 13c5 0 9 4 9 9s-4 9-9 9-9-4-9-9 4-9 9-9Z',
    'M36 72h28l4 8H32l4-8Z',
    'M27 82h46l5 9H22l5-9Z',
  ],
  R: [
    'M27 18h12v8h8v-8h8v8h8v-8h12v25H27V18Z',
    'M35 43h30l-5 29H40L35 43Z',
    'M32 72h36l4 8H28l4-8Z',
    'M23 82h54l5 9H18l5-9Z',
  ],
  B: [
    'M50 13c7 0 12 5 12 12 0 4-2 8-6 10 9 8 13 18 9 31H35c-4-13 0-23 9-31-4-2-6-6-6-10 0-7 5-12 12-12Z',
    'M49 24c4 10 2 21-5 33h6c8-12 11-23 8-34l-9 1Z',
    'M37 67h26l4 8H33l4-8Z',
    'M27 78h46l5 10H22l5-10Z',
  ],
  N: [
    'M31 74c-4-17 1-31 16-43l6-18 10 7-3 9c9 4 16 13 18 24l-11 3c-4 1-8-1-11-4l-6-7c-5 6-8 13-7 21l1 8H31Z',
    'M57 33c2-2 6-2 8 1-2 3-6 3-8-1Z',
    'M30 74h41l5 9H25l5-9Z',
    'M20 84h62l5 8H15l5-8Z',
  ],
  P: [
    'M50 22c10 0 18 8 18 18 0 7-4 13-10 16l5 16H37l5-16c-6-3-10-9-10-16 0-10 8-18 18-18Z',
    'M36 72h28l4 8H32l4-8Z',
    'M25 82h50l5 9H20l5-9Z',
  ],
};

const MODERN_PIECES: CustomPieces = Object.fromEntries(
  (['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as Piece[]).map((piece) => [
    piece,
    ({ squareWidth }: { squareWidth: number }): ReactElement => {
      const isWhite = piece[0] === 'w';
      const fill = isWhite ? '#ffffff' : '#050505';
      const stroke = isWhite ? '#050505' : 'none';
      const strokeWidth = isWhite ? 3.2 : 0;
      const paths = PIECE_PATHS[piece[1]];
      const svg = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <g fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" paint-order="stroke fill">
            ${paths.map((path) => `<path d="${path}"/>`).join('')}
          </g>
        </svg>
      `);

      return (
        <img
          src={`data:image/svg+xml,${svg}`}
          alt=""
          draggable={false}
          style={{
            display: 'block',
            height: squareWidth,
            pointerEvents: 'none',
            width: squareWidth,
          }}
        />
      );
    },
  ]),
) as CustomPieces;

export function getCustomPieces(pieceStyle: PieceStyle): CustomPieces | undefined {
  return pieceStyle === 'modern' ? MODERN_PIECES : undefined;
}
