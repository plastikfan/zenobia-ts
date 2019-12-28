import * as fs from 'fs';

export function read (path: string): string {
  return fs.readFileSync(path, 'utf8');
}
