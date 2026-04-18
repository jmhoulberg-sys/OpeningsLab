import type { Opening } from '../types';

/**
 * Danish Gambit Refutation — complete Black repertoire.
 * Based on the Lichess study by GM RebeccaHarris (udExyu0p).
 *
 * Player color: Black.
 *
 * Setup sequence (shared prefix of every line):
 *   1.e4 e5  2.d4 exd4  3.c3
 *
 * All lines are FULL move sequences from move 1.
 * Indices 0–4 are the shared setup (played during setup phase).
 * All moves verified legal with chess.js.
 *
 * Two top-level choices for Black after 3.c3:
 *   A) 3...dxc3  — Tactical Refutation (lines 1–4)
 *   B) 3...d5    — Positional Refutation (lines 5–8)
 */
const danishGambitRefutation: Opening = {
  id: 'danish-gambit-refutation',
  name: 'Danish Gambit Refutation',
  description:
    'Black\'s complete refutation of the Danish Gambit (1.e4 e5 2.d4 exd4 3.c3). ' +
    'Either accept the gambit for a winning tactical shot (3...dxc3), or decline ' +
    'with 3...d5 for a lasting positional edge. Based on GM RebeccaHarris\'s study.',
  playerColor: 'black',

  // 1.e4 e5 2.d4 exd4 3.c3
  setupMoves: ['e4', 'e5', 'd4', 'exd4', 'c3'],

  lines: [

    // ═══════════════════════════════════════════════════════════════
    //  A) TACTICAL REFUTATION: 3...dxc3
    // ═══════════════════════════════════════════════════════════════

    // ─── Line 1: Main Line — vs 4.Bc4 7.Nc3 ────────────────────────
    // 3...dxc3 4.Bc4 cxb2 5.Bxb2 Nf6 6.e5 Bb4+ 7.Nc3 d5!
    // 8.exf6 Qxf6! 9.Qe2+ Be6 10.Bxd5 Bxc3+ 11.Bxc3 Qxc3+  ← Black winning
    {
      id: 'danish-tactical-main',
      name: 'Tactical: Main Line',
      description:
        '3...dxc3 4.Bc4 cxb2 5.Bxb2 Nf6 6.e5 Bb4+ 7.Nc3 d5! 8.exf6 Qxf6! ' +
        '9.Qe2+ Be6 10.Bxd5 Bxc3+ 11.Bxc3 Qxc3+ — Black wins a piece. The most critical line.',
      moves: [
        // ── Setup (indices 0–4) ──
        { san: 'e4' },
        { san: 'e5' },
        { san: 'd4' },
        { san: 'exd4' },
        { san: 'c3' },
        // ── Line ─────────────────
        // 3...dxc3 — accept the gambit!
        { san: 'dxc3' },
        // 4.Bc4 — main: White develops aggressively (≈7M Lichess games vs 1.5M for 4.Nxc3)
        {
          san: 'Bc4',
          alternatives: [
            { san: 'Bc4',  weight: 80 },
            { san: 'Nxc3', weight: 15 },
            { san: 'bxc3', weight: 5  },
          ],
        },
        // 4...cxb2 — take the second pawn
        { san: 'cxb2' },
        // 5.Bxb2 — recapture
        { san: 'Bxb2' },
        // 5...Nf6 — develop, ignoring material deficit
        { san: 'Nf6' },
        // 6.e5 — attacks the Nf6 (most common)
        {
          san: 'e5',
          alternatives: [
            { san: 'e5',  weight: 55 },
            { san: 'Nc3', weight: 20 },
            { san: 'Nf3', weight: 15 },
            { san: 'Qb3', weight: 6  },
            { san: 'Nd2', weight: 4  },
          ],
        },
        // 6...Bb4+ — check, forcing White to block awkwardly
        { san: 'Bb4+' },
        // 7.Nc3 — by far the most common; blocks but allows the killer ...d5
        {
          san: 'Nc3',
          alternatives: [
            { san: 'Nc3', weight: 60 },
            { san: 'Nd2', weight: 22 },
            { san: 'Bc3', weight: 10 },
            { san: 'Kf1', weight: 8  },
          ],
        },
        // 7...d5! — the key move: opens the dark-squared bishop, attacks Bc4
        { san: 'd5' },
        // 8.exf6 — captures the knight (main, leads to forced loss)
        {
          san: 'exf6',
          alternatives: [
            { san: 'exf6', weight: 65 },
            { san: 'exd6', weight: 20 },
            { san: 'e6',   weight: 15 },
          ],
        },
        // 8...Qxf6! — crucial: don't capture bishop yet — queen centralises with tempo
        { san: 'Qxf6' },
        // 9.Qe2+ — most popular, loses instantly
        {
          san: 'Qe2+',
          alternatives: [
            { san: 'Qe2+', weight: 60 },
            { san: 'Ne2',  weight: 25 },
            { san: 'Bb5+', weight: 15 },
          ],
        },
        // 9...Be6 — blocks check, bishop steps to perfect square
        { san: 'Be6' },
        // 10.Bxd5 — grabs the pawn, but Black's response is devastating
        {
          san: 'Bxd5',
          alternatives: [
            { san: 'Bxd5',   weight: 60 },
            { san: 'O-O-O', weight: 25 },
            { san: 'Bb5+',  weight: 15 },
          ],
        },
        // 10...Bxc3+ — win the knight with check!
        { san: 'Bxc3+' },
        // 11.Bxc3 — forced recapture
        { san: 'Bxc3' },
        // 11...Qxc3+ — Black wins the bishop too; position is lost for White
        { san: 'Qxc3+' },
      ],
    },

    // ─── Line 2: Tactical — vs 7.Nd2 ───────────────────────────────
    // 3...dxc3 4.Bc4 cxb2 5.Bxb2 Nf6 6.e5 Bb4+ 7.Nd2 d5!
    // 8.exf6 dxc4 9.fxg7 Rg8  ← pawn on g7 is trapped; Black is winning
    {
      id: 'danish-tactical-nd2',
      name: 'Tactical: vs 7.Nd2',
      description:
        'After 7.Nd2, Black strikes back with d5! 8.exf6 dxc4 9.fxg7 Rg8 — ' +
        'the g7 pawn is trapped by the rook. Black has won a piece and a pawn.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'd4' },
        { san: 'exd4' },
        { san: 'c3' },
        { san: 'dxc3' },
        {
          san: 'Bc4',
          alternatives: [
            { san: 'Bc4',  weight: 80 },
            { san: 'Nxc3', weight: 15 },
            { san: 'bxc3', weight: 5  },
          ],
        },
        { san: 'cxb2' },
        { san: 'Bxb2' },
        { san: 'Nf6' },
        {
          san: 'e5',
          alternatives: [
            { san: 'e5',  weight: 55 },
            { san: 'Nc3', weight: 20 },
            { san: 'Nf3', weight: 15 },
            { san: 'Qb3', weight: 6  },
            { san: 'Nd2', weight: 4  },
          ],
        },
        { san: 'Bb4+' },
        // 7.Nd2 — second most common, allows ...d5! too
        { san: 'Nd2' },
        // 7...d5! — same idea as vs Nc3
        { san: 'd5' },
        // 8.exf6 — takes the knight
        {
          san: 'exf6',
          alternatives: [
            { san: 'exf6', weight: 55 },
            { san: 'exd6', weight: 25 },
            { san: 'Bb3',  weight: 20 },
          ],
        },
        // 8...dxc4 — grab the bishop before recapturing!
        { san: 'dxc4' },
        // 9.fxg7 — pawn storms to g7
        { san: 'fxg7' },
        // 9...Rg8 — rook contains the pawn; White's initiative evaporates
        { san: 'Rg8' },
      ],
    },

    // ─── Line 3: Tactical — vs 7.Bc3 (Qe7! Ng8 resource) ───────────
    // 3...dxc3 4.Bc4 cxb2 5.Bxb2 Nf6 6.e5 Bb4+ 7.Bc3 Qe7!
    // 8.Qe2 Ng8! 9.Nf3 Nh6 10.O-O O-O 11.Bxb4 Qxb4 12.a3 Qe7
    // 13.Nc3 Nc6 14.Nd5 Qd8 — Black is clearly better
    {
      id: 'danish-tactical-bc3',
      name: 'Tactical: vs 7.Bc3 (Qe7!)',
      description:
        '7.Bc3 Qe7! — the queen pins the bishop. 8.Qe2 Ng8! retreats the knight ' +
        'to re-route to h6 via the knight manoeuvre. White cannot generate an attack ' +
        'and Black\'s position is rock-solid.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'd4' },
        { san: 'exd4' },
        { san: 'c3' },
        { san: 'dxc3' },
        {
          san: 'Bc4',
          alternatives: [
            { san: 'Bc4',  weight: 80 },
            { san: 'Nxc3', weight: 15 },
            { san: 'bxc3', weight: 5  },
          ],
        },
        { san: 'cxb2' },
        { san: 'Bxb2' },
        { san: 'Nf6' },
        {
          san: 'e5',
          alternatives: [
            { san: 'e5',  weight: 55 },
            { san: 'Nc3', weight: 20 },
            { san: 'Nf3', weight: 15 },
            { san: 'Qb3', weight: 6  },
            { san: 'Nd2', weight: 4  },
          ],
        },
        { san: 'Bb4+' },
        // 7.Bc3 — bishop blocks the check (only ≈2,500 Lichess games)
        { san: 'Bc3' },
        // 7...Qe7! — pins the Bc3, stops e5-e6
        { san: 'Qe7' },
        // 8.Qe2 — trying to unpin and develop
        {
          san: 'Qe2',
          alternatives: [
            { san: 'Qe2', weight: 60 },
            { san: 'Nf3', weight: 25 },
            { san: 'a3',  weight: 15 },
          ],
        },
        // 8...Ng8! — un-develop to re-route to h6→f5; White can't exploit the tempo
        { san: 'Ng8' },
        // 9.Nf3
        { san: 'Nf3' },
        // 9...Nh6 — on the way to f5 or g4
        { san: 'Nh6' },
        // 10.O-O
        { san: 'O-O' },
        // 10...O-O
        { san: 'O-O' },
        // 11.Bxb4 — White trades off the pinning bishop
        {
          san: 'Bxb4',
          alternatives: [
            { san: 'Bxb4', weight: 55 },
            { san: 'a3',   weight: 25 },
            { san: 'Nc3',  weight: 20 },
          ],
        },
        // 11...Qxb4 — recapture, queen well placed on b4
        { san: 'Qxb4' },
        // 12.a3
        { san: 'a3' },
        // 12...Qe7 — queen retreats to ideal post, eyeing e4
        { san: 'Qe7' },
        // 13.Nc3
        { san: 'Nc3' },
        // 13...Nc6 — development
        { san: 'Nc6' },
        // 14.Nd5
        { san: 'Nd5' },
        // 14...Qd8 — queen retreats, knight blockades d5; Black is better
        { san: 'Qd8' },
      ],
    },

    // ─── Line 4: Tactical — vs 4.Nxc3 (Bc5! resource) ──────────────
    // 3...dxc3 4.Nxc3 Bc5! 5.Bc4 d6 6.Nf3 Nf6 7.O-O O-O 8.Bg5 Nbd7
    // 9.Nd5 c6 10.Nxf6+ Nxf6 11.Qc2 h6 12.Bh4 d5 13.exd5 cxd5
    // 14.Rad1 Qd6 15.Bxf6 Qxf6 16.Bxd5 Bb6 17.Rfe1 Bf5
    {
      id: 'danish-tactical-nxc3',
      name: 'Tactical: vs 4.Nxc3 (Bc5!)',
      description:
        '4.Nxc3 is objectively superior but very rare. Black responds with Bc5! ' +
        'to cement the bishop on c5 with ...d6. After precise development, Black ' +
        'ends up with the bishop pair and strong initiative.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'd4' },
        { san: 'exd4' },
        { san: 'c3' },
        { san: 'dxc3' },
        // 4.Nxc3 — recaptures with knight, objectively best
        { san: 'Nxc3' },
        // 4...Bc5! — crucial: bishop to ideal square; 4...Nf6?? 5.e5! loses
        { san: 'Bc5' },
        // 5.Bc4 — develops
        {
          san: 'Bc4',
          alternatives: [
            { san: 'Bc4', weight: 70 },
            { san: 'Nf3', weight: 20 },
            { san: 'd3',  weight: 10 },
          ],
        },
        // 5...d6 — cements the Bc5; plan is ...Nf6, ...O-O
        { san: 'd6' },
        // 6.Nf3
        { san: 'Nf3' },
        // 6...Nf6
        { san: 'Nf6' },
        // 7.O-O
        { san: 'O-O' },
        // 7...O-O
        { san: 'O-O' },
        // 8.Bg5 — pins the Nf6
        {
          san: 'Bg5',
          alternatives: [
            { san: 'Bg5', weight: 50 },
            { san: 'Qb3', weight: 25 },
            { san: 'Re1', weight: 25 },
          ],
        },
        // 8...Nbd7 — supports center; don't rush to grab e4
        { san: 'Nbd7' },
        // 9.Nd5 — White's best try: knight on d5
        {
          san: 'Nd5',
          alternatives: [
            { san: 'Nd5', weight: 50 },
            { san: 'Re1', weight: 30 },
            { san: 'Qc2', weight: 20 },
          ],
        },
        // 9...c6 — kicks the knight
        { san: 'c6' },
        // 10.Nxf6+ — trades off the defender
        { san: 'Nxf6+' },
        // 10...Nxf6 — recapture
        { san: 'Nxf6' },
        // 11.Qc2
        {
          san: 'Qc2',
          alternatives: [
            { san: 'Qc2', weight: 60 },
            { san: 'e5',  weight: 40 },
          ],
        },
        // 11...h6 — kicks the bishop, prevents Bg5xNf6 pin later
        { san: 'h6' },
        // 12.Bh4
        { san: 'Bh4' },
        // 12...d5! — central break
        { san: 'd5' },
        // 13.exd5
        { san: 'exd5' },
        // 13...cxd5 — recapture, Black has active bishops
        { san: 'cxd5' },
        // 14.Rad1
        { san: 'Rad1' },
        // 14...Qd6 — centralise queen, connect rooks
        { san: 'Qd6' },
        // 15.Bxf6
        { san: 'Bxf6' },
        // 15...Qxf6 — queen recaptures, targeting d4 square
        { san: 'Qxf6' },
        // 16.Bxd5
        { san: 'Bxd5' },
        // 16...Bb6 — bishop retreats to b6, keeps pressure on d4/f2
        { san: 'Bb6' },
        // 17.Rfe1
        { san: 'Rfe1' },
        // 17...Bf5 — bishop pair active; Black has initiative
        { san: 'Bf5' },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    //  B) POSITIONAL REFUTATION: 3...d5
    // ═══════════════════════════════════════════════════════════════

    // ─── Line 5: Positional — Main Line (vs 4.exd5) ─────────────────
    // 3...d5 4.exd5 Qxd5 5.cxd4 Nc6 6.Nf3 Bb4+ 7.Nc3 Bg4!
    // 8.Be2 Bxf3! 9.Bxf3 Qc4 10.Bxc6+ bxc6 11.Qe2+ Qxe2+ 12.Kxe2 O-O-O
    // 13.Be3 Nf6 14.Rac1 Rhe8 15.Kf3 Nd5 16.Rhd1 Bxc3 17.bxc3 Rd6
    {
      id: 'danish-positional-main',
      name: 'Positional: Main Line',
      description:
        'The safe, forcing refutation. 3...d5! forces central liquidation. ' +
        'After 11.Qe2+ Qxe2+ 12.Kxe2 O-O-O Black has rapid development, the bishop ' +
        'pair, and a lasting endgame edge. The queen trade is forced.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'd4' },
        { san: 'exd4' },
        { san: 'c3' },
        // 3...d5 — the positional refutation
        { san: 'd5' },
        // 4.exd5 — main; accepts the challenge
        {
          san: 'exd5',
          alternatives: [
            { san: 'exd5', weight: 55 },
            { san: 'e5',   weight: 20 },
            { san: 'Qxd4', weight: 15 },
            { san: 'cxd4', weight: 10 },
          ],
        },
        // 4...Qxd5 — recapture, centralise queen to blockade d4
        { san: 'Qxd5' },
        // 5.cxd4 — recover the pawn, create IQP
        { san: 'cxd4' },
        // 5...Nc6 — develop, attack d4
        { san: 'Nc6' },
        // 6.Nf3
        {
          san: 'Nf3',
          alternatives: [
            { san: 'Nf3', weight: 55 },
            { san: 'Nc3', weight: 25 },
            { san: 'Be3', weight: 20 },
          ],
        },
        // 6...Bb4+ — taking the sting out of Nc3
        { san: 'Bb4+' },
        // 7.Nc3 — the main try; allows Bg4 pin
        {
          san: 'Nc3',
          alternatives: [
            { san: 'Nc3', weight: 65 },
            { san: 'Bd2', weight: 20 },
            { san: 'Nd2', weight: 15 },
          ],
        },
        // 7...Bg4! — pin the Nf3 (the d4 pawn's only defender)
        // Do NOT take on c3 yet — that would help White develop!
        { san: 'Bg4' },
        // 8.Be2 — unpins the knight
        {
          san: 'Be2',
          alternatives: [
            { san: 'Be2', weight: 55 },
            { san: 'Be3', weight: 25 },
            { san: 'Bd2', weight: 20 },
          ],
        },
        // 8...Bxf3! — trade off the d4 defender
        { san: 'Bxf3' },
        // 9.Bxf3 — recapture
        { san: 'Bxf3' },
        // 9...Qc4! — queen steps off d5 to attack d4 and b2 simultaneously
        { san: 'Qc4' },
        // 10.Bxc6+ — White desperately trades to reduce pressure
        {
          san: 'Bxc6+',
          alternatives: [
            { san: 'Bxc6+', weight: 55 },
            { san: 'Qb3',   weight: 25 },
            { san: 'Be3',   weight: 10 },
            { san: 'd5',    weight: 10 },
          ],
        },
        // 10...bxc6 — recapture; c-file doubled but b-file opens
        { san: 'bxc6' },
        // 11.Qe2+ — forced queen trade
        { san: 'Qe2+' },
        // 11...Qxe2+ — trade queens on Black's terms
        { san: 'Qxe2+' },
        // 12.Kxe2 — king must take
        { san: 'Kxe2' },
        // 12...O-O-O — castle queenside, rook enters immediately
        { san: 'O-O-O' },
        // 13.Be3
        { san: 'Be3' },
        // 13...Nf6 — activate the knight
        { san: 'Nf6' },
        // 14.Rac1
        { san: 'Rac1' },
        // 14...Rhe8 — all Black pieces are active
        { san: 'Rhe8' },
        // 15.Kf3 — king walks to safety
        { san: 'Kf3' },
        // 15...Nd5 — knight occupies the ideal blockading square
        { san: 'Nd5' },
        // 16.Rhd1
        { san: 'Rhd1' },
        // 16...Bxc3 — remove the c3 knight when the time is right
        { san: 'Bxc3' },
        // 17.bxc3 — White now has doubled c-pawns
        { san: 'bxc3' },
        // 17...Rd6 — rook swings to attack; Black is slightly better
        { san: 'Rd6' },
      ],
    },

    // ─── Line 6: Positional — vs 4.e5? (the most common mistake) ───
    // 3...d5 4.e5 dxc3 5.Nxc3 d4 6.Nb5 Nc6 7.Nf3 Bg4 8.Be2 Bb4+
    // 9.Kf1 d3! 10.Qxd3 Qxd3 11.Bxd3 O-O-O  ← White is lost
    {
      id: 'danish-positional-e5',
      name: 'Positional: vs 4.e5? (130k games!)',
      description:
        '4.e5? was played in ~130,000 Lichess games! After dxc3 5.Nxc3 d4 6.Nb5 Nc6 ' +
        '7.Nf3 Bg4 8.Be2 Bb4+ 9.Kf1 d3! 10.Qxd3 Qxd3 11.Bxd3 O-O-O — ' +
        'Black wins the queen trade and castles queenside with a winning attack.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'd4' },
        { san: 'exd4' },
        { san: 'c3' },
        { san: 'd5' },
        // 4.e5? — very common but bad
        { san: 'e5' },
        // 4...dxc3 — now Black grabs the pawn
        { san: 'dxc3' },
        // 5.Nxc3 — recapture
        { san: 'Nxc3' },
        // 5...d4 — the pawn marches forward!
        { san: 'd4' },
        // 6.Nb5 — tries to avoid losing more
        {
          san: 'Nb5',
          alternatives: [
            { san: 'Nb5', weight: 55 },
            { san: 'Ne4', weight: 45 },
          ],
        },
        // 6...Nc6 — development; don't rush to grab e5 yet
        { san: 'Nc6' },
        // 7.Nf3
        { san: 'Nf3' },
        // 7...Bg4 — pin the Nf3
        { san: 'Bg4' },
        // 8.Be2
        { san: 'Be2' },
        // 8...Bb4+ — another check!
        { san: 'Bb4+' },
        // 9.Kf1 — forced (Nd2 and Bd2 lose differently)
        { san: 'Kf1' },
        // 9...d3! — the killer pawn advance
        { san: 'd3' },
        // 10.Qxd3 — White captures with queen
        { san: 'Qxd3' },
        // 10...Qxd3 — Black captures the queen!
        { san: 'Qxd3' },
        // 11.Bxd3 — White takes back with bishop
        { san: 'Bxd3' },
        // 11...O-O-O — castle queenside; Black has rook, knight, two bishops for queen. Winning.
        { san: 'O-O-O' },
      ],
    },

    // ─── Line 7: Positional — vs 4.Qxd4?! (Be6! main) ─────────────
    // 3...d5 4.Qxd4?! Be6!? 5.exd5 Bxd5 6.c4 Qe7+!
    // 7.Be3 Be6 8.Nc3 Nc6 9.Qd2 Rd8  ← Black leads in development
    {
      id: 'danish-positional-qxd4',
      name: 'Positional: vs 4.Qxd4?! (Be6!)',
      description:
        '4.Qxd4?! is toothless. Black plays Be6!? 5.exd5 Bxd5 6.c4 Qe7+! — ' +
        'the queen check forces concessions. 9...Rd8 gives Black a lead in development ' +
        'and excellent practical chances.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'd4' },
        { san: 'exd4' },
        { san: 'c3' },
        { san: 'd5' },
        // 4.Qxd4?! — early queen development
        { san: 'Qxd4' },
        // 4...Be6!? — simplest: develop, keep the pawn
        { san: 'Be6' },
        // 5.exd5 — main response
        {
          san: 'exd5',
          alternatives: [
            { san: 'exd5', weight: 70 },
            { san: 'Nf3',  weight: 30 },
          ],
        },
        // 5...Bxd5 — recapture
        { san: 'Bxd5' },
        // 6.c4 — attacks the bishop, develops the pawn
        { san: 'c4' },
        // 6...Qe7+! — check down the open e-file; a key resource
        { san: 'Qe7+' },
        // 7.Be3 — blocks
        {
          san: 'Be3',
          alternatives: [
            { san: 'Be3', weight: 60 },
            { san: 'Ne2', weight: 25 },
            { san: 'Kd1', weight: 15 },
          ],
        },
        // 7...Be6 — bishop retreats to safety, queen on e7 is powerful
        { san: 'Be6' },
        // 8.Nc3
        { san: 'Nc3' },
        // 8...Nc6 — development, attacks the d4 queen
        { san: 'Nc6' },
        // 9.Qd2
        { san: 'Qd2' },
        // 9...Rd8 — rook enters the open d-file; Black has excellent play
        { san: 'Rd8' },
      ],
    },

    // ─── Line 8: Positional — vs 4.Qxd4?! then 5.Nf3 (trap!) ──────
    // 3...d5 4.Qxd4?! Be6!? 5.Nf3 Nf6 6.Bg5 Nc6 7.Bb5 dxe4!
    // 8.Bxf6 Qxf6 9.Qxe4 O-O-O! 10.Bxc6 bxc6 11.Qxc6? Rd1+!! 12.Kxd1 Bb3+
    {
      id: 'danish-positional-qxd4-nf3-trap',
      name: 'Positional: vs 4.Qxd4 5.Nf3 (Rd1+!! trap)',
      description:
        '5.Nf3 Nf6 6.Bg5 Nc6 7.Bb5 dxe4! 8.Bxf6 Qxf6 9.Qxe4 O-O-O! ' +
        '10.Bxc6 bxc6 11.Qxc6? Rd1+!! 12.Kxd1 Bb3# — a stunning rook sacrifice delivers ' +
        'checkmate. The Rd1+!! is the star move.',
      moves: [
        { san: 'e4' },
        { san: 'e5' },
        { san: 'd4' },
        { san: 'exd4' },
        { san: 'c3' },
        { san: 'd5' },
        { san: 'Qxd4' },
        { san: 'Be6' },
        // 5.Nf3 — alternative development
        { san: 'Nf3' },
        // 5...Nf6
        { san: 'Nf6' },
        // 6.Bg5
        { san: 'Bg5' },
        // 6...Nc6 — develop, attack the d4 queen
        { san: 'Nc6' },
        // 7.Bb5 — pin the Nc6
        { san: 'Bb5' },
        // 7...dxe4! — win the pawn
        { san: 'dxe4' },
        // 8.Bxf6 — takes the knight to remove the e4 defender
        { san: 'Bxf6' },
        // 8...Qxf6! — take back with queen
        { san: 'Qxf6' },
        // 9.Qxe4 — White grabs the pawn
        { san: 'Qxe4' },
        // 9...O-O-O! — castle queenside; rook aims at d1
        { san: 'O-O-O' },
        // 10.Bxc6 — White removes the pinned knight
        { san: 'Bxc6' },
        // 10...bxc6 — recapture; c6 pawn guards d1 route
        { san: 'bxc6' },
        // 11.Qxc6? — White is greedy (falling for the trap)
        { san: 'Qxc6' },
        // 11...Rd1+!! — the stunning rook sacrifice!
        { san: 'Rd1+' },
        // 12.Kxd1 — forced
        { san: 'Kxd1' },
        // 12...Bb3+ — discovered checkmate!
        { san: 'Bb3+' },
      ],
    },

  ],
};

export default danishGambitRefutation;
