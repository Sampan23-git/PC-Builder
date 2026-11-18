import { categories, escapeHTML as e, money } from './config.js';
import { state } from './state.js';
import { checkCompatibility } from './compatibility.js';
export const labels = {
  cores: 'Ядер',
  threads: 'Потоків',
  powerW: 'Споживання, Вт',
  demoIndex: 'Навчальний індекс',
  vramGB: 'Відеопам’ять, ГБ',
  capacityGB: 'Обсяг, ГБ',
  speedMHz: 'Частота, МГц',
  readMBs: 'Читання, МБ/с',
  watts: 'Потужність, Вт',
  efficiency: 'Клас ефективності',
  socket: 'Сокет',
  memoryType: 'Тип RAM',
  modules: 'Модулів у наборі',
  heightMm: 'Висота, мм',
  profile: 'Профіль пам’яті',
  formFactor: 'Форм-фактор',
  lengthMm: 'Довжина, мм',
  widthMm: 'Ширина, мм',
  cableClearanceMm: 'Зазор кабелю, мм',
  slots: 'Зайняті слоти',
  memorySlots: 'Слотів RAM',
  maxMemoryGB: 'Ліміт RAM, ГБ',
  m2Slots: 'Слотів M.2',
  m2Lengths: 'Довжина M.2',
  sataPorts: 'SATA-портів',
  eps8: 'EPS 8-pin',
  installedBios: 'Версія BIOS',
  biosOrder: 'Порядок версій BIOS',
  cpuSupport: 'Підтримка CPU / BIOS',
  interface: 'Інтерфейс',
  length: 'Розмір M.2',
  sizeInch: 'Формат, дюймів',
  sataPower: 'Роз’ємів SATA',
  boardFormats: 'Формати плат',
  gpuLengthMm: 'Ліміт довжини GPU, мм',
  gpuWidthMm: 'Простір GPU + кабель, мм',
  coolerHeightMm: 'Ліміт висоти кулера, мм',
  psuFormats: 'Формати PSU',
  psuLengthMm: 'Ліміт довжини PSU, мм',
  expansionSlots: 'Слотів корпусу',
  driveBays25: 'Місць 2,5″',
  radiators: 'Місця радіаторів',
  type: 'Тип охолодження',
  sockets: 'Кріплення',
  ramClearanceMm: 'Зазор RAM, мм',
  coolingW: 'Навчальна теплова межа, Вт',
  mount: 'Місце радіатора',
  radiatorMm: 'Розмір радіатора, мм',
  radiatorThicknessMm: 'Товщина радіатора, мм',
  fanThicknessMm: 'Товщина вентиляторів, мм',
  connectors: 'Роз’єми GPU',
};
export function formatValue(v) {
  if (v === null || v === undefined) return 'Невідомо';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object')
    return Object.entries(v)
      .map(([k, x]) => k + ': ' + formatValue(x))
      .join('; ');
  return { air: 'Повітряне', liquid: 'Рідинне', top: 'Зверху', front: 'Спереду' }[v] || String(v);
}
export const demoNote =
  '<div class="demo-note">Навчальний каталог: усі ціни й характеристики демонстраційні. Для купівлі перевіряйте точну модель, ревізію та документацію виробника.</div>';
export function candidateChecks(part, bios = '') {
  const build = { ...state.build, [part.category]: { part, quantity: 1 } };
  return checkCompatibility(build, part.category === 'motherboards' ? '' : bios);
}
export function filterProducts(products, filters, build = state.build) {
  const query = (filters.query || '').trim().toLocaleLowerCase('uk-UA');
  const max = filters.max === '' || filters.max === undefined ? Infinity : Number(filters.max);
  let result = products.filter(
    (p) =>
      (!query ||
        (p.name + ' ' + p.brand + ' ' + p.description)
          .toLocaleLowerCase('uk-UA')
          .includes(query)) &&
      (!filters.brand || p.brand === filters.brand) &&
      p.price <= max &&
      (!filters.spec || Object.values(p.compatibility).some((v) => String(v) === filters.spec)) &&
      (!filters.compatible ||
        !checkCompatibility({ ...build, [p.category]: { part: p, quantity: 1 } }).some(
          (x) => x.status === 'error',
        )),
  );
  return result.sort((a, b) =>
    filters.sort === 'price-desc'
      ? b.price - a.price
      : filters.sort === 'name'
        ? a.name.localeCompare(b.name, 'uk')
        : a.price - b.price,
  );
}
export function controls(prefix, category, picker = false) {
  const items = state.catalog[category],
    brands = [...new Set(items.map((p) => p.brand))];
  const specKey = {
    cpus: 'socket',
    gpus: null,
    motherboards: 'socket',
    ram: 'memoryType',
    storage: 'interface',
    psus: 'formFactor',
    cases: null,
    coolers: 'type',
  }[category];
  const specs = specKey ? [...new Set(items.map((p) => p.compatibility[specKey]))] : [];
  return (
    '<form class="filters" data-filter-form="' +
    prefix +
    '" autocomplete="off"><div class="row g-3">' +
    (!picker
      ? '<div class="col-12 col-md-4"><label class="form-label" for="' +
        prefix +
        '-category">Категорія</label><select class="form-select" id="' +
        prefix +
        '-category" name="category">' +
        Object.entries(categories)
          .map(
            ([k, v]) =>
              '<option value="' +
              k +
              '" ' +
              (k === category ? 'selected' : '') +
              '>' +
              v.label +
              '</option>',
          )
          .join('') +
        '</select></div>'
      : '') +
    '<div class="col-12 ' +
    (picker ? 'col-md-8' : 'col-md-5') +
    '"><label class="form-label" for="' +
    prefix +
    '-query">Пошук</label><input class="form-control" id="' +
    prefix +
    '-query" name="query" type="search" placeholder="Назва, виробник або характеристика"></div>' +
    '<div class="col-12 ' +
    (picker ? 'col-md-4' : 'col-md-3') +
    '"><label class="form-label" for="' +
    prefix +
    '-sort">Сортування</label><select class="form-select" id="' +
    prefix +
    '-sort" name="sort"><option value="price">Спочатку дешевші</option><option value="price-desc">Спочатку дорожчі</option><option value="name">За назвою</option></select></div>' +
    '<div class="col-6 col-md-4"><label class="form-label" for="' +
    prefix +
    '-brand">Виробник</label><select class="form-select" id="' +
    prefix +
    '-brand" name="brand"><option value="">Усі виробники</option>' +
    brands.map((b) => '<option>' + e(b) + '</option>').join('') +
    '</select></div>' +
    '<div class="col-6 col-md-4"><label class="form-label" for="' +
    prefix +
    '-max">Ціна до, ₴</label><input class="form-control" id="' +
    prefix +
    '-max" type="number" name="max" min="0" max="1000000" placeholder="Без обмежень"></div>' +
    '<div class="col-12 col-md-4"><label class="form-label" for="' +
    prefix +
    '-spec">Характеристика</label><select class="form-select" id="' +
    prefix +
    '-spec" name="spec" ' +
    (!specs.length ? 'disabled' : '') +
    '><option value="">Усі варіанти</option>' +
    specs.map((v) => '<option value="' + e(v) + '">' + e(formatValue(v)) + '</option>').join('') +
    '</select></div>' +
    '<div class="col-12 d-flex justify-content-between align-items-center flex-wrap gap-2"><div class="form-check mb-0"><input class="form-check-input" type="checkbox" id="' +
    prefix +
    '-compatible" name="compatible"><label class="form-check-label" for="' +
    prefix +
    '-compatible">Без виявлених конфліктів зі збіркою</label></div><button class="btn-text" type="reset">Скинути фільтри</button></div></div></form>'
  );
}
export function productCard(p, picker = false) {
  const chosen = state.build[p.category]?.part.id === p.id,
    compared = state.comparison.includes(p.id);
  return (
    '<article class="card product-card"><div class="product-top"><img src="' +
    e(p.image) +
    '" width="64" height="64" alt=""><div><span class="small-label">' +
    e(p.brand) +
    '</span><h3>' +
    e(p.name) +
    '</h3></div></div><p>' +
    e(p.description) +
    '</p><span class="small-label">Демонстраційні дані</span><div class="product-price">' +
    money(p.price) +
    '</div><div class="product-actions"><button class="btn btn-primary add" data-add="' +
    e(p.id) +
    '" ' +
    (chosen ? 'disabled' : '') +
    '>' +
    (chosen ? 'У збірці' : picker ? 'Обрати' : 'Додати до збірки') +
    '</button><button class="btn btn-outline-light" data-details="' +
    e(p.id) +
    '">Характеристики</button><button class="btn btn-outline-light compare-action" data-compare="' +
    e(p.id) +
    '" aria-pressed="' +
    compared +
    '">' +
    (compared ? '✓ У порівнянні' : 'Порівняти') +
    '</button></div></article>'
  );
}
export function detailsHTML(p) {
  return (
    '<div class="product-top"><img src="' +
    e(p.image) +
    '" width="64" height="64" alt=""><div><h3>' +
    e(p.name) +
    '</h3><p class="mb-0">' +
    money(p.price) +
    '</p></div></div><p class="demo-note mt-3">' +
    e(p.dataNote) +
    '</p><dl class="detail-list">' +
    Object.entries({ ...p.specs, ...p.compatibility })
      .map(([k, v]) => '<dt>' + e(labels[k] || k) + '</dt><dd>' + e(formatValue(v)) + '</dd>')
      .join('') +
    '</dl><button class="btn btn-primary" data-add="' +
    e(p.id) +
    '">Додати до збірки</button>'
  );
}
