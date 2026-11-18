import { categories, presets, money, number, escapeHTML as e } from './config.js';
import { state } from './state.js';
import { calculate } from './calculator.js';
import { checkCompatibility } from './compatibility.js';
import { estimate, games } from './benchmarks.js';
export function builderHTML(bios = '') {
  const total = calculate(state.build),
    checks = checkCompatibility(state.build, bios);
  const errors = checks.filter((x) => x.status === 'error').length,
    warnings = checks.filter((x) => x.status === 'warning').length,
    unknown = checks.filter((x) => x.status === 'unknown').length;
  const status = errors ? 'error' : unknown ? 'unknown' : warnings ? 'warning' : 'ok';
  const statusText = errors
    ? errors + ' конфліктів'
    : unknown
      ? 'Потрібна перевірка'
      : warnings
        ? warnings + ' зауваження'
        : 'Конфліктів немає';
  const p = (k) => state.build[k]?.part;
  const fpsReady = total.complete && !errors && !unknown;
  const summary =
    '<aside class="card builder-summary" aria-label="Підсумок збірки"><div><h2>Твоя збірка</h2><p class="small-label">Усе важливе — в одному місці</p><div class="readiness"><div class="ring" style="--fill:' +
    (total.count / 8) * 100 +
    '%"><div><strong>' +
    total.count +
    '</strong><span>із 8 обрано</span></div></div><div><h3>' +
    (total.complete ? 'Склад обрано' : 'Почнімо збирати') +
    '</h3><p>' +
    (total.complete
      ? 'Переглянь результати перевірок нижче.'
      : 'Додай комплектуючі або завантаж приклад.') +
    '</p></div></div><div class="summary-status"><span>Сумісність</span><span class="tag ' +
    status +
    '">' +
    statusText +
    '</span></div><div class="build-total"><span>Разом</span><strong>' +
    money(total.total) +
    '</strong></div><button class="btn btn-primary w-100" data-checks>Переглянути перевірки</button><a class="btn btn-outline-light w-100 mt-2" data-route href="components.html">Відкрити каталог</a><dl class="summary-stats">' +
    [
      ['Ядра / потоки', total.cores + ' / ' + total.threads],
      ['RAM', total.ramGB + ' ГБ'],
      ['VRAM', total.vramGB + ' ГБ'],
      ['Накопичувачі', number(total.storageGB) + ' ГБ'],
      ['Споживання', total.powerW + ' Вт'],
      ['Рекоменд. PSU', total.recommendedW + ' Вт'],
    ]
      .map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>')
      .join('') +
    '</dl></div><div class="summary-fps"><h3>Демонстраційний FPS</h3><p class="small-label">1440p · високі · без RT і масштабування</p>' +
    Object.entries(games)
      .map(([id, g]) => {
        const f = fpsReady ? estimate(p('cpus'), p('gpus'), '1440', 'high', id) : null;
        return (
          '<div class="metric"><div class="metric-head"><span>' +
          g.name +
          '</span><strong>' +
          (f ? f.low + '–' + f.high : '—') +
          '</strong></div><div class="progress" aria-hidden="true"><div class="progress-bar" style="width:' +
          (f ? Math.min(100, f.mid / 4) : 0) +
          '%"></div></div></div>'
        );
      })
      .join('') +
    (!fpsReady
      ? '<p class="small-label mt-3">Оцінка з’явиться для повної збірки без помилок і невідомих перевірок.</p>'
      : '<p class="small-label mt-3">Модельна оцінка, не результати тестування. Спочатку усуньте зауваження сумісності.</p>') +
    '<div class="metric"><div class="metric-head"><span>Навантаження PSU</span><strong>' +
    total.powerW +
    ' / ' +
    (p('psus')?.specs.watts || '—') +
    ' Вт</strong></div><div class="progress" aria-hidden="true"><div class="progress-bar power-bar" style="width:' +
    Math.min(100, (total.powerW / (p('psus')?.specs.watts || Infinity)) * 100) +
    '%"></div></div></div><a class="btn btn-outline-light btn-sm w-100 mt-4" data-route href="benchmarks.html">Налаштувати оцінку FPS</a></div></aside>';
  return (
    '<div class="container page-end"><section class="intro"><div class="eyebrow">Конфігуратор ПК</div><h1>Збери ПК — ми перевіримо сумісність і покажемо FPS</h1><p>Обирай комплектуючі, порівнюй характеристики та перевіряй свою конфігурацію крок за кроком.</p><div class="preset-tabs" aria-label="Приклади конфігурацій">' +
    presets
      .map(
        (x) =>
          '<button class="btn btn-outline-light" data-preset="' +
          x.id +
          '">' +
          x.name +
          '</button>',
      )
      .join('') +
    '<button class="btn-text" data-reset-build ' +
    (!total.count ? 'disabled' : '') +
    '>Очистити збірку</button></div></section><div class="builder-layout"><section aria-labelledby="parts-title"><div class="section-title-row"><h2 id="parts-title">Комплектуючі</h2><span class="small-label">' +
    total.count +
    ' із 8 обрано</span></div><div class="parts-list">' +
    Object.entries(categories)
      .map(([k, cat]) => {
        const entry = state.build[k],
          part = entry?.part;
        return (
          '<article class="part-row"><img src="assets/icons/' +
          k +
          '.svg" alt="" width="52" height="52"><div class="part-info"><span class="small-label">' +
          cat.singular +
          '</span><h3>' +
          (part ? e(part.name) : 'Обрати ' + cat.singular.toLocaleLowerCase('uk-UA')) +
          '</h3><p>' +
          (part ? e(part.description) : 'Додай компонент до своєї збірки') +
          '</p><div class="part-buttons"><button class="btn btn-outline-light" data-pick="' +
          k +
          '">' +
          (part ? 'Замінити' : '＋ Обрати') +
          '</button>' +
          (part
            ? '<button class="btn btn-outline-light" data-details="' +
              part.id +
              '">Деталі</button><button class="remove" data-remove="' +
              k +
              '" aria-label="Прибрати ' +
              cat.singular.toLocaleLowerCase('uk-UA') +
              '">Прибрати</button>'
            : '') +
          (part && ['ram', 'storage'].includes(k)
            ? '<label class="visually-hidden" for="quantity-' +
              k +
              '">Кількість ' +
              cat.label.toLocaleLowerCase('uk-UA') +
              '</label><select class="form-select quantity" id="quantity-' +
              k +
              '" data-quantity="' +
              k +
              '">' +
              [1, 2, 3, 4]
                .map(
                  (n) =>
                    '<option ' +
                    (entry.quantity === n ? 'selected' : '') +
                    ' value="' +
                    n +
                    '">' +
                    n +
                    ' шт.</option>',
                )
                .join('') +
              '</select>'
            : '') +
          '</div></div><div class="part-meta"><strong>' +
          (part ? money(part.price * entry.quantity) : '—') +
          '</strong><span class="tag ' +
          (part ? '' : 'unknown') +
          '">' +
          (part ? 'Обрано' : 'Не обрано') +
          '</span></div></article>'
        );
      })
      .join('') +
    '</div><section class="card compatibility-panel" id="compatibility" tabindex="-1" aria-labelledby="compat-title"><h2 id="compat-title">Перевірка сумісності</h2><p class="small-label">Перевірки за навчальними даними. Відсутність конфліктів не замінює документацію виробника.</p>' +
    (p('motherboards')
      ? '<div class="bios-row"><label class="form-label" for="bios">Версія BIOS обраної плати (демо)</label><select class="form-select" id="bios"><option value="" ' +
        (!bios ? 'selected' : '') +
        '>Із каталогу: ' +
        (p('motherboards').compatibility.installedBios || 'невідома') +
        '</option><option value="unknown" ' +
        (bios === 'unknown' ? 'selected' : '') +
        '>Не знаю версію</option>' +
        (p('motherboards').compatibility.biosOrder || [])
          .map(
            (v) =>
              '<option value="' + v + '" ' + (bios === v ? 'selected' : '') + '>' + v + '</option>',
          )
          .join('') +
        '</select></div>'
      : '') +
    '<ul class="checks">' +
    checks
      .map(
        (x) =>
          '<li class="' +
          x.status +
          '"><span class="check-symbol" aria-hidden="true">' +
          { ok: '✓', error: '×', warning: '!', unknown: '?' }[x.status] +
          '</span><span><span class="visually-hidden">' +
          { ok: 'Успішно: ', error: 'Помилка: ', warning: 'Увага: ', unknown: 'Невідомо: ' }[
            x.status
          ] +
          '</span>' +
          e(x.message) +
          '</span></li>',
      )
      .join('') +
    '</ul></section></section>' +
    summary +
    '</div><p class="builder-note">Ціни, габарити, BIOS і теплові межі — навчальні. Оновлення вкладки скидає збірку. Для кількох наборів RAM або SSD використовується кількість однієї моделі.</p></div><div class="mobile-total"><div><small>Разом · демо</small><strong>' +
    money(total.total) +
    '</strong></div><button class="btn btn-primary btn-sm" data-checks>Перевірити</button></div>'
  );
}
