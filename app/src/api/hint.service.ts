import ColorHash from 'color-hash'
import { Hint, HintMap } from '@evotempus/types'

export class HintService {

  private hints: HintMap = {};
  private colorHash = new ColorHash();

  constructor(hints: Hint[]) {
    this.setHints(hints);
  }

  private setHints(hintArr: Hint[]) {
    if (! hintArr) {
      throw new Error('Hints passed to hint service is null');
    }

    for (const h of hintArr.values()) {
      this.hints[h._id] = {
        colour: h.colour,
        link: h.link,
        order: h.order,
        type: h.type,
        parent: h.parent
      };
    }
  }

  getKindIds(): string[] {
    const ids: string[] = [];
    Object.entries(this.hints)
      .forEach(([k, v]) => {
        if (v.type == 'Kind') {
          ids.push(k);
        }
      });

    return ids;
  }

  getCategoryIds(): string[] {
    const ids: string[] = [];
    Object.entries(this.hints)
      .forEach(([k, v]) => {
        if (v.type == 'Category') {
          ids.push(k);
        }
      });

    return ids;
  }

  getTagIds(): string[] {
    const ids: string[] = [];
    Object.entries(this.hints)
      .forEach(([k, v]) => {
        if (v.type == 'Tag') {
          ids.push(k);
        }
      });

    return ids;
  }

  getHint(name: string): Partial<Hint> {
    const hint = this.hints[name];
    if (!hint) {
      throw new Error("No hint in hint service with name " + name);
    }
    return hint;
  }

  calcColour(name: string): string {
    const hint: Partial<Hint> = this.hints[name];
    if (hint.colour && hint.colour.length > 0) {
      return hint.colour;
    }

    return this.colorHash.hex(name);
  }

  calcColours(names: string[]): string[] {
    const colours: string[] = [];
    for (const name of names.values()) {
      colours.push(this.calcColour(name));
    }
    return colours;
  }
}
