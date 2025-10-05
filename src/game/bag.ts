import type { PieceId } from './types';

const PIECES: PieceId[] = ['I','O','T','J','L','S','Z'];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class SevenBag {
  private bag: PieceId[] = [];
  next(): PieceId {
    if (this.bag.length === 0) this.bag = shuffle([...PIECES]);
    return this.bag.pop()!;
  }
}
