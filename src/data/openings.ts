import type { Opening } from '../types';
import staffordGambit from './stafford';
import danishGambitRefutation from './danishGambit';
import caroKann from './caroKann';

/**
 * Master registry of all openings.
 * To add a new opening: create a file in ./openings/, define the Opening
 * object, and add it to this array.
 */
export const OPENINGS: Opening[] = [staffordGambit, danishGambitRefutation, caroKann];

export function getOpeningById(id: string): Opening | undefined {
  return OPENINGS.find((o) => o.id === id);
}
