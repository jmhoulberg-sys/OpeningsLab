import type { ReactElement } from 'react';
import type { CustomPieces, Piece } from 'react-chessboard/dist/chessboard/types';
import type { PieceStyle } from '../../store/settingsStore';

const ONLINE_PIECE_SETS: Partial<Record<PieceStyle, string>> = {
  'set-1': 'chessnut',
  'set-2': 'fantasy',
  'set-3': 'spatial',
  'set-4': 'celtic',
  'set-5': 'rhosgfx',
};

const PIECES = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as Piece[];

function createImagePieces(setName: string): CustomPieces {
  return Object.fromEntries(
    PIECES.map((piece) => [
      piece,
      ({ squareWidth }: { squareWidth: number }): ReactElement => (
        <img
          src={`/pieces/online/${setName}/${piece}.svg`}
          alt=""
          draggable={false}
          style={{
            display: 'block',
            height: squareWidth,
            pointerEvents: 'none',
            width: squareWidth,
          }}
        />
      ),
    ]),
  ) as CustomPieces;
}

const CUSTOM_PIECES = Object.fromEntries(
  Object.entries(ONLINE_PIECE_SETS).map(([style, setName]) => [style, createImagePieces(setName)]),
) as Partial<Record<PieceStyle, CustomPieces>>;

export function getCustomPieces(pieceStyle: PieceStyle): CustomPieces | undefined {
  return CUSTOM_PIECES[pieceStyle];
}
