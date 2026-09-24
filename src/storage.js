import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'vitals:v1';

export const DEFAULT_STATE = {
  goals: { water: 8, sleep: 8, steps: 10000, active: 30 },
  unit: 'kg',
  days: {},
};

export function normalize(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    goals: { ...DEFAULT_STATE.goals, ...(s.goals || {}) },
    unit: s.unit === 'lb' ? 'lb' : 'kg',
    days: s.days && typeof s.days === 'object' ? s.days : {},
  };
}

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  } catch (e) {
    return normalize(null);
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // Storage full or unavailable; the in-memory state keeps working.
  }
}
