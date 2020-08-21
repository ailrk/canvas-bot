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