import { AuraAccent } from '../components/ui/AuraCard';

export type RideOptionId = 'lux' | 'pulse' | 'share';

export interface RideOptionConfig {
  id: RideOptionId;
  accent: AuraAccent;
  delayMs: number;
  surgeMultiplier?: number;
}

export const rideOptions: RideOptionConfig[] = [
  {
    id: 'lux',
    accent: 'primary',
    delayMs: 20,
  },
  {
    id: 'pulse',
    accent: 'secondary',
    delayMs: 60,
    surgeMultiplier: 1.2,
  },
  {
    id: 'share',
    accent: 'primary',
    delayMs: 100,
    surgeMultiplier: 0.9,
  },
];

export interface DestinationPreset {
  id: 'vibeDistrict' | 'equinoxHub' | 'skyGarden';
  labelKey: `ride.recent.${DestinationPreset['id']}`;
  coordinate: [number, number];
  radius?: number;
}

export const destinationPresets: DestinationPreset[] = [
  {
    id: 'vibeDistrict',
    labelKey: 'ride.recent.vibeDistrict',
    coordinate: [-73.985428, 40.758896],
    radius: 1.8,
  },
  {
    id: 'equinoxHub',
    labelKey: 'ride.recent.equinoxHub',
    coordinate: [-73.9772, 40.7527],
    radius: 2,
  },
  {
    id: 'skyGarden',
    labelKey: 'ride.recent.skyGarden',
    coordinate: [-73.968956, 40.785091],
    radius: 2.2,
  },
];
