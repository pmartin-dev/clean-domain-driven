import { IdGeneratorInterface } from '@shared/domain/id-generator';

export class StubIdGenerator implements IdGeneratorInterface {
  private readonly ids: string[];
  private index = 0;

  constructor(...ids: string[]) {
    this.ids = ids;
  }

  generate(): string {
    if (this.index >= this.ids.length) {
      throw new Error(`StubIdGenerator exhausted after ${this.ids.length} id(s)`);
    }
    return this.ids[this.index++];
  }
}
