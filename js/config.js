export const categories = {
  cpus: { label: 'Процесори', singular: 'Процесор', short: 'CPU' },
  gpus: { label: 'Відеокарти', singular: 'Відеокарта', short: 'GPU' },
  motherboards: { label: 'Материнські плати', singular: 'Материнська плата', short: 'MB' },
  ram: { label: 'Оперативна пам’ять', singular: 'Оперативна пам’ять', short: 'RAM' },
  storage: { label: 'Накопичувачі', singular: 'Накопичувач', short: 'SSD' },
  psus: { label: 'Блоки живлення', singular: 'Блок живлення', short: 'PSU' },
  cases: { label: 'Корпуси', singular: 'Корпус', short: 'CASE' },
  coolers: { label: 'Охолодження', singular: 'Охолодження', short: 'FAN' },
};
export const money = (n) =>
  new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(n) + ' ₴';
export const number = (n) => new Intl.NumberFormat('uk-UA').format(n);
export const escapeHTML = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const presets = [
  {
    id: 'starter',
    name: 'Ігровий 1080p',
    caption: 'Доступний старт для щоденних ігор',
    parts: {
      cpus: 'cpu-1',
      gpus: 'gpu-1',
      motherboards: 'mb-1',
      ram: 'ram-1',
      storage: 'ssd-1',
      psus: 'psu-1',
      cases: 'case-1',
      coolers: 'cooler-1',
    },
  },
  {
    id: 'balanced',
    name: 'Геймер 1440p',
    caption: 'Більше деталей. Більше можливостей.',
    parts: {
      cpus: 'cpu-2',
      gpus: 'gpu-2',
      motherboards: 'mb-2',
      ram: 'ram-2',
      storage: 'ssd-2',
      psus: 'psu-2',
      cases: 'case-2',
      coolers: 'cooler-2',
    },
  },
  {
    id: 'studio',
    name: 'Творець 4K',
    caption: 'Для складних сцен і великих проєктів',
    parts: {
      cpus: 'cpu-3',
      gpus: 'gpu-3',
      motherboards: 'mb-3',
      ram: 'ram-3',
      storage: 'ssd-3',
      psus: 'psu-3',
      cases: 'case-3',
      coolers: 'cooler-3',
    },
  },
];
