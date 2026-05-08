import type { ReactElement } from 'react';
import type { CustomPieces, Piece } from 'react-chessboard/dist/chessboard/types';
import type { PieceStyle } from '../../store/settingsStore';

const MODERN_PIECE_SHEET = '/pieces/modern-pieces.png';
const PIECE_ORDER = ['K', 'Q', 'B', 'N', 'R', 'P'] as const;
const PIECE_INDEX = Object.fromEntries(PIECE_ORDER.map((piece, index) => [piece, index])) as Record<string, number>;
const SHEET_WIDTH = 822;
const SHEET_HEIGHT = 304;
const CELL_WIDTH = SHEET_WIDTH / PIECE_ORDER.length;
const PIECE_HEIGHT_SCALE = 0.62;

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
      const spriteIndex = PIECE_INDEX[piece[1]];
      const spriteScale = (squareWidth * PIECE_HEIGHT_SCALE) / SHEET_HEIGHT;
      const viewportWidth = CELL_WIDTH * spriteScale;
      const viewportHeight = SHEET_HEIGHT * spriteScale;
      const backgroundWidth = SHEET_WIDTH * spriteScale;
      const backgroundHeight = SHEET_HEIGHT * spriteScale;

      return (
        <div
          aria-hidden="true"
          style={{
            alignItems: 'center',
            display: 'flex',
            height: squareWidth,
            pointerEvents: 'none',
            justifyContent: 'center',
            width: squareWidth,
          }}
        >
          <div
            style={{
              backgroundImage: `url(${MODERN_PIECE_SHEET})`,
              backgroundPosition: `${-spriteIndex * viewportWidth}px 0`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${backgroundWidth}px ${backgroundHeight}px`,
              filter: getPieceFilter(isWhite, withOutline),
              height: viewportHeight,
              width: viewportWidth,
            }}
          />
        </div>
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
