import type { CoachingContext, Opening, OpeningLine } from '../types';

function fallbackReason(san: string) {
  if (san.includes('+')) return 'Use the check to keep the initiative and make White solve a concrete problem right away.';
  if (san === 'O-O' || san === 'O-O-O') return 'Castle now so the rook joins the game and the rest of the position can play itself.';
  if (san.includes('x')) return 'Take here because it wins time, removes a defender, and keeps the position running on our terms.';
  if (/^Q/.test(san)) return 'Centralise the queen only because the tactics justify it and the move adds a real threat.';
  if (/^B/.test(san)) return 'Develop the bishop to an active square so it points at the key weakness in White\'s camp.';
  if (/^N/.test(san)) return 'Improve the knight to a more active square so it adds pressure without losing the thread of the position.';
  if (/^[a-h]/.test(san)) return 'This pawn move supports the structure and makes the next developing move easier to play.';
  return 'This move keeps the line together and leaves White with the harder position to handle.';
}

function staffordSetupNote(moveIndex: number, san: string) {
  const notes = [
    'Meet 1.e4 with 1...e5 so the game stays open and tactical from the very start.',
    'Develop the knight to f6 and challenge e4 immediately instead of drifting into a passive Petrov.',
    'Jump to c6 to offer the Stafford pawn and speed up the attack.',
    'Recapture with the d-pawn so both bishops and the queen get quick access to White\'s king.',
  ];
  return notes[Math.floor(moveIndex / 2)] ?? fallbackReason(san);
}

function danishSetupNote(moveIndex: number, san: string) {
  const notes = [
    'Answer 1.e4 with 1...e5 so the centre stays classical and White has to prove the gambit works.',
    'Take on d4 because the Danish only becomes dangerous if White gets free pawns and free tempi.',
  ];
  return notes[Math.floor(moveIndex / 2)] ?? fallbackReason(san);
}

function caroSetupNote(moveIndex: number, san: string) {
  const notes = [
    'Start with 1...c6 so ...d5 comes with support and the structure stays solid.',
    'Strike back with ...d5 at once and ask White to define the centre.',
  ];
  return notes[Math.floor(moveIndex / 2)] ?? fallbackReason(san);
}

function sicilianSetupNote(moveIndex: number, san: string) {
  const notes = [
    'Answer 1.e4 with 1...c5 to unbalance the game immediately and fight for d4 from the flank.',
  ];
  return notes[Math.floor(moveIndex / 2)] ?? fallbackReason(san);
}

function ruySetupNote(moveIndex: number, san: string) {
  const notes = [
    'Start with 1.e4 so the game is open and development can come with tempo.',
    'Develop the knight to f3 and attack e5 before committing the queenside pieces.',
    'Put the bishop on b5 to pressure the c6-knight, the main defender of Black central pawn.',
  ];
  return notes[Math.floor(moveIndex / 2)] ?? fallbackReason(san);
}

function queensGambitSetupNote(moveIndex: number, san: string) {
  const notes = [
    'Begin with 1.d4 to claim central space and make the c-pawn break possible.',
    'Offer c4 so Black has to decide whether to hold the center or chase a wing pawn.',
  ];
  return notes[Math.floor(moveIndex / 2)] ?? fallbackReason(san);
}

function kingsIndianSetupNote(moveIndex: number, san: string) {
  const notes = [
    'Meet 1.d4 with ...Nf6 so White cannot build the center without being watched.',
    'Fianchetto with ...g6 and prepare a bishop that will pressure the long diagonal all game.',
    'Develop the bishop to g7 before touching the center; this is the soul of the King\'s Indian.',
    'Play ...d6 to support ...e5 and invite White to overextend before the counterattack starts.',
  ];
  return notes[Math.floor(moveIndex / 2)] ?? fallbackReason(san);
}

function frenchSetupNote(moveIndex: number, san: string) {
  const notes = [
    'Answer e4 with ...e6: modest at first, but it prepares a strong strike at d5.',
    'Challenge the center with ...d5 and make White choose between space, tension, or symmetry.',
  ];
  return notes[Math.floor(moveIndex / 2)] ?? fallbackReason(san);
}

function staffordReason(lineId: string | undefined, san: string) {
  const map: Record<string, string> = {
    Bc5: 'Develop the bishop with tempo and point everything at f2, because that is where the Stafford attack usually starts.',
    Nxe4: 'Take on e4 because White cannot grab everything at once; activity and threats matter more than the queen for a few moves.',
    'Bxf2+': 'Rip open f2 and drag the king forward while White is still undeveloped.',
    'Bg4#': 'Finish the mating net now that White\'s king has no safe squares left.',
    Ng4: 'Hop into g4 so the queen and knight can start piling up pressure on h2 and f2.',
    Qh4: 'Bring the queen to h4 because the mate threats are stronger than material concerns here.',
    Nxf2: 'Sacrifice on f2 to tear away the king cover and open forcing lines.',
    'Nxh3+': 'Take on h3 with check so White\'s king gets dragged deeper into the attack.',
    'Nf2+': 'Jump back into f2 with check to keep the king boxed in.',
    'Qh1#': 'Deliver mate before White has time to untangle.',
    'Qd4+': 'Centralise the queen with tempo and pick up the rook while the king is exposed.',
    'Qh4+': 'Keep checking from h4 because the rook on h1 is hanging and White has no coordination.',
    h5: 'Push the h-pawn to prepare a direct kingside attack instead of slow manoeuvring.',
    Qd6: 'Qd6 is the quiet killer here: it points at h2 and makes the attack play itself.',
    Qd4: 'Centralise the queen on d4 so both f2 and b2 are under pressure at once.',
    Ne4: 'Retreat to e4 because the knight is safer there and the pressure on f2 becomes immediate.',
    dxc6: 'Recapture toward the centre so the c8 bishop and queen can join the attack quickly.',
  };

  if (lineId === 'drag-kings' && san === 'Bc5') {
    return 'Develop with tempo and pin White to the f2 weakness before they consolidate.';
  }

  return map[san] ?? fallbackReason(san);
}

function danishReason(lineId: string | undefined, san: string) {
  const map: Record<string, string> = {
    dxc3: 'Accept the gambit pawn and make White prove that the compensation is real.',
    cxb2: 'Take the second pawn as well; if White wants activity, they have to show it against extra material.',
    Nf6: 'Develop naturally and challenge White\'s centre before their bishops take over.',
    'Bb4+': 'Check first so White blocks awkwardly and loses the smooth development they wanted.',
    d5: lineId?.startsWith('danish-positional')
      ? 'Hit the centre with ...d5 and head for a clean, positional refutation instead of giving White a free attack.'
      : 'Break with ...d5 now, opening lines while White\'s pieces still trip over each other.',
    Qxf6: 'Recapture with the queen because central control and threats matter more than grabbing a bishop immediately.',
    Be6: 'Block the check while developing and leave White\'s pieces hanging after the storm settles.',
    'Bxc3+': 'Take on c3 with check so White loses both time and coordination.',
    'Qxc3+': 'Pick up the loose piece with check and convert the attack into material.',
    dxc4: 'Take the bishop first, because the point of the line is to win White\'s attacking piece before anything else.',
    Rg8: 'Trap the g-pawn with the rook and show that White\'s attack has already run out of fuel.',
    Qe7: 'Pin the bishop and keep e5-e6 under control before White can claim initiative.',
    Ng8: 'Step the knight back without fear because the position is closed enough for a calm regrouping.',
    Nh6: 'Route the knight toward f5 and make White work against a healthy extra pawn.',
    'O-O': 'Castle once the tactics are over and let the extra material speak.',
    Bc5: 'Develop the bishop to c5 first; this is the cleanest way to blunt White\'s activity in the Nxc3 lines.',
    d6: 'Support the bishop chain and prepare simple development rather than chasing ghosts.',
    Nbd7: 'Develop the queenside knight and keep the e5 and c5 breaks under control.',
    c6: 'Kick the advanced knight and ask White where the compensation is supposed to come from.',
    h6: 'Ask the bishop a direct question so Black can take over the dark squares.',
    cxd5: 'Recapture toward the centre and leave the bishops active in the ending.',
    Qd6: 'Centralise the queen and connect the rooks while White still has loose pieces.',
    Qc7: 'Put the queen on c7 where it supports the center and eyes c3/e5 without committing the structure.',
    e6: 'Build the Scheveningen small center and keep both ...Be7 and ...Qc7 flexible.',
    Ne5: 'Jump into e5 to centralize and make White prove the long-castle attack is fast enough.',
    Bb6: 'Retreat without regret; the bishop stays active and the extra material remains.',
    Qxd5: 'Recapture with the queen because the queen belongs in the centre in this forcing line.',
    Bg4: 'Pin the knight because it is the key defender of d4.',
    Bxf3: 'Trade off the main defender so the d4 pawn becomes a long-term target.',
    Qc4: 'The queen steps to c4 to hit both d4 and b2, which makes White defend instead of attack.',
    bxc6: 'Recapture and accept the structure, because the open files and bishop pair matter more here.',
    'Qxe2+': 'Trade queens on your terms and head for an ending where Black is easier to play.',
    'O-O-O': 'Castle long now that the queens are off and the rook can enter through the centre.',
    Rhe8: 'Place the rook on the open file and make every black piece point at the same weaknesses.',
    Nd5: 'The knight belongs on d5, where it blockades and simplifies the whole position.',
    Rd6: 'Lift the rook so it can swing across and keep White tied down.',
    d4: 'Push the pawn forward to steal space and keep White\'s pieces from coordinating.',
    Nc6: 'Develop with tempo against the advanced knight and prepare queenside castling ideas.',
  };

  return map[san] ?? fallbackReason(san);
}

function caroReason(lineId: string | undefined, san: string) {
  const map: Record<string, string> = {
    dxe4: 'Clarify the centre now so the light-squared bishop can come out cleanly.',
    Bf5: 'Develop the bishop before ...e6 shuts it in; that is one of the core Caro-Kann ideas.',
    Bg6: 'Keep the bishop pair and sidestep White\'s pawn storm without giving up the good bishop.',
    h6: 'Take h5 out of the position and make White spend another tempo to chase the bishop.',
    Nd7: 'Use ...Nd7 to stay solid and keep flexible development behind the centre.',
    Bxd3: 'Trade the bishop now that White has overextended on the kingside.',
    e6: 'Lock the centre down and open the dark-squared bishop at the same time.',
    Ngf6: 'Develop the kingside knight with support so castling and ...Be7 come naturally.',
    Be7: 'Finish development calmly; the structure is already doing a lot of the work.',
    Nxf6: 'Recapture with the knight and keep the structure compact.',
    Bg4: 'Pinning here makes White\'s centre harder to maintain and gives Black easy development.',
    Bh5: 'Retreat to h5 so the bishop stays active and White has gained no real concession.',
    Bd6: 'Challenge the advanced knight and make White justify the space grab.',
    Qc7: 'Centralise the queen behind the structure and prepare smooth castling.',
    c5: 'Strike at d4 before White can enjoy the space advantage for free.',
    Nc6: 'Develop with pressure on d4 so White always feels the central tension.',
    cxd4: 'Take on d4 to force exchanges and reduce White\'s space advantage.',
    Nxd4: 'Trade one of White\'s active pieces and simplify into a healthier structure.',
    Bc5: 'Place the bishop on its most active diagonal and make White answer a concrete threat.',
    Bb6: 'Retreat while keeping the long diagonal alive; the bishop is still doing useful work.',
    Ne7: 'Route the knight toward f5 or g6 and finish kingside development without loosening the centre.',
    'O-O': 'Castle once the central questions are settled and let the pieces work from safe squares.',
    cxd5: 'Recapture to keep the symmetrical structure and avoid giving White a target.',
    Nf6: 'Develop naturally and get ready to castle into a very stable structure.',
    Qd7: 'Defend b7 cleanly and keep the rooks connected behind the structure.',
    Nb6: 'Kick the bishop and free the d7 square for later manoeuvres.',
    Bxc5: 'Recapture with the bishop and finish the central break with full development.',
  };

  if (lineId === 'caro-classical-nd7' && san === 'Nd7') {
    return 'Choose the Karpov setup and keep the structure flexible before committing the bishop.';
  }

  return map[san] ?? fallbackReason(san);
}

function sicilianReason(lineId: string | undefined, san: string) {
  const map: Record<string, string> = {
    cxd4: 'Trade the c-pawn for White d-pawn; this is why the Sicilian creates an extra central pawn later.',
    Nf6: 'Develop with tempo on e4 so White cannot enjoy the center for free.',
    a6: 'The Najdorf ...a6 controls b5 and prepares flexible queenside expansion.',
    e5: 'Kick the knight and claim dark squares, accepting d5 as a square White must prove they can use.',
    Be6: 'Develop actively and point at a2, c4, and the queenside castling zone.',
    Be7: 'Finish development calmly before White pawn storms the kingside.',
    'O-O': 'Castle before opening the position; the counterattack works best with the king safe.',
    Nbd7: 'Bring the last minor piece in and keep c5, e5, and f6 supported.',
    g6: 'Enter the Dragon and make the bishop on g7 the main defender and attacker.',
    Bg7: 'The dragon bishop pressures c3 and b2 and often decides the queenside race.',
    Nc6: 'Develop with pressure on d4 so White cannot attack without defensive duties.',
    Nxd4: 'Remove the centralized knight before White can build a clean kingside attack.',
    d6: lineId === 'sicilian-sveshnikov' ? 'Anchor e5 and keep the knight on b5 from becoming comfortable.' : 'Support the center and prepare piece development.',
    f5: 'Strike before White consolidates; the Sveshnikov lives on active counterplay.',
    Bxf5: 'Recapture with development and leave White facing active bishops.',
    Nd5: 'Centralize the knight and block White from building an easy c3-d4 center.',
    dxe5: 'Break the Alapin center once White overextends it.',
    Na5: 'Attack the bishop and keep White pieces from settling on active squares.',
  };

  return map[san] ?? fallbackReason(san);
}

function ruyReason(_lineId: string | undefined, san: string) {
  const map: Record<string, string> = {
    Ba4: 'Keep the Spanish bishop alive; its pressure matters more than forcing an immediate exchange.',
    'O-O': 'Castle early so the rook can come to e1 and the center can be challenged safely.',
    Re1: 'Put the rook behind e4 and prepare d4 under ideal conditions.',
    Bb3: 'Retreat to the long diagonal where the bishop still eyes f7 and supports future central play.',
    c3: 'Build the classic Ruy Lopez center and prepare d4 without dropping e4.',
    h3: 'Take g4 away so Black cannot pin the knight at an annoying moment.',
    Bc2: 'Preserve the bishop pair and keep pressure on h7 and e4.',
    d4: 'Break in the center once the pieces are ready and Black has committed queenside pawns.',
    Bxc6: 'Exchange on c6 to damage Black structure and create long-term pawn targets.',
    dxe5: 'Clarify the center before Black fully coordinates.',
    Qxd8: 'Trade queens in the Berlin because White structure and development remain easy to handle.',
    Nc3: 'Develop with tempo toward the center and support the e4/e5 structure.',
    Rd1: 'Use the open file immediately and force Black king to spend another move.',
    Nxd4: 'Recapture centrally so the knight becomes active and Black c-pawns stay targets.',
    d3: 'Against the Schliemann, keep the center solid and do not let ...f5 become a free attack.',
    Bg5: 'Pin the knight and make Black prove the kingside attack is real.',
    Nd5: 'Occupy the outpost and make Black spend time resolving the pressure.',
    Rxe5: 'Accept the Marshall material only after forcing exchanges and keeping the rook active.',
  };

  return map[san] ?? fallbackReason(san);
}

function queensGambitReason(_lineId: string | undefined, san: string) {
  const map: Record<string, string> = {
    Nc3: 'Develop toward d5 and e4 while increasing the pressure on the center.',
    Bg5: 'Pin the knight so Black has a harder time defending d5 comfortably.',
    e3: 'Open the bishop and make recapturing on c4 possible without weakening the center.',
    Nf3: 'Develop naturally and keep the central tension under control.',
    Bh4: 'Preserve the pin and make Black spend another tempo if they want the bishop pair.',
    cxd5: 'Resolve the tension when Black pieces are slightly tied to d5.',
    Bxe7: 'Trade the pinned bishop at the moment it helps simplify Black defense.',
    Nxd5: 'Use the knight to remove the central blocker and leave Black with an isolated pawn.',
    e4: 'Take the full center after Black accepts the gambit pawn.',
    Bxc4: 'Recover the gambit pawn with development and keep White ahead in activity.',
    Qb3: 'Attack b7 and e6 at once, turning development lead into concrete pressure.',
    Ng5: 'Jump in with tempo and make Black defend the kingside before finishing development.',
    a4: 'Stop ...b5 in the Slav so the c4-pawn cannot be held comfortably.',
    Qe2: 'Connect the rooks and prepare central pressure without blocking the bishops.',
    dxe5: 'Accept the Albin pawn and make Black justify the advanced d-pawn.',
    g3: 'Fianchetto calmly so the king is safe against Black long-castling ideas.',
    Nbd2: 'Develop without blocking the c-pawn structure and keep e4 covered.',
    Bg2: 'Put the bishop on the long diagonal where it fights the d5 and b7 squares.',
    Qc2: 'Defend c3 and keep the queen flexible against Cambridge Springs pressure.',
    Bd3: 'Develop toward h7 while adding support to the e4 and c4 recovery ideas.',
  };

  return map[san] ?? fallbackReason(san);
}

function kingsIndianReason(_lineId: string | undefined, san: string) {
  const map: Record<string, string> = {
    'O-O': 'Castle first; the King\'s Indian counterattack starts from a secure king.',
    e5: 'Challenge White center directly and ask whether they want tension or a locked pawn chain.',
    Nc6: 'Develop with pressure on d4 and prepare to reroute if White closes the center.',
    Ne7: 'Head toward g6 or c8 and clear the f-pawn for the kingside break.',
    Nd7: 'Support ...f5 and keep the knight flexible behind the pawn chain.',
    f5: 'This is the main lever: attack the base of White kingside and open files near their king.',
    c6: 'Prepare queenside counterplay against the Saemisch center before White attacks your king.',
    a6: 'Prepare ...b5 and make White long-castling less comfortable.',
    b5: 'Start the queenside race immediately before White kingside pieces arrive.',
    Bxh6: 'Trade off White attacking bishop so the dark squares around your king are less fragile.',
    exd4: 'Open the e-file when White structure is fixed and your rook is ready to use it.',
    Re8: 'Put the rook opposite White king and queen lines; every exchange now helps Black activity.',
    c5: 'Hit the oversized Four Pawns center before it rolls forward.',
    e6: 'Undermine d5 and make White central pawns choose what they are defending.',
    dxe5: 'Remove the advanced pawn and open the center once White has overextended.',
    a5: 'Slow White queenside expansion and prepare the knight route through a6 to c5.',
    Na6: 'Head for c5, where the knight pressures e4 and b3 from a safer square.',
    Qe8: 'Connect the queen to the kingside and support both ...Nc5 and later ...f5 ideas.',
  };

  return map[san] ?? fallbackReason(san);
}

function frenchReason(_lineId: string | undefined, san: string) {
  const map: Record<string, string> = {
    c5: 'Attack the base of White pawn chain; in the French, d4 is the target.',
    Nc6: 'Add pressure on d4 and make White defend before attacking.',
    Qb6: 'Hit d4 and b2 at the same time, forcing White to spend tempi on defense.',
    Nh6: 'Route the knight toward f5 where it attacks d4 without blocking the c-pawn.',
    cxd4: 'Trade into the base of the pawn chain and reduce White space advantage.',
    Nf5: 'Land on f5 to pressure d4 and h4 while staying hard to chase.',
    Be7: 'Develop quietly and prepare castling once the central pressure is established.',
    Bb4: 'Pin the c3-knight so White e4/e5 center has less support.',
    'Bxc3+': 'Give up the bishop to damage White structure and create long-term dark-square targets.',
    Ne7: 'Develop toward f5 or g6 without blocking the c-pawn break.',
    Qc7: 'Pressure e5 and c3 while preparing queenside development.',
    b6: 'Prepare ...Ba6 to trade White strong dark-squared bishop.',
    Ba6: 'Challenge the bishop on d3 and reduce White attacking chances.',
    Nf6: 'Attack e4/e5 and force White to define the central structure.',
    Nfd7: 'Retreat the knight so ...c5 and ...f6 can attack the pawn chain.',
    f6: 'The second French break: attack e5 once d4 has been pressured.',
    Nxd4: 'Take the loose central pawn after White pieces are overloaded.',
    exd5: 'Recapture symmetrically and keep the Exchange French simple but active.',
    Bd6: 'Develop toward h2 and make White watch kingside tactics.',
    Bg4: 'Pin the knight and create play in a symmetrical structure.',
    Nbd7: 'Finish development and support both ...c5 and ...e5 ideas later.',
    dxe4: 'Choose the Rubinstein simplification and remove White attacking center before it rolls forward.',
    Ngf6: 'Develop the kingside knight to challenge e4 and prepare a clean recapture on f6.',
  };

  return map[san] ?? fallbackReason(san);
}

export function getCoachingNote(
  opening: Opening | null,
  line: OpeningLine | null,
  phase: 'setup' | 'training',
  moveIndex: number,
  san: string | null,
) {
  if (!opening || !san) return null;

  const context: CoachingContext = {
    openingId: opening.id,
    lineId: line?.id,
    san,
    phase,
    moveIndex,
  };

  if (context.phase === 'setup') {
    if (context.openingId === 'stafford-gambit') return staffordSetupNote(moveIndex, san);
    if (context.openingId === 'danish-gambit-refutation') return danishSetupNote(moveIndex, san);
    if (context.openingId === 'caro-kann') return caroSetupNote(moveIndex, san);
    if (context.openingId === 'sicilian-defense') return sicilianSetupNote(moveIndex, san);
    if (context.openingId === 'ruy-lopez') return ruySetupNote(moveIndex, san);
    if (context.openingId === 'queens-gambit') return queensGambitSetupNote(moveIndex, san);
    if (context.openingId === 'kings-indian') return kingsIndianSetupNote(moveIndex, san);
    if (context.openingId === 'french-defense') return frenchSetupNote(moveIndex, san);
  }

  if (context.openingId === 'stafford-gambit') return staffordReason(context.lineId, san);
  if (context.openingId === 'danish-gambit-refutation') return danishReason(context.lineId, san);
  if (context.openingId === 'caro-kann') return caroReason(context.lineId, san);
  if (context.openingId === 'sicilian-defense') return sicilianReason(context.lineId, san);
  if (context.openingId === 'ruy-lopez') return ruyReason(context.lineId, san);
  if (context.openingId === 'queens-gambit') return queensGambitReason(context.lineId, san);
  if (context.openingId === 'kings-indian') return kingsIndianReason(context.lineId, san);
  if (context.openingId === 'french-defense') return frenchReason(context.lineId, san);
  return fallbackReason(san);
}
