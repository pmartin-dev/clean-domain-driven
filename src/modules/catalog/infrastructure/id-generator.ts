import { IdGeneratorInterface } from '@shared/domain/id-generator';
import { v7 as uuidv7 } from 'uuid';

export class IdGenerator implements IdGeneratorInterface {
  generate(): string {
    return uuidv7();
  }
}
