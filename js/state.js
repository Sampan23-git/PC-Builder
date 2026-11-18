import { categories } from './config.js';
export const state = { build: {}, comparison: [], catalog: null };
let pending;
export async function loadCatalog() {
  if (state.catalog) return state.catalog;
  if (pending) return pending;
  pending = Promise.all(
    Object.keys(categories).map(async (category) => {
      const response = await fetch('data/' + category + '.json');
      if (!response.ok) throw new Error('Не завантажено ' + category + '.json');
      const records = await response.json();
      if (!Array.isArray(records) || !records.length)
        throw new Error('Порожня категорія ' + category);
      const ids = new Set();
      for (const p of records) {
        if (
          !p.id ||
          ids.has(p.id) ||
          p.category !== category ||
          typeof p.name !== 'string' ||
          !Number.isFinite(p.price) ||
          p.price < 0 ||
          !p.specs ||
          !p.compatibility
        )
          throw new Error('Некоректні дані ' + category);
        ids.add(p.id);
      }
      return [category, records];
    }),
  ).then((entries) => (state.catalog = Object.fromEntries(entries)));
  try {
    return await pending;
  } finally {
    pending = null;
  }
}
export function findPart(id) {
  return Object.values(state.catalog || {})
    .flat()
    .find((p) => p.id === id);
}
export function selectPart(id) {
  const part = findPart(id);
  if (!part) throw new Error('Комплектуючу не знайдено');
  state.build[part.category] = { part, quantity: 1 };
}
export function setQuantity(category, value) {
  if (
    !['ram', 'storage'].includes(category) ||
    !state.build[category] ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 4
  )
    return false;
  state.build[category].quantity = value;
  return true;
}
export function applyPreset(preset) {
  state.build = {};
  Object.values(preset.parts).forEach(selectPart);
}
