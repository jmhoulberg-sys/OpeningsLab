import type { ReactElement } from 'react';
import type { CustomPieces, Piece } from 'react-chessboard/dist/chessboard/types';
import type { PieceStyle } from '../../store/settingsStore';

const MODERN_PIECE_SHEET = '/pieces/modern-pieces.png';
const PIECE_ORDER = ['K', 'Q', 'B', 'N', 'R', 'P'] as const;
const PIECE_INDEX = Object.fromEntries(PIECE_ORDER.map((piece, index) => [piece, index])) as Record<string, number>;

const MODERN_PIECES: CustomPieces = Object.fromEntries(
  (['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as Piece[]).map((piece) => [
    piece,
    ({ squareWidth }: { squareWidth: number }): ReactElement => {
      const isWhite = piece[0] === 'w';
      const spriteIndex = PIECE_INDEX[piece[1]];

      return (
        <div
          aria-hidden="true"
          style={{
            backgroundImage: `url(${MODERN_PIECE_SHEET})`,
            backgroundPosition: `${spriteIndex * 20}% 50%`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '600% auto',
            filter: isWhite ? 'invert(1)' : undefined,
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
