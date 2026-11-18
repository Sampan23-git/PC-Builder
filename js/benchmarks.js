export const games = {
  cs2: { name: 'Counter-Strike 2', base: 260, cpuWeight: 0.75 },
  cyberpunk: { name: 'Cyberpunk 2077', base: 72, cpuWeight: 0.25 },
  fortnite: { name: 'Fortnite', base: 105, cpuWeight: 0.4 },
  bg3: { name: 'Baldur’s Gate 3', base: 115, cpuWeight: 0.5 },
};
export function estimate(cpu, gpu, resolution = '1440', quality = 'high', game = 'cs2') {
  if (!cpu || !gpu) return null;
  const cfg = games[game];
  if (
    !cfg ||
    !['1080', '1440', '2160'].includes(String(resolution)) ||
    !['medium', 'high', 'ultra'].includes(quality)
  )
    return null;
  const c = cpu.specs.demoIndex,
    g = gpu.specs.demoIndex;
  if (!(c > 0 && g > 0)) return null;
  const scale =
    { 1080: 1.35, 1440: 1, 2160: 0.58 }[resolution] *
    { medium: 1.3, high: 1, ultra: 0.78 }[quality];
  const cpuLimit = cfg.base * (c / 100) * (1.4 - cfg.cpuWeight * 0.25),
    gpuLimit = cfg.base * (g / 100) * scale,
    mid = Math.round(Math.min(cpuLimit, gpuLimit));
  return {
    low: Math.max(1, Math.round(mid * 0.8)),
    high: Math.round(mid * 1.2),
    mid,
    limiting: cpuLimit < gpuLimit ? 'CPU' : 'GPU',
    imbalance: Math.round((1 - Math.min(cpuLimit, gpuLimit) / Math.max(cpuLimit, gpuLimit)) * 100),
  };
}
