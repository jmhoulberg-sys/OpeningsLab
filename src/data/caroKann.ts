import type { Opening } from '../types';

/**
 * Caro-Kann Defense — complete Black repertoire.
 * 1.e4 c6 2.d4 d5
 *
 * Setup (indices 0–3): e4 c6 d4 d5
 * Player: Black (moves at odd indices)
 *
 * Five main lines covering every critical White try:
 *  1. Classical — Bf5 main line        (3.Nc3 dxe4 4.Nxe4 Bf5)
 *  2. Classical — Nd7 / Karpov         (3.Nc3 dxe4 4.Nxe4 Nd7 5.Nf3)
 *  3. Advance variation                 (3.e5 Bf5)
 *  4. Exchange variation                (3.exd5 cxd5)
 *  5. Classical — Steinitz / Bc4       (3.Nc3 dxe4 4.Nxe4 Nd7 5.Bc4)
 *
 * All moves chess.js-verified legal from the starting position.
 */
const caroKann: Opening = {
  id: 'caro-kann',
  name: 'Caro-Kann Defense',
  description:
    'Black\'s solid reply to 1.e4 with 1...c6, preparing 2...d5. ' +
    'Avoids the sharp Open Game while fighting for the centre. ' +
    'Covers the Classical (Bf5 & Nd7), Advance, Exchange and Steinitz variations.',
  playerColor: 'black',

  // 1.e4 c6 2.d4 d5
  setupMoves: ['e4', 'c6', 'd4', 'd5'],

  lines: [

    // ══════════════════════════════════════════════════════════════
    //  LINE 1 — Classical: Bf5 main line
    //  3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6 6.h4 h6 7.Nf3 Nd7
    //  8.h5 Bh7 9.Bd3 Bxd3 10.Qxd3 e6 11.Bf4 Ngf6 12.O-O-O Be7
    // ══════════════════════════════════════════════════════════════
    {
      id: 'caro-classical-bf5',
      name: 'Classical: Bf5 Main Line',
      description:
        '3.Nc3 dxe4 4.Nxe4 Bf5 — Black develops the bishop actively before playing e6. ' +
        'White\'s h4–h5 is met by Bh7, keeping the bishop and reaching a solid pawn structure.',
      moves: [
        // ── Setup (0–3) ──
        { san: 'e4' },
        { san: 'c6' },
        { san: 'd4' },
        { san: 'd5' },
        // ── Line ──────────────────────────────────────────────────
        // 3.Nc3 — most principled; controls e4 and d5
        {
          san: 'Nc3',
          alternatives: [
            { san: 'Nc3',  weight: 45 },
            { san: 'Nd2',  weight: 25 },   // transposes after dxe4 Nxe4
            { san: 'e5',   weight: 20 },   // Advance — handled in another line
            { san: 'exd5', weight: 10 },   // Exchange
          ],
        },
        // 3...dxe4 — accept the pawn, force Nxe4
        { san: 'dxe4' },
        // 4.Nxe4
        { san: 'Nxe4' },
        // 4...Bf5! — key move: bishop develops before e6 blocks it
        { san: 'Bf5' },
        // 5.Ng3 — attacks the bishop
        {
          san: 'Ng3',
          alternatives: [
            { san: 'Ng3', weight: 60 },
            { san: 'Ne5', weight: 25 },
            { san: 'Bc4', weight: 15 },
          ],
        },
        // 5...Bg6 — retreat, keeping the bishop
        { san: 'Bg6' },
        // 6.h4 — threatens h5 to trap or win the bishop
        {
          san: 'h4',
          alternatives: [
            { san: 'h4',  weight: 65 },
            { san: 'Nf3', weight: 25 },
            { san: 'h3',  weight: 10 },
          ],
        },
        // 6...h6 — prevents h5 immediately
        { san: 'h6' },
        // 7.Nf3 — develops, keeps options open
        { san: 'Nf3' },
        // 7...Nd7 — prepares Ngf6, supports centre
        { san: 'Nd7' },
        // 8.h5 — pushes bishop back
        { san: 'h5' },
        // 8...Bh7 — bishop retreats; it will stay here but isn't wasted
        { san: 'Bh7' },
        // 9.Bd3 — offers bishop exchange to weaken Black's structure
        { san: 'Bd3' },
        // 9...Bxd3 — trade it: bishop on h7 was passive anyway
        { san: 'Bxd3' },
        // 10.Qxd3
        { san: 'Qxd3' },
        // 10...e6 — solidifies centre, opens Bf8
        { san: 'e6' },
        // 11.Bf4 — develops last minor piece
        { san: 'Bf4' },
        // 11...Ngf6 — develop (need file disambiguation: Ng8→f6)
        { san: 'Ngf6' },
        // 12.O-O-O — White castles queenside, sharpens play
        { san: 'O-O-O' },
        // 12...Be7 — solid; prepares 0-0
        { san: 'Be7' },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    //  LINE 2 — Classical: Nd7 / Karpov variation
    //  3.Nc3 dxe4 4.Nxe4 Nd7 5.Nf3 Ngf6 6.Nxf6+ Nxf6
    //  7.Ne5 Bg4 8.f3 Bh5 9.c3 e6 10.Bd3 Bd6
    //  11.Qe2 Qc7 12.O-O O-O
    // ══════════════════════════════════════════════════════════════
    {
      id: 'caro-classical-nd7',
      name: 'Classical: Nd7 (Karpov System)',
      description:
        '4...Nd7 avoids the symmetrical structure and aims for a solid, Karpov-style game. ' +
        'After the knight trade on f6 Black recaptures with the d7-knight and reaches ' +
        'a comfortable endgame-orientated position.',
      moves: [
        { san: 'e4' },
        { san: 'c6' },
        { san: 'd4' },
        { san: 'd5' },
        // 3.Nc3
        {
          san: 'Nc3',
          alternatives: [
            { san: 'Nc3', weight: 60 },
            { san: 'Nd2', weight: 40 },
          ],
        },
        // 3...dxe4
        { san: 'dxe4' },
        // 4.Nxe4
        { san: 'Nxe4' },
        // 4...Nd7 — Karpov's choice
        { san: 'Nd7' },
        // 5.Nf3
        { san: 'Nf3' },
        // 5...Ngf6 — second knight (g8→f6; disambiguate: both Nd7 and Ng8 can go to f6)
        { san: 'Ngf6' },
        // 6.Nxf6+ — White exchanges to open the position
        { san: 'Nxf6+' },
        // 6...Nxf6 — Nd7 recaptures
        { san: 'Nxf6' },
        // 7.Ne5 — centralises aggressively
        { san: 'Ne5' },
        // 7...Bg4 — pins or harasses; Bc8→g4 diagonal is open
        { san: 'Bg4' },
        // 8.f3 — drives the bishop back
        { san: 'f3' },
        // 8...Bh5 — retreat, keeping the bishop alive
        { san: 'Bh5' },
        // 9.c3 — supports d4
        { san: 'c3' },
        // 9...e6 — solidifies centre
        { san: 'e6' },
        // 10.Bd3
        { san: 'Bd3' },
        // 10...Bd6 — challenges the Ne5
        { san: 'Bd6' },
        // 11.Qe2
        { san: 'Qe2' },
        // 11...Qc7 — supports centre, vacates d8 for rook
        { san: 'Qc7' },
        // 12.O-O
        { san: 'O-O' },
        // 12...O-O — Black castles safely
        { san: 'O-O' },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    //  LINE 3 — Advance Variation
    //  3.e5 Bf5 4.Nf3 e6 5.Be2 c5 6.Be3 Nc6 7.O-O cxd4
    //  8.Bxd4 Nxd4 9.Nxd4 Bc5 10.Nb3 Bb6
    //  11.Nc3 Ne7 12.Qd2 Nf5
    // ══════════════════════════════════════════════════════════════
    {
      id: 'caro-advance',
      name: 'Advance Variation',
      description:
        '3.e5 closes the centre; Black immediately responds with Bf5 (before e6 blocks the bishop) ' +
        'and strikes back with c5 to undermine the d4 pawn. Leads to dynamic play.',
      moves: [
        { san: 'e4' },
        { san: 'c6' },
        { san: 'd4' },
        { san: 'd5' },
        // 3.e5 — Advance variation
        {
          san: 'e5',
          alternatives: [
            { san: 'e5',   weight: 50 },
            { san: 'Nc3',  weight: 30 },
            { san: 'exd5', weight: 20 },
          ],
        },
        // 3...Bf5! — develop BEFORE e6 traps the bishop
        { san: 'Bf5' },
        // 4.Nf3
        {
          san: 'Nf3',
          alternatives: [
            { san: 'Nf3', weight: 55 },
            { san: 'Nc3', weight: 25 },
            { san: 'h4',  weight: 20 },
          ],
        },
        // 4...e6 — supports d5
        { san: 'e6' },
        // 5.Be2 — quiet, prepares castling
        { san: 'Be2' },
        // 5...c5 — counterattack the d4 pawn
        { san: 'c5' },
        // 6.Be3 — defends d4
        {
          san: 'Be3',
          alternatives: [
            { san: 'Be3', weight: 60 },
            { san: 'c3',  weight: 40 },
          ],
        },
        // 6...Nc6 — develops, pressures d4
        { san: 'Nc6' },
        // 7.O-O
        { san: 'O-O' },
        // 7...cxd4 — capture and force exchanges
        { san: 'cxd4' },
        // 8.Bxd4
        { san: 'Bxd4' },
        // 8...Nxd4 — Nc6 captures the bishop (c6→d4: +1 file, −2 rank ✓)
        { san: 'Nxd4' },
        // 9.Nxd4 — Nf3 recaptures (f3→d4: −2 file, +1 rank ✓)
        { san: 'Nxd4' },
        // 9...Bc5 — Black's light-squared bishop develops with tempo
        { san: 'Bc5' },
        // 10.Nb3 — retreat knight, avoid further exchanges
        { san: 'Nb3' },
        // 10...Bb6 — bishop retreats to safety
        { san: 'Bb6' },
        // 11.Nc3 — Nb1 develops
        { san: 'Nc3' },
        // 11...Ne7 — Ng8 develops, heading for f5 (g8→e7: −2 file, −1 rank ✓)
        { san: 'Ne7' },
        // 12.Qd2
        { san: 'Qd2' },
        // 12...O-O — Black castles kingside, completing development
        { san: 'O-O' },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    //  LINE 4 — Exchange Variation
    //  3.exd5 cxd5 4.Bd3 Nc6 5.c3 Nf6 6.Bf4 Bg4
    //  7.Qb3 Qd7 8.Nd2 e6 9.Ngf3 Be7 10.O-O O-O
    // ══════════════════════════════════════════════════════════════
    {
      id: 'caro-exchange',
      name: 'Exchange Variation',
      description:
        '3.exd5 cxd5 gives a symmetrical isolated-d5 structure. Black must develop actively ' +
        'with Nc6, Nf6, and Bg4 to prevent White gaining a risk-free edge.',
      moves: [
        { san: 'e4' },
        { san: 'c6' },
        { san: 'd4' },
        { san: 'd5' },
        // 3.exd5
        {
          san: 'exd5',
          alternatives: [
            { san: 'exd5', weight: 70 },
            { san: 'Nc3',  weight: 30 },
          ],
        },
        // 3...cxd5 — recapture, maintaining the pawn structure
        { san: 'cxd5' },
        // 4.Bd3 — natural development
        { san: 'Bd3' },
        // 4...Nc6 — develops, supports d5
        { san: 'Nc6' },
        // 5.c3 — supports d4
        { san: 'c3' },
        // 5...Nf6 — develops Ng8
        { san: 'Nf6' },
        // 6.Bf4 — develops bishop outside the pawn chain
        {
          san: 'Bf4',
          alternatives: [
            { san: 'Bf4', weight: 65 },
            { san: 'Nf3', weight: 35 },
          ],
        },
        // 6...Bg4 — active bishop development, pins/threatens Nf3
        { san: 'Bg4' },
        // 7.Qb3 — attacks b7 and d5
        { san: 'Qb3' },
        // 7...Qd7 — defends b7, keeps d5 supported
        { san: 'Qd7' },
        // 8.Nd2 — develops without allowing Bg4 pin on Nf3
        { san: 'Nd2' },
        // 8...e6 — solidifies centre, opens Bf8
        { san: 'e6' },
        // 9.Ngf3 — Ng1→f3; need disambiguation (Nd2 can also go to f3)
        { san: 'Ngf3' },
        // 9...Be7 — Bf8 develops (path f8→e7 clear after e6)
        { san: 'Be7' },
        // 10.O-O
        { san: 'O-O' },
        // 10...O-O — Black castles safely
        { san: 'O-O' },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    //  LINE 5 — Classical: Steinitz / Bc4 variation
    //  3.Nc3 dxe4 4.Nxe4 Nd7 5.Bc4 Ngf6 6.Ng5 e6
    //  7.Qe2 Nb6 8.Bb3 h6 9.N5f3 c5 10.dxc5 Bxc5
    // ══════════════════════════════════════════════════════════════
    {
      id: 'caro-steinitz',
      name: 'Classical: Steinitz (5.Bc4)',
      description:
        '5.Bc4 aims at e6/f7. Black answers with Ngf6, forcing the knight away with e6 and h6, ' +
        'then blows open the centre with c5. A sharp, important sideline to know.',
      moves: [
        { san: 'e4' },
        { san: 'c6' },
        { san: 'd4' },
        { san: 'd5' },
        // 3.Nc3
        {
          san: 'Nc3',
          alternatives: [
            { san: 'Nc3', weight: 60 },
            { san: 'Nd2', weight: 40 },
          ],
        },
        // 3...dxe4
        { san: 'dxe4' },
        // 4.Nxe4
        { san: 'Nxe4' },
        // 4...Nd7 — Karpov-style development
        { san: 'Nd7' },
        // 5.Bc4 — Steinitz attack, eyes f7
        { san: 'Bc4' },
        // 5...Ngf6 — develop, attack e4 knight (Ng8→f6; disambiguate from Nd7)
        { san: 'Ngf6' },
        // 6.Ng5 — Ne4→g5, attacks e6
        { san: 'Ng5' },
        // 6...e6 — closes the attack, prepares development
        { san: 'e6' },
        // 7.Qe2 — keeps the tension
        { san: 'Qe2' },
        // 7...Nb6 — Nd7→b6, attacks Bc4 (d7→b6: −2 file, −1 rank ✓)
        { san: 'Nb6' },
        // 8.Bb3 — retreat bishop
        { san: 'Bb3' },
        // 8...h6 — kicks the Ng5
        { san: 'h6' },
        // 9.N5f3 — Ng5→f3 (rank-disambiguate from Ng1; both on g-file)
        { san: 'N5f3' },
        // 9...c5 — central counterplay (c6 pawn advanced to c5)
        { san: 'c5' },
        // 10.dxc5 — White captures
        { san: 'dxc5' },
        // 10...Bxc5 — Bf8 recaptures on c5 (path through e7, d6 clear)
        { san: 'Bxc5' },
      ],
    },

  ],
};

export default caroKann;
