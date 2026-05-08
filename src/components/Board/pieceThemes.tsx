import type { ReactElement } from 'react';
import type { CustomPieces, Piece } from 'react-chessboard/dist/chessboard/types';
import type { PieceStyle } from '../../store/settingsStore';

const MODERN_SYMBOLS: Record<Piece, string> = {
  wK: '♚',
  wQ: '♛',
  wR: '♜',
  wB: '♝',
  wN: '♞',
  wP: '♟',
  bK: '♚',
  bQ: '♛',
  bR: '♜',
  bB: '♝',
  bN: '♞',
  bP: '♟',
};

const MODERN_PIECES: CustomPieces = Object.fromEntries(
  (Object.keys(MODERN_SYMBOLS) as Piece[]).map((piece) => [
    piece,
    ({ squareWidth }: { squareWidth: number }): ReactElement => {
      const isWhite = piece[0] === 'w';
      const symbol = MODERN_SYMBOLS[piece];
      const fill = isWhite ? '#f8fafc' : '#171717';
      const stroke = isWhite ? '#171717' : '#f8fafc';
      const strokeWidth = isWhite ? 4.4 : 1.2;
      const shadow = isWhite ? 'rgba(0,0,0,0.24)' : 'rgba(255,255,255,0.16)';
      const svg = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <filter id="pieceShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="${shadow}" flood-opacity="1"/>
          </filter>
          <text
            x="50"
            y="76"
            text-anchor="middle"
            font-family="Georgia, 'Times New Roman', serif"
            font-size="82"
            font-weight="900"
            fill="${fill}"
            stroke="${stroke}"
            stroke-width="${strokeWidth}"
            paint-order="stroke fill"
            filter="url(#pieceShadow)"
          >${symbol}</text>
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
