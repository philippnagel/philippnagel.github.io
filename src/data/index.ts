import type { Market } from '../types';
import { de } from './de';
import { jp } from './jp';

export { frames } from './frames';

export const LEVEL_NAMES = ['National Grid', 'Metering Point', 'Edge Devices'];

export const markets: Market[] = [
  { id: 'de', label: 'DE', levels: de },
  { id: 'jp', label: 'JP', levels: jp },
];

export const marketById = (id: string): Market => markets.find((m) => m.id === id) ?? markets[0]!;
