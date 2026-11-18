import { calculate } from './calculator.js';
// Missing catalog fields produce unknown status, never a positive check.
export function checkCompatibility(build, biosOverride = '') {
  const results = [],
    p = (k) => build[k]?.part,
    c = (k) => p(k)?.compatibility || {},
    pair = (a, b) => Boolean(p(a) && p(b));
  const add = (code, status, message) => results.push({ code, status, message });
  const known = (...v) => v.every((x) => x !== undefined && x !== null && x !== '');
  const test = (code, values, condition, yes, no) => {
    if (!known(...values)) add(code, 'unknown', 'Недостатньо даних: ' + no);
    else add(code, condition ? 'ok' : 'error', condition ? yes : no);
  };
  if (pair('cpus', 'motherboards')) {
    const a = c('cpus'),
      b = c('motherboards');
    test(
      'socket',
      [a.socket, b.socket],
      a.socket === b.socket,
      'Сокети CPU та плати збігаються.',
      'Сокет процесора не підходить до плати.',
    );
    const needed = b.cpuSupport?.[p('cpus').id],
      current = biosOverride || b.installedBios;
    if (!b.cpuSupport) add('bios', 'unknown', 'Немає таблиці підтримки CPU.');
    else if (!needed) add('bios', 'error', 'Цей CPU відсутній у таблиці підтримки плати.');
    else if (!current || !b.biosOrder?.includes(current) || !b.biosOrder.includes(needed))
      add('bios', 'unknown', 'Версія BIOS невідома. Перевірте ревізію плати та підтримку CPU.');
    else if (b.biosOrder.indexOf(current) < b.biosOrder.indexOf(needed))
      add(
        'bios',
        'warning',
        'Потрібне оновлення BIOS до ' + needed + ' або новішої. Зараз: ' + current + '.',
      );
    else add('bios', 'ok', 'BIOS ' + current + ' підтримує CPU у навчальній таблиці.');
  }
  if (pair('ram', 'motherboards')) {
    const a = c('ram'),
      b = c('motherboards'),
      q = build.ram.quantity;
    test(
      'memory-type',
      [a.memoryType, b.memoryType],
      a.memoryType === b.memoryType,
      'Тип RAM підтримується.',
      'Тип RAM не підтримується платою.',
    );
    test(
      'memory-slots',
      [a.modules, b.memorySlots],
      a.modules * q <= b.memorySlots,
      'Слотів RAM достатньо.',
      'Недостатньо слотів RAM.',
    );
    test(
      'memory-capacity',
      [p('ram').specs.capacityGB, b.maxMemoryGB],
      p('ram').specs.capacityGB * q <= b.maxMemoryGB,
      'Обсяг RAM у межах ліміту.',
      'Обсяг RAM перевищує ліміт плати.',
    );
    if (a.profile)
      add(
        'memory-profile',
        'warning',
        a.profile + ' — профіль розгону. Частота не гарантована; перевірте QVL і стабільність.',
      );
    if (q > 1)
      add('memory-kits', 'warning', 'Кілька наборів RAM можуть потребувати нижчої частоти.');
  }
  if (pair('motherboards', 'cases'))
    test(
      'board-case',
      [c('motherboards').formFactor, c('cases').boardFormats],
      c('cases').boardFormats?.includes(c('motherboards').formFactor),
      'Форм-фактор плати підходить корпусу.',
      'Плата не вміщується в корпус.',
    );
  if (pair('gpus', 'cases')) {
    const a = c('gpus'),
      b = c('cases'),
      cooler = c('coolers'),
      front = cooler.type === 'liquid' && cooler.mount === 'front';
    const clearance =
      b.gpuLengthMm - (front ? cooler.radiatorThicknessMm + cooler.fanThicknessMm : 0);
    test(
      'gpu-length',
      [a.lengthMm, b.gpuLengthMm, Number.isFinite(clearance) ? clearance : null],
      a.lengthMm <= clearance,
      'Довжина GPU відповідає доступному простору.',
      'GPU задовга з урахуванням переднього радіатора.',
    );
    test(
      'gpu-slots',
      [a.slots, b.expansionSlots],
      a.slots <= b.expansionSlots,
      'Для товщини GPU достатньо слотів.',
      'GPU займає забагато слотів корпусу.',
    );
    test(
      'gpu-width',
      [a.widthMm, a.cableClearanceMm, b.gpuWidthMm],
      a.widthMm + a.cableClearanceMm <= b.gpuWidthMm,
      'Є місце для GPU та кабелю.',
      'Бракує ширини для GPU та кабелю живлення.',
    );
  }
  if (pair('coolers', 'cpus')) {
    test(
      'cooler-socket',
      [c('coolers').sockets, c('cpus').socket],
      c('coolers').sockets?.includes(c('cpus').socket),
      'Кріплення кулера підходить.',
      'Немає кріплення кулера для сокета CPU.',
    );
    test(
      'cooling-power',
      [c('coolers').coolingW, p('cpus').specs.powerW],
      c('coolers').coolingW >= p('cpus').specs.powerW,
      'Навчальна оцінка охолодження достатня.',
      'Навчальна оцінка: охолодження недостатнє для CPU.',
    );
  }
  if (pair('coolers', 'cases')) {
    const a = c('coolers'),
      b = c('cases');
    if (a.type === 'air') {
      const lift = p('ram') ? Math.max(0, c('ram').heightMm - a.ramClearanceMm) : 0;
      test(
        'cooler-height',
        [a.heightMm, b.coolerHeightMm, Number.isFinite(lift) ? lift : null],
        a.heightMm + lift <= b.coolerHeightMm,
        'Кулер уміщується з урахуванням RAM.',
        'Кулер завеликий за висотою з урахуванням RAM.',
      );
    } else if (a.type === 'liquid') {
      const mount = b.radiators?.[a.mount];
      if (!b.radiators)
        add('radiator', 'unknown', 'Немає даних про місця для радіаторів у корпусі.');
      else if (!mount) add('radiator', 'error', 'У корпусі немає заданого місця для радіатора.');
      else
        test(
          'radiator',
          [
            mount.sizes,
            mount.maxThicknessMm,
            a.radiatorMm,
            a.radiatorThicknessMm,
            a.fanThicknessMm,
          ],
          mount.sizes?.includes(a.radiatorMm) &&
            a.radiatorThicknessMm + a.fanThicknessMm <= mount.maxThicknessMm,
          'Радіатор і вентилятори підходять.',
          'Радіатор не підходить за розміром або товщиною.',
        );
    } else add('cooler-type', 'unknown', 'Тип охолодження невідомий.');
  }
  if (pair('psus', 'cases'))
    test(
      'psu-size',
      [c('cases').psuFormats, c('psus').formFactor, c('psus').lengthMm, c('cases').psuLengthMm],
      c('cases').psuFormats?.includes(c('psus').formFactor) &&
        c('psus').lengthMm <= c('cases').psuLengthMm,
      'PSU підходить за форм-фактором і довжиною.',
      'PSU не підходить за форм-фактором або довжиною.',
    );
  if (pair('psus', 'gpus')) {
    const need = c('gpus').connectors,
      have = c('psus').connectors;
    test(
      'gpu-power-connectors',
      [need, have],
      need && have && Object.entries(need).every(([k, n]) => (have[k] || 0) >= n),
      'Роз’єми живлення GPU наявні.',
      'Недостатньо роз’ємів живлення GPU. Перехідники не враховуються.',
    );
  }
  if (pair('psus', 'motherboards'))
    test(
      'cpu-power-connectors',
      [c('motherboards').eps8, c('psus').eps8],
      c('psus').eps8 >= c('motherboards').eps8,
      'EPS-роз’ємів для плати достатньо.',
      'Недостатньо EPS-роз’ємів для плати.',
    );
  if (pair('storage', 'motherboards')) {
    const a = c('storage'),
      b = c('motherboards'),
      n = build.storage.quantity;
    if (a.interface === 'NVMe')
      test(
        'storage',
        [b.m2Slots, b.m2Lengths, a.length],
        n <= b.m2Slots && b.m2Lengths?.includes(a.length),
        'Є сумісні M.2-слоти.',
        'Недостатньо M.2-слотів або не підходить довжина SSD.',
      );
    else if (a.interface === 'SATA') {
      test(
        'storage',
        [b.sataPorts],
        n <= b.sataPorts,
        'SATA-портів достатньо.',
        'Недостатньо SATA-портів.',
      );
      if (p('cases'))
        test(
          'storage-bays',
          [c('cases').driveBays25],
          n <= c('cases').driveBays25,
          'Є місця для SATA SSD.',
          'Недостатньо місць для SATA SSD.',
        );
      if (p('psus'))
        test(
          'sata-power',
          [c('psus').sataPower],
          n <= c('psus').sataPower,
          'Живлення SATA достатньо.',
          'Недостатньо роз’ємів живлення SATA.',
        );
    } else add('storage', 'unknown', 'Інтерфейс накопичувача невідомий.');
  }
  const totals = calculate(build);
  if (p('psus')) {
    const watts = p('psus').specs.watts;
    if (!Number.isFinite(watts)) add('power', 'unknown', 'Потужність PSU невідома.');
    else if (watts < totals.powerW)
      add('power', 'error', 'PSU слабший за розрахункове споживання ' + totals.powerW + ' Вт.');
    else if (watts < totals.recommendedW)
      add(
        'power',
        'warning',
        'Бракує запасу живлення: рекомендовано ' + totals.recommendedW + ' Вт.',
      );
    else add('power', 'ok', 'Потужності PSU достатньо із запасом 30% за навчальною оцінкою.');
  }
  if (!totals.complete)
    add('incomplete', 'unknown', 'Збірка неповна: обрано ' + totals.count + ' із 8 категорій.');
  return results;
}
