import type { Opening } from '../types';

/**
 * Stafford Gambit — 7 trap lines from the ThummimS guide.
 * Player color: Black.
 *
 * Setup sequence (shared prefix, 8 half-moves):
 *   1.e4 e5  2.Nf3 Nf6  3.Nxe5 Nc6  4.Nxc6 dxc6
 *
 * All lines store the FULL move sequence from move 1.
 * Indices 0–7 are the setup moves.
 * All moves verified legal with chess.js.
 */
const staffordGambit: Opening = {
  id: 'stafford-gambit',
  name: 'Stafford Gambit',
  description:
    'A sharp counter-gambit for Black from the Petrov Defense. ' +
    'Black sacrifices material for rapid development and deadly traps.',
  playerColor: 'black',

  // 1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nc6 4.Nxc6 dxc6
  setupMoves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6', 'Nxc6', 'dxc6'],

  lines: [

    // ─── Line 1: Oh No My Queen! ────────────────────────────────────
    // 5.d3 Bc5 6.Bg5 Nxe4! 7.Bxd8 Bxf2+ 8.Ke2 Bg4#
    // White greedily takes the queen but gets mated.
    {
      id: 'oh-no-queen',
      name: 'Oh No My Queen!',
      description:
        'After 5.d3 Bc5 6.Bg5 Black plays Nxe4! — if White captures the queen with 7.Bxd8, ' +
        'Bxf2+ 8.Ke2 Bg4# is checkmate. A brilliant queen sacrifice trap.',
      moves: [
        // Setup (indices 0–7)
        { san: 'e4' },
        { san: 'e5' },
        { san: 'Nf3' },
        { san: 'Nf6' },
        { san: 'Nxe5' },
        { san: 'Nc6' },
        { san: 'Nxc6' },
        { san: 'dxc6' },
        // ── Line ──────────────────
        // 5.d3
        {
          san: 'd3',
          alternatives: [
            { san: 'd3',  weight: 40 },
            { san: 'Nc3', weight: 30 },
            { san: 'e5',  weight: 15 },
            { san: 'd4',  weight: 15 },
          ],
        },
        { san: 'Bc5' },   // 5...Bc5 — develop bishop, eye f2
        // 6.Bg5 — pin the knight
        {
          san: 'Bg5',
          alternatives: [
            { san: 'Bg5', weight: 50 },
            { san: 'Be2', weight: 30 },
            { san: 'h3',  weight: 20 },
          ],
        },
        { san: 'Nxe4' },  // 6...Nxe4! — queen sacrifice!
        { san: 'Bxd8' },  // 7.Bxd8 — takes the queen (falls for the trap)
        { san: 'Bxf2+' }, // 7...Bxf2+ — bishop checks the king
        { san: 'Ke2' },   // 8.Ke2 — forced
        { san: 'Bg4#' },  // 8...Bg4# — checkmate!
      ],
    },

    // ─── Line 2: Oh No My Knight! ────────────────────────────────────
    // 5.Nc3 Bc5 6.Bc4 Ng4 7.O-O Qh4 8.h3 Nxf2 9.Qf3 Nxh3+ 10.Kh2 Nf2+ 11.Kg1 Qh1#
    {
      id: 'oh-no-knight',
      name: 'Oh No My Knight!',
      description:
        'The most common trap. 5.Nc3 Bc5 6.Bc4 Ng4 7.O-O Qh4 8.h3 Nxf2! ' +
        '9.Qf3 Nxh3+ 10.Kh2 Nf2+ 11.Kg1 Qh1# — White\'s pieces are helpless.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'Nf3' },
        { san: 'Nf6' },
        { san: 'Nxe5' },
        { san: 'Nc6' },
        { san: 'Nxc6' },
        { san: 'dxc6' },
        // 5.Nc3
        {
          san: 'Nc3',
          alternatives: [
            { san: 'Nc3', weight: 30 },
            { san: 'd3',  weight: 40 },
            { san: 'e5',  weight: 15 },
            { san: 'd4',  weight: 15 },
          ],
        },
        { san: 'Bc5' },  // 5...Bc5
        // 6.Bc4
        {
          san: 'Bc4',
          alternatives: [
            { san: 'Bc4', weight: 50 },
            { san: 'd3',  weight: 30 },
            { san: 'Be2', weight: 20 },
          ],
        },
        { san: 'Ng4' },  // 6...Ng4 — threatening Qh4 + Nxf2
        { san: 'O-O' },  // 7.O-O
        { san: 'Qh4' },  // 7...Qh4 — threat Qxf2#
        { san: 'h3' },   // 8.h3 — trying to kick the knight
        { san: 'Nxf2' }, // 8...Nxf2! — sacrifice
        // 9.Qf3 (defending f2, but now the h3 pawn is loose)
        {
          san: 'Qf3',
          alternatives: [
            { san: 'Qf3',  weight: 50 },
            { san: 'Rxf2', weight: 30 },
            { san: 'Re1',  weight: 20 },
          ],
        },
        { san: 'Nxh3+' }, // 9...Nxh3+ — fork check!
        { san: 'Kh2' },   // 10.Kh2 — forced
        { san: 'Nf2+' },  // 10...Nf2+ — knight checks again
        { san: 'Kg1' },   // 11.Kg1 — forced
        { san: 'Qh1#' },  // 11...Qh1# — checkmate!
      ],
    },

    // ─── Line 3: Take My Knight, But I'll Take Your Rook! ────────────
    // 5.Nc3 Bc5 6.e5 Ng4 7.Ne4 Nxf2! 8.Nxf2 Bxf2+ 9.Kxf2 Qd4+ 10.Ke1 Qh4+
    {
      id: 'take-knight-rook',
      name: "Take My Knight, I'll Take Your Rook!",
      description:
        '5.Nc3 Bc5 6.e5 Ng4 7.Ne4 Nxf2! — if White captures with 8.Nxf2, ' +
        'Bxf2+ 9.Kxf2 Qd4+ 10.Ke1 Qh4+ wins the rook. Black gets crushing compensation.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'Nf3' },
        { san: 'Nf6' },
        { san: 'Nxe5' },
        { san: 'Nc6' },
        { san: 'Nxc6' },
        { san: 'dxc6' },
        // 5.Nc3
        {
          san: 'Nc3',
          alternatives: [
            { san: 'Nc3', weight: 30 },
            { san: 'd3',  weight: 40 },
            { san: 'e5',  weight: 15 },
            { san: 'd4',  weight: 15 },
          ],
        },
        { san: 'Bc5' },  // 5...Bc5
        // 6.e5 — trying to win the knight
        {
          san: 'e5',
          alternatives: [
            { san: 'e5',  weight: 40 },
            { san: 'Bc4', weight: 35 },
            { san: 'Be2', weight: 25 },
          ],
        },
        { san: 'Ng4' },  // 6...Ng4 — retreat to attack f2
        // 7.Ne4 — attacking the bishop
        {
          san: 'Ne4',
          alternatives: [
            { san: 'Ne4', weight: 60 },
            { san: 'd4',  weight: 25 },
            { san: 'Be2', weight: 15 },
          ],
        },
        { san: 'Nxf2' },  // 7...Nxf2! — sacrifice
        { san: 'Nxf2' },  // 8.Nxf2 — takes the knight
        { san: 'Bxf2+' }, // 8...Bxf2+ — bishop check
        { san: 'Kxf2' },  // 9.Kxf2 — king must take
        { san: 'Qd4+' },  // 9...Qd4+ — fork: king and rook on a1
        { san: 'Ke1' },   // 10.Ke1 — retreats
        { san: 'Qh4+' },  // 10...Qh4+ — wins the rook!
      ],
    },

    // ─── Line 4: Punishing Natural Development ───────────────────────
    // 5.d3 Bc5 6.h3 Bxf2+! 7.Kxf2 Nxe4+
    {
      id: 'punish-natural-dev',
      name: 'Punishing Natural Development',
      description:
        'After 5.d3 Bc5, if White plays the "natural" 6.h3, Black strikes with ' +
        'Bxf2+! 7.Kxf2 Nxe4+ — winning a pawn with a strong attack.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'Nf3' },
        { san: 'Nf6' },
        { san: 'Nxe5' },
        { san: 'Nc6' },
        { san: 'Nxc6' },
        { san: 'dxc6' },
        // 5.d3
        {
          san: 'd3',
          alternatives: [
            { san: 'd3',  weight: 40 },
            { san: 'Nc3', weight: 30 },
            { san: 'e5',  weight: 15 },
            { san: 'd4',  weight: 15 },
          ],
        },
        { san: 'Bc5' },   // 5...Bc5
        // 6.h3 — the natural "waiting" move that loses
        {
          san: 'h3',
          alternatives: [
            { san: 'h3',  weight: 45 },
            { san: 'Be2', weight: 30 },
            { san: 'Bg5', weight: 25 },
          ],
        },
        { san: 'Bxf2+' }, // 6...Bxf2+! — sacrifice
        { san: 'Kxf2' },  // 7.Kxf2 — king forced to take
        { san: 'Nxe4+' }, // 7...Nxe4+ — fork: king and bishop
      ],
    },

    // ─── Line 5: My Favorite Trap ────────────────────────────────────
    // 5.d3 Bc5 6.Be2 h5 7.O-O Ng4 8.h3 Qd6! 9.hxg4 hxg4 10.g3 Qxg3#
    {
      id: 'my-favorite-trap',
      name: 'My Favorite Trap',
      description:
        'After 5.d3 Bc5 6.Be2 h5 7.O-O Ng4 8.h3, Black plays Qd6! — ' +
        'threatening Qxh2#. If 9.hxg4 hxg4 10.g3, then Qxg3# is checkmate.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'Nf3' },
        { san: 'Nf6' },
        { san: 'Nxe5' },
        { san: 'Nc6' },
        { san: 'Nxc6' },
        { san: 'dxc6' },
        // 5.d3
        {
          san: 'd3',
          alternatives: [
            { san: 'd3',  weight: 40 },
            { san: 'Nc3', weight: 30 },
            { san: 'e5',  weight: 15 },
            { san: 'd4',  weight: 15 },
          ],
        },
        { san: 'Bc5' },  // 5...Bc5
        // 6.Be2
        {
          san: 'Be2',
          alternatives: [
            { san: 'Be2', weight: 50 },
            { san: 'Bg5', weight: 30 },
            { san: 'h3',  weight: 20 },
          ],
        },
        { san: 'h5' },   // 6...h5 — prepares the attack
        { san: 'O-O' },  // 7.O-O
        { san: 'Ng4' },  // 7...Ng4 — threatens Nxf2 and Qh4
        { san: 'h3' },   // 8.h3 — trying to kick the knight
        { san: 'Qd6' },  // 8...Qd6! — quiet move, threatens Qxh2#
        { san: 'hxg4' }, // 9.hxg4 — captures the knight
        { san: 'hxg4' }, // 9...hxg4 — recaptures, opens h-file
        { san: 'g3' },   // 10.g3 — tries to close lines
        { san: 'Qxg3#' },// 10...Qxg3# — checkmate!
      ],
    },

    // ─── Line 6: Everyone Falls for This! ────────────────────────────
    // 5.Nc3 Bc5 6.Be2 h5 7.h3 Qd4! 8.O-O Ng4
    {
      id: 'everyone-falls',
      name: 'Everyone Falls for This!',
      description:
        'After 5.Nc3 Bc5 6.Be2 h5 7.h3, Black plays Qd4! — attacking f2 and b2. ' +
        'After 8.O-O Ng4 the threat of Nxf2 and Qxf2# is overwhelming.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'Nf3' },
        { san: 'Nf6' },
        { san: 'Nxe5' },
        { san: 'Nc6' },
        { san: 'Nxc6' },
        { san: 'dxc6' },
        // 5.Nc3
        {
          san: 'Nc3',
          alternatives: [
            { san: 'Nc3', weight: 30 },
            { san: 'd3',  weight: 40 },
            { san: 'e5',  weight: 15 },
            { san: 'd4',  weight: 15 },
          ],
        },
        { san: 'Bc5' },  // 5...Bc5
        // 6.Be2
        {
          san: 'Be2',
          alternatives: [
            { san: 'Be2', weight: 50 },
            { san: 'Bc4', weight: 30 },
            { san: 'd3',  weight: 20 },
          ],
        },
        { san: 'h5' },   // 6...h5 — prepares h4 and attack
        // 7.h3 — common "safe" move
        {
          san: 'h3',
          alternatives: [
            { san: 'h3',  weight: 50 },
            { san: 'O-O', weight: 30 },
            { san: 'd4',  weight: 20 },
          ],
        },
        { san: 'Qd4' },  // 7...Qd4! — powerful central queen
        { san: 'O-O' },  // 8.O-O — castles into the attack
        { san: 'Ng4' },  // 8...Ng4 — threatening Nxf2!
      ],
    },

    // ─── Line 7: Drag White's King ───────────────────────────────────
    // 5.e5 Ne4 6.d3 Bc5! 7.dxe4 Bxf2+ 8.Kxf2 Qxd1
    {
      id: 'drag-kings',
      name: "Drag White's King",
      description:
        'After 5.e5 Ne4 6.d3, Black plays Bc5! — if 7.dxe4 Bxf2+ 8.Kxf2 Qxd1, ' +
        'Black wins the queen. White\'s king is dragged out of safety.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'Nf3' },
        { san: 'Nf6' },
        { san: 'Nxe5' },
        { san: 'Nc6' },
        { san: 'Nxc6' },
        { san: 'dxc6' },
        // 5.e5 — trying to win the knight
        {
          san: 'e5',
          alternatives: [
            { san: 'e5',  weight: 15 },
            { san: 'Nc3', weight: 30 },
            { san: 'd3',  weight: 40 },
            { san: 'd4',  weight: 15 },
          ],
        },
        { san: 'Ne4' },   // 5...Ne4! — retreats to strong central square
        // 6.d3 — attacking the knight
        {
          san: 'd3',
          alternatives: [
            { san: 'd3',  weight: 60 },
            { san: 'Qe2', weight: 25 },
            { san: 'f3',  weight: 15 },
          ],
        },
        { san: 'Bc5' },   // 6...Bc5! — pin the knight, threaten f2
        // 7.dxe4 — captures the knight
        {
          san: 'dxe4',
          alternatives: [
            { san: 'dxe4', weight: 70 },
            { san: 'Be2',  weight: 30 },
          ],
        },
        { san: 'Bxf2+' }, // 7...Bxf2+ — draws king out
        { san: 'Kxf2' },  // 8.Kxf2 — forced
        { san: 'Qxd1' },  // 8...Qxd1 — wins the queen!
      ],
    },

  ],
};

export default staffordGambit;
