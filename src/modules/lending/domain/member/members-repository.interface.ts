import { Member } from './member.entity';
import { MemberId } from './member-id.vo';

export interface MembersRepository {
  save(member: Member): Promise<void>;
  findById(id: MemberId): Promise<Member | null>;
}
