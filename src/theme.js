import { useColorScheme } from 'react-native';

const light = {
  bg: '#eaf0ef', surface: '#f8fbfa', ink: '#12262b', muted: '#546a6e', line: '#cdd9d8',
  water: '#2563d6', sleep: '#6d4fc2', steps: '#0f8a6b', active: '#c98500', mood: '#c2255c', weight: '#12262b',
  danger: '#b42318',
};

const dark = {
  bg: '#0e1a1d', surface: '#142428', ink: '#e6f0ee', muted: '#93a9ac', line: '#2a3f44',
  water: '#6c9cff', sleep: '#a58bf0', steps: '#3fc8a2', active: '#f0b429', mood: '#f06595', weight: '#e6f0ee',
  danger: '#ff8a80',
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}

// Metric definitions. `ring: true` means it gets a goal, a progress ring and a stepper.
export const METRICS = {
  water:  { label: 'Water',       unit: 'glasses', step: 1,    ring: true, hint: 'One glass is about 250 ml' },
  sleep:  { label: 'Sleep',       unit: 'hours',   step: 0.5,  ring: true, hint: 'Last night, in hours' },
  steps:  { label: 'Steps',       unit: 'steps',   step: 1000, ring: true, hint: 'Tap + to add 1,000, or type the total' },
  active: { label: 'Active time', unit: 'min',     step: 10,   ring: true, hint: 'Exercise or brisk movement' },
  weight: { label: 'Weight',      unit: 'kg' },
  mood:   { label: 'Mood',        unit: '/ 5' },
};

export const RING_KEYS = ['water', 'sleep', 'steps', 'active'];
export const MOODS = ['Rough', 'Low', 'Okay', 'Good', 'Great'];
