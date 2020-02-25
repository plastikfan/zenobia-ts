import * as R from 'ramda';
import * as path from 'path';
import * as fs from 'fs';
import * as memfs from 'memfs';
import { patchFs } from 'fs-monkey';

export function read (path: string): string {
  return fs.readFileSync(path, 'utf8');
}

export function setupFS (fileNames: string[], patch?: {}): memfs.IFs {

  const resultFS = R.reduce((acc: { [key: string]: any }, fileName: string): { [key: string]: any } => {
    const filePath = path.resolve(__dirname, fileName);
    const content: string = fs.readFileSync(filePath, 'utf8');
    return R.assoc(fileName, content)(acc);
  }, {})(fileNames);

  const volume = memfs.Volume.fromJSON(resultFS);
  if (patch) {
    patchFs(patch, volume);
  }

  return memfs.createFsFromVolume(volume);
}

export class FakeConsole {
  log (message?: any, ...optionalParams: any[]): void {
    // null-op
  }
}
