import type { ReactElement } from 'react';
import type { CustomPieces, Piece } from 'react-chessboard/dist/chessboard/types';
import type { PieceStyle } from '../../store/settingsStore';

const MODERN_PIECE_DIR = '/pieces/modern';

function getPieceFilter(isWhite: boolean, withOutline: boolean) {
  const base = isWhite ? 'invert(1)' : '';
  if (!withOutline) return base || undefined;

  const outlineColor = isWhite ? '#111111' : '#ffffff';
  const outline = [
    `drop-shadow(1px 0 0 ${outlineColor})`,
    `drop-shadow(-1px 0 0 ${outlineColor})`,
    `drop-shadow(0 1px 0 ${outlineColor})`,
    `drop-shadow(0 -1px 0 ${outlineColor})`,
  ].join(' ');
  return [base, outline].filter(Boolean).join(' ');
}

function createModernPieces(withOutline: boolean): CustomPieces {
  return Object.fromEntries(
  (['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as Piece[]).map((piece) => [
    piece,
    ({ squareWidth }: { squareWidth: number }): ReactElement => {
      const isWhite = piece[0] === 'w';

      return (
        <img
          src={`${MODERN_PIECE_DIR}/b${piece[1]}.png`}
          alt=""
          draggable={false}
          style={{
            display: 'block',
            filter: getPieceFilter(isWhite, withOutline),
            height: squareWidth,
            pointerEvents: 'none',
            width: squareWidth,
          }}
        />
      );
    },
  ]),
) as CustomPieces;
}

const MODERN_PIECES = createModernPieces(false);
const MODERN_OUTLINE_PIECES = createModernPieces(true);

export function getCustomPieces(pieceStyle: PieceStyle): CustomPieces | undefined {
  if (pieceStyle === 'modern') return MODERN_PIECES;
  if (pieceStyle === 'modern-outline') return MODERN_OUTLINE_PIECES;
  return undefined;
}
