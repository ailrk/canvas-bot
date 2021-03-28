// canvas-bot
// Copyright © 2020 ailrk

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
// OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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

/**
 * @param memSize either be a string  with unit or number with bytes as default
 */
export function convertToBytes(memSize: string | number) {
  if (typeof memSize === "string") {
    const processed = memSize.trim().toLowerCase()
    const valueString = processed.slice(0, -2);
    const unit = processed.slice(-2);
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
  return memSize;
}

export type Identity<T> = {[P in keyof T]: T[P]};
export type Replace<T, K extends keyof T, R> = Identity<Pick<T, Exclude<keyof T, K>> & {
  [P in K]: R
}>

export function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

export type Thaw<T> = {-readonly [P in keyof T]: T[P]}
