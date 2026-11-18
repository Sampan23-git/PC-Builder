import { state, loadCatalog, findPart, selectPart, setQuantity, applyPreset } from './state.js';
import { categories, presets, money, escapeHTML as e } from './config.js';
import { calculatePower } from './calculator.js';
import { estimate } from './benchmarks.js';
import { builderHTML } from './builder.js';
import { homeHTML, catalogHTML, comparisonHTML, toolsHTML } from './views.js';
import { controls, filterProducts, productCard, detailsHTML } from './components.js';
const main = document.querySelector('#main');
const routes = {
  'index.html': ['Головна', homeHTML],
  'builder.html': ['Конфігуратор', () => builderHTML(bios)],
  'components.html': ['Каталог', catalogHTML],
  'compare.html': ['Порівняння', comparisonHTML],
  'benchmarks.html': ['Калькулятори', toolsHTML],
};
let page = 'index.html',
  category = 'cpus',
  pickerCategory = 'cpus',
  bios = '',
  toastTimer,
  returnFocus;
const $ = (s) => document.querySelector(s);
function toast(message) {
  $('#toast').textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('#toast').textContent = ''), 4500);
}
function renderPage(focus = false) {
  const url = new URL(location.href),
    candidate = url.pathname.split('/').pop() || 'index.html';
  page = routes[candidate] ? candidate : 'index.html';
  const cat = url.searchParams.get('category');
  if (categories[cat]) category = cat;
  main.innerHTML = routes[page][1]();
  document.title = routes[page][0] + ' — Pancake PC';
  document.body.classList.toggle('has-builder', page === 'builder.html');
  document.querySelectorAll('.nav-link').forEach((link) => {
    const active = link.getAttribute('href') === page;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  updateCount();
  if (page === 'components.html') {
    renderCatalogControls();
    updateProducts('catalog');
  }
  if (page === 'benchmarks.html') {
    renderFPS();
    renderPower();
  }
  if (focus) main.focus({ preventScroll: true });
}
function navigate(href) {
  const url = new URL(href, location.href);
  history.pushState(null, '', url.pathname + url.search + url.hash);
  renderPage(true);
  window.scrollTo(0, 0);
  const nav = $('#navigation');
  if (nav.classList.contains('show')) window.bootstrap?.Collapse.getOrCreateInstance(nav).hide();
}
function updateCount() {
  $('#nav-count').textContent = Object.keys(state.build).length + '/8';
}
function renderCatalogControls() {
  $('#catalog-controls').innerHTML = controls('catalog', category);
}
function filterValues(prefix) {
  const form = $('[data-filter-form="' + prefix + '"]');
  return form
    ? { ...Object.fromEntries(new FormData(form)), compatible: form.elements.compatible.checked }
    : {};
}
function updateProducts(prefix) {
  const picker = prefix === 'picker',
    cat = picker ? pickerCategory : category,
    products = filterProducts(state.catalog[cat], filterValues(prefix));
  const target = $('#' + prefix + '-results');
  if (!target) return;
  target.innerHTML = products.length
    ? products
        .map((p) =>
          picker
            ? productCard(p, true)
            : '<div class="col-sm-6 col-xl-4">' + productCard(p) + '</div>',
        )
        .join('')
    : '<div class="' +
      (picker ? '' : 'col-12') +
      '"><div class="empty"><h3>Нічого не знайдено</h3><p>Зміни запит або скинь фільтри. Фільтр сумісності враховує поточну збірку.</p><button class="btn btn-outline-light" data-reset-filters="' +
      prefix +
      '">Скинути фільтри</button></div></div>';
  $('#' + prefix + '-count').textContent =
    'Знайдено: ' + products.length + ' · ' + categories[cat].label;
  if (!picker) updateComparisonBanner();
}
function updateComparisonBanner() {
  const banner = $('#comparison-banner');
  if (banner)
    banner.innerHTML = state.comparison.length
      ? '<div class="compare-banner"><span>У порівнянні ' +
        state.comparison.length +
        ' із 3 моделей</span><a href="compare.html" data-route class="btn btn-outline-light btn-sm">Переглянути порівняння</a></div>'
      : '';
}
function openPicker(cat) {
  pickerCategory = cat;
  returnFocus = document.activeElement;
  $('#picker-title').textContent = 'Обрати: ' + categories[cat].singular.toLocaleLowerCase('uk-UA');
  $('#picker-body').innerHTML =
    controls('picker', cat, true) +
    '<div class="result-count" id="picker-count" role="status"></div><div class="picker-results" id="picker-results"></div>';
  updateProducts('picker');
  $('#picker').showModal();
  $('#picker-query').focus();
}
function refreshBuild() {
  updateCount();
  if (page === 'builder.html') main.innerHTML = builderHTML(bios);
  if (page === 'components.html') updateProducts('catalog');
  if (page === 'compare.html') main.innerHTML = comparisonHTML();
}
function addPart(id) {
  const p = findPart(id);
  if (!p) return;
  selectPart(id);
  if (p.category === 'motherboards') bios = '';
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  refreshBuild();
  toast(p.name + ' — додано до збірки.');
  const pick = $('[data-pick="' + p.category + '"]');
  if (pick) pick.focus({ preventScroll: true });
}
function toggleCompare(id) {
  if (state.comparison.includes(id)) state.comparison = state.comparison.filter((x) => x !== id);
  else {
    if (state.comparison.length >= 3) {
      toast('Можна порівняти до трьох моделей. Спочатку прибери одну.');
      return;
    }
    if (
      state.comparison.length &&
      findPart(state.comparison[0]).category !== findPart(id).category
    ) {
      toast('Порівнюй моделі однієї категорії. Спочатку очисти поточне порівняння.');
      return;
    }
    state.comparison.push(id);
  }
  if (page === 'components.html') updateProducts('catalog');
  if (page === 'compare.html') main.innerHTML = comparisonHTML();
  toast(
    state.comparison.length
      ? 'У порівнянні моделей: ' + state.comparison.length
      : 'Порівняння очищено.',
  );
}
function renderFPS() {
  const form = $('#fps-form');
  if (!form) return;
  const v = Object.fromEntries(new FormData(form)),
    r = estimate(findPart(v.cpu), findPart(v.gpu), v.resolution, v.quality, v.game);
  $('#fps-result').innerHTML = r
    ? '<span class="small-label">Демонстраційний діапазон</span><div><strong>' +
      r.low +
      '–' +
      r.high +
      ' FPS</strong></div><p class="mt-2">У цій моделі обмеження задає <b>' +
      r.limiting +
      '</b>. Умовний дисбаланс: ' +
      r.imbalance +
      '%.</p><p class="mt-2">Це не виміряні FPS і не відсоток втрати продуктивності.</p>'
    : '<p>Обери процесор і відеокарту для оцінки.</p>';
}
function renderPower() {
  const form = $('#power-form');
  if (!form) return;
  const v = Object.fromEntries(new FormData(form));
  try {
    const r = calculatePower(v.cpu, v.gpu, v.other, v.headroom);
    $('#power-result').innerHTML =
      '<span class="small-label">Рекомендована потужність</span><div><strong>' +
      r.recommended +
      ' Вт</strong></div><p>Навантаження: ' +
      r.load +
      ' Вт · запас ' +
      e(v.headroom) +
      '%</p>';
  } catch (error) {
    $('#power-result').textContent = error.message;
  }
}
document.addEventListener('click', async (event) => {
  const target = event.target.closest('a,button');
  if (!target) return;
  if (
    target.matches('a[data-route]') &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey &&
    event.button === 0 &&
    state.catalog
  ) {
    event.preventDefault();
    navigate(target.getAttribute('href'));
    return;
  }
  if (target.dataset.close) {
    $('#' + target.dataset.close).close();
    return;
  }
  if (target.hasAttribute('data-retry')) {
    await boot();
    return;
  }
  if (!state.catalog) return;
  if (target.dataset.pick) {
    openPicker(target.dataset.pick);
    return;
  }
  if (target.dataset.add) {
    addPart(target.dataset.add);
    return;
  }
  if (target.dataset.details) {
    const p = findPart(target.dataset.details);
    $('#details-body').innerHTML = detailsHTML(p);
    $('#details').showModal();
    return;
  }
  if (target.dataset.compare) {
    toggleCompare(target.dataset.compare);
    return;
  }
  if (target.dataset.remove) {
    delete state.build[target.dataset.remove];
    if (target.dataset.remove === 'motherboards') bios = '';
    refreshBuild();
    toast('Компонент прибрано.');
    $('[data-pick="' + target.dataset.remove + '"]')?.focus({ preventScroll: true });
    return;
  }
  if (target.dataset.quantity) return;
  if (target.dataset.preset) {
    applyPreset(presets.find((p) => p.id === target.dataset.preset));
    bios = '';
    navigate('builder.html');
    toast('Приклад завантажено. Переглянь зауваження сумісності.');
    return;
  }
  if (target.hasAttribute('data-reset-build')) {
    state.build = {};
    bios = '';
    refreshBuild();
    toast('Збірку очищено.');
    return;
  }
  if (target.hasAttribute('data-clear-comparison')) {
    state.comparison = [];
    main.innerHTML = comparisonHTML();
    toast('Порівняння очищено.');
    return;
  }
  if (target.hasAttribute('data-checks')) {
    const checks = $('#compatibility');
    checks?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    checks?.focus({ preventScroll: true });
    return;
  }
  if (target.dataset.resetFilters) {
    $('[data-filter-form="' + target.dataset.resetFilters + '"]').reset();
    return;
  }
});
document.addEventListener('input', (event) => {
  const form = event.target.closest('[data-filter-form]');
  if (form && event.target.name !== 'category') updateProducts(form.dataset.filterForm);
});
document.addEventListener('change', (event) => {
  const t = event.target,
    form = t.closest('[data-filter-form]');
  if (form && (t.tagName === 'SELECT' || t.type === 'checkbox')) {
    if (t.name === 'category') {
      category = t.value;
      history.replaceState(null, '', 'components.html?category=' + category);
      renderCatalogControls();
    }
    updateProducts(form.dataset.filterForm);
  }
  if (t.dataset.quantity) {
    const saved = t.id;
    setQuantity(t.dataset.quantity, Number(t.value));
    refreshBuild();
    $('#' + saved)?.focus({ preventScroll: true });
  }
  if (t.id === 'bios') {
    bios = t.value;
    refreshBuild();
    $('#bios')?.focus({ preventScroll: true });
  }
  if (t.closest('#fps-form')) renderFPS();
});
document.addEventListener('reset', (event) => {
  const form = event.target;
  if (form.dataset.filterForm)
    setTimeout(() => {
      if (form.dataset.filterForm === 'catalog') {
        category = form.elements.category.value;
        history.replaceState(null, '', 'components.html?category=' + category);
      }
      updateProducts(form.dataset.filterForm);
    }, 0);
});
document.addEventListener('submit', (event) => {
  if (event.target.matches('[data-filter-form]')) {
    event.preventDefault();
    updateProducts(event.target.dataset.filterForm);
  }
  if (event.target.id === 'fps-form') {
    event.preventDefault();
    renderFPS();
  }
  if (event.target.id === 'power-form') {
    event.preventDefault();
    renderPower();
  }
});
window.addEventListener('popstate', () => {
  if (state.catalog) {
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
    renderPage(true);
  }
});
$('#picker').addEventListener('close', () => {
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});
async function boot() {
  try {
    await loadCatalog();
    renderPage();
  } catch (error) {
    main.innerHTML =
      '<div class="container loading"><h1>Каталог не завантажився</h1><p>' +
      e(error.message) +
      '</p><p>Запусти START.cmd і відкрий http://127.0.0.1:5184. Каталог не завантажується через file://.</p><button class="btn btn-primary" data-retry>Спробувати ще раз</button></div>';
  }
}
boot();
