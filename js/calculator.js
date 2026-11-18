export function calculate(build) {
  const entries = Object.values(build),
    s = (c) => build[c]?.part.specs || {},
    q = (c) => build[c]?.quantity || 0;
  const power =
    entries.reduce((n, { part, quantity }) => n + (part.specs.powerW || 0) * quantity, 0) +
    (entries.length ? 35 : 0);
  return {
    total: entries.reduce((n, { part, quantity }) => n + part.price * quantity, 0),
    cores: s('cpus').cores || 0,
    threads: s('cpus').threads || 0,
    ramGB: (s('ram').capacityGB || 0) * q('ram'),
    vramGB: s('gpus').vramGB || 0,
    storageGB: (s('storage').capacityGB || 0) * q('storage'),
    powerW: power,
    recommendedW: power ? Math.ceil((power * 1.3) / 50) * 50 : 0,
    count: entries.length,
    complete: entries.length === 8,
  };
}
export function calculatePower(cpu, gpu, other, headroom) {
  const v = [cpu, gpu, other, headroom].map(Number);
  if (
    v.some((n) => !Number.isFinite(n)) ||
    v.slice(0, 3).some((n) => n < 0 || n > 2000) ||
    v[3] < 10 ||
    v[3] > 100
  )
    throw new Error('Споживання: 0–2000 Вт; запас: 10–100%.');
  const load = v[0] + v[1] + v[2];
  return { load, recommended: Math.ceil((load * (1 + v[3] / 100)) / 50) * 50 };
}
