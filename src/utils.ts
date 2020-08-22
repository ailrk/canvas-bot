const FNV_SEEDS = {
  32: BigInt(2166136261),
  64: BigInt("14695981039346656037"),
};

export function fnv1a(str: string): number {
  let hash = Number(FNV_SEEDS[32]);
  let unicode = false;

  for (const c of str) {
    const charcode = c.charCodeAt(0);
    if (charcode > 0x7F && !unicode) {
      str = unescape(encodeURIComponent(charcode));
      unicode = true;
    }
    hash ^= charcode;
    hash = hash
      + (hash << 1)
      + (hash << 4)
      + (hash << 7)
      + (hash << 8)
      + (hash << 24);
  }
  return hash >>> 0;
}

export function once<T>(fn: ((...args: any[]) => T) | null, ...args: any[]) {
  return () => {
    const result = fn ? fn(args) : undefined;
    fn = null;
    return result;
  }
}

export function convertToBytes(memSize: string) {
  const processed = memSize.trim().toLowerCase();
  const [valueString, unit] = [processed.slice(0, -2), processed.slice(-2)]
  const factor = (() => {
    switch (unit) {
      case "kb":
        return 1024;
      case "mb":
        return 1024 * 1024;
      case "gb":
        return 1024 * 1024 * 1024;
      default:
        throw new Error(`invalid memory unit ${unit}`);
    }
  })();
  const value = Number(valueString);
  if (value === NaN) throw new Error("Error in memory unit");
  return value * factor;
}
