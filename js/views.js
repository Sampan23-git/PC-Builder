import { state, findPart } from './state.js';
import { presets, money, escapeHTML as e, categories } from './config.js';
import { demoNote, labels, formatValue } from './components.js';
import { games } from './benchmarks.js';
export function homeHTML() {
  return (
    '<section class="hero"><div class="container"><div class="row"><div class="col-lg-9"><div class="eyebrow">Твій наступний комп’ютер починається тут</div><h1>Збери ПК мрії — без помилок і здогадок</h1><p class="hero-copy">Обирай комплектуючі, перевіряй сумісність і дивись, як кожна деталь змінює твою збірку. Від першого процесора до останнього вентилятора.</p><div class="hero-actions"><a href="builder.html" data-route class="btn btn-primary">Почати збірку</a><a href="components.html" data-route class="btn btn-outline-light">Каталог деталей</a></div><div class="facts"><div><strong>8</strong><span>категорій деталей</span></div><div><strong>32</strong><span>демонстраційні моделі</span></div><div><strong>3</strong><span>готові приклади</span></div></div></div><div class="col-lg-3 hero-side"><a href="builder.html" data-route class="btn btn-primary">Перейти до конфігуратора</a></div></div></div></section>' +
    '<div class="container"><section class="section"><div class="section-head"><div class="eyebrow">Як це працює</div><h2>Три кроки до ідеального ПК</h2><p>Від першої ідеї до зрозумілої конфігурації.</p></div><div class="row g-3">' +
    [
      [
        '1',
        'Обери комплектуючі',
        'Знайди потрібні деталі в каталозі. Порівняй характеристики, ціни й можливості.',
      ],
      [
        '2',
        'Ми перевіримо сумісність',
        'Сокети, пам’ять, BIOS, габарити, живлення та охолодження — перевірки поруч зі збіркою.',
      ],
      [
        '3',
        'Досліди продуктивність',
        'Переглянь навчальну оцінку FPS і споживання. Змінюй деталі та порівнюй результат.',
      ],
    ]
      .map(
        ([n, t, d]) =>
          '<div class="col-md-4"><article class="card step-card"><span class="step-number">' +
          n +
          '</span><h3>' +
          t +
          '</h3><p>' +
          d +
          '</p></article></div>',
      )
      .join('') +
    '</div></section>' +
    '<section class="section"><div class="section-head"><div class="eyebrow">Готові приклади</div><h2>Почни з перевіреної структури</h2><p>Три навчальні конфігурації. Кожну деталь можна замінити.</p></div><div class="row g-3">' +
    presets
      .map((x, i) => {
        const parts = Object.values(x.parts).map(findPart),
          total = parts.reduce((s, p) => s + p.price, 0);
        return (
          '<div class="col-md-4"><article class="card preset-card ' +
          (i === 1 ? 'featured' : '') +
          '"><h3>' +
          x.name +
          '</h3><p>' +
          x.caption +
          '</p><ul class="preset-specs">' +
          [parts[0].name, parts[1].name, parts[3].description, parts[4].description]
            .map((t) => '<li>' + e(t) + '</li>')
            .join('') +
          '</ul><span class="tag ' +
          (i === 1 ? 'warning' : 'ok') +
          '">' +
          (i === 1 ? 'Потребує оновлення BIOS' : 'Без виявлених конфліктів') +
          '</span><div class="preset-price mt-3">' +
          money(total) +
          '</div><button class="btn btn-outline-light" data-preset="' +
          x.id +
          '">Обрати збірку</button></article></div>'
        );
      })
      .join('') +
    '</div><p class="small-label mt-3">Демонстраційні ціни та характеристики. Профілі пам’яті потребують окремої перевірки.</p></section>' +
    '<section class="section"><div class="cta"><div><h2>Готовий зібрати свій ПК?</h2><p>Почни з процесора — решту підберемо крок за кроком.</p></div><a href="builder.html" data-route class="btn">Почати збірку</a></div></section></div>'
  );
}
export function catalogHTML(category) {
  return (
    '<div class="container page-end"><section class="intro"><div class="eyebrow">Комплектуючі</div><h1>Кожна деталь має значення</h1><p>Знайди компоненти для своєї збірки. Фільтруй, порівнюй і перевіряй характеристики перед вибором.</p>' +
    demoNote +
    '</section><div id="catalog-controls"></div><div id="comparison-banner"></div><div class="result-count" id="catalog-count" role="status"></div><div class="row g-3" id="catalog-results"></div></div>'
  );
}
export function comparisonHTML() {
  const parts = state.comparison.map(findPart).filter(Boolean);
  let content;
  if (!parts.length)
    content =
      '<div class="empty"><h2>Що порівняємо?</h2><p>Додай до трьох моделей однієї категорії кнопкою «Порівняти» в каталозі.</p><a data-route href="components.html" class="btn btn-primary">Обрати комплектуючі</a></div>';
  else {
    const keys = [
      ...new Set(parts.flatMap((p) => Object.keys({ ...p.specs, ...p.compatibility }))),
    ].filter((k) => !['cpuSupport', 'biosOrder', 'radiators'].includes(k));
    content =
      '<div class="section-title-row"><span class="tag">' +
      categories[parts[0].category].label +
      ' · ' +
      parts.length +
      '/3</span><div class="d-flex gap-2 flex-wrap"><a data-route href="components.html?category=' +
      parts[0].category +
      '" class="btn btn-outline-light">Додати модель</a><button class="btn-text" data-clear-comparison>Очистити</button></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Таблиця порівняння; можна прокрутити горизонтально"><table class="table"><caption class="visually-hidden">Порівняння демонстраційних характеристик</caption><thead><tr><th scope="col">Характеристика</th>' +
      parts
        .map(
          (p) =>
            '<td><img src="' +
            e(p.image) +
            '" alt="" width="54" height="54"><h3>' +
            e(p.name) +
            '</h3><button class="btn btn-primary btn-sm w-100" data-add="' +
            p.id +
            '">До збірки</button><button class="btn-text" data-compare="' +
            p.id +
            '">Прибрати</button></td>',
        )
        .join('') +
      '</tr></thead><tbody><tr><th scope="row">Ціна, демо</th>' +
      parts
        .map(
          (p) =>
            '<td class="' +
            (p.price === Math.min(...parts.map((x) => x.price)) ? 'best' : '') +
            '">' +
            money(p.price) +
            '</td>',
        )
        .join('') +
      '</tr>' +
      keys
        .map(
          (k) =>
            '<tr><th scope="row">' +
            e(labels[k] || k) +
            '</th>' +
            parts
              .map((p) => '<td>' + e(formatValue({ ...p.specs, ...p.compatibility }[k])) + '</td>')
              .join('') +
            '</tr>',
        )
        .join('') +
      '</tbody></table></div><p class="small-label mt-3">Зеленим позначено найнижчу ціну. Більше значення характеристики не завжди означає кращий вибір.</p>';
  }
  return (
    '<div class="container page-end"><section class="intro"><div class="eyebrow">Порівняння</div><h1>Деталі поруч. Вибір простіший.</h1><p>Порівнюй моделі однієї категорії за ціною та параметрами.</p>' +
    demoNote +
    '</section>' +
    content +
    '</div>'
  );
}
const options = (cat, selected) =>
  '<option value="">Обери модель</option>' +
  state.catalog[cat]
    .map(
      (p) =>
        '<option value="' +
        p.id +
        '" ' +
        (selected === p.id ? 'selected' : '') +
        '>' +
        e(p.name) +
        '</option>',
    )
    .join('');
export function toolsHTML() {
  return (
    '<div class="container page-end"><section class="intro"><div class="eyebrow">Калькулятори</div><h1>Зрозумій можливості свого ПК</h1><p>Досліди вплив процесора, відеокарти та налаштувань гри. Оціни запас блока живлення.</p><div class="demo-note">FPS і bottleneck — умовна математична модель, а не реальні тести. Інтервал ±20% є ілюстрацією, не статистичною гарантією.</div></section><div class="row g-4"><div class="col-lg-7"><section class="card tool-card"><h2>FPS та баланс CPU / GPU</h2><p class="small-label">Без трасування променів, DLSS / FSR та генерації кадрів.</p><form id="fps-form"><div class="row g-3"><div class="col-md-6"><label for="fps-cpu" class="form-label">Процесор</label><select id="fps-cpu" class="form-select" name="cpu" required>' +
    options('cpus', state.build.cpus?.part.id) +
    '</select></div><div class="col-md-6"><label for="fps-gpu" class="form-label">Відеокарта</label><select id="fps-gpu" class="form-select" name="gpu" required>' +
    options('gpus', state.build.gpus?.part.id) +
    '</select></div><div class="col-12"><label class="form-label" for="fps-game">Гра</label><select class="form-select" id="fps-game" name="game">' +
    Object.entries(games)
      .map(([id, g]) => '<option value="' + id + '">' + g.name + '</option>')
      .join('') +
    '</select></div><div class="col-6"><label class="form-label" for="fps-resolution">Роздільність</label><select id="fps-resolution" name="resolution" class="form-select"><option value="1080">1920 × 1080</option><option value="1440" selected>2560 × 1440</option><option value="2160">3840 × 2160</option></select></div><div class="col-6"><label class="form-label" for="fps-quality">Налаштування</label><select id="fps-quality" name="quality" class="form-select"><option value="medium">Середні</option><option value="high" selected>Високі</option><option value="ultra">Ультра</option></select></div></div><button class="btn btn-primary mt-3 w-100">Розрахувати демо-FPS</button></form><div id="fps-result" aria-live="polite" class="tool-result"><p>Обери CPU та GPU для оцінки.</p></div><details class="method"><summary>Як працює оцінка?</summary><p>Для моделей задано навчальні індекси. Межа GPU = базовий FPS гри × індекс GPU / 100 × коефіцієнти роздільності та якості. Межа CPU = базовий FPS × індекс CPU / 100 × коефіцієнт гри. Беремо меншу межу та показуємо умовний діапазон ±20%.</p><p>Дисбаланс = 1 − менша межа / більша межа. Це не відсоток втрати FPS і не універсальна оцінка bottleneck.</p></details></section></div>' +
    '<div class="col-lg-5"><section class="card tool-card"><h2>Калькулятор живлення</h2><p class="small-label">Орієнтовне навантаження й запас потужності.</p><form id="power-form"><div class="row g-3">' +
    [
      ['cpu', 'CPU, Вт', state.build.cpus?.part.specs.powerW || 120],
      ['gpu', 'GPU, Вт', state.build.gpus?.part.specs.powerW || 220],
      ['other', 'Інші компоненти, Вт', 80],
      ['headroom', 'Запас, %', 30],
    ]
      .map(
        ([key, label, v]) =>
          '<div class="col-6"><label class="form-label" for="power-' +
          key +
          '">' +
          label +
          '</label><input class="form-control" type="number" id="power-' +
          key +
          '" name="' +
          key +
          '" min="' +
          (key === 'headroom' ? 10 : 0) +
          '" max="' +
          (key === 'headroom' ? 100 : 2000) +
          '" step="1" required value="' +
          v +
          '"></div>',
      )
      .join('') +
    '</div><button class="btn btn-primary mt-3 w-100">Розрахувати потужність</button></form><div id="power-result" class="tool-result" aria-live="polite"><p>Вкажи навантаження компонентів.</p></div><details class="method"><summary>Що враховує розрахунок?</summary><p>Сума CPU, GPU та інших компонентів множиться на запас і округлюється вгору до 50 Вт. Це вихідна потужність PSU, не споживання з розетки. Сертифікат ефективності не збільшує номінальну потужність.</p><p>Пікові стрибки, якість PSU, кабелі та вимоги виробника потребують окремої перевірки в конфігураторі.</p></details><a href="builder.html" data-route class="btn btn-outline-light mt-4">Перевірити всю збірку</a></section></div></div></div>'
  );
}
