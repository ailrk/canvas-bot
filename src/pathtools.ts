import path from 'path';

export type Path = {readonly path: string}
export function mkPath(p: string): Path {
  return {
    path: path.resolve(p),
  };
}


