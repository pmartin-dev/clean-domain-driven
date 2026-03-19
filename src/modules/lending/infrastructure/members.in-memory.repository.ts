import { MembersRepository } from '@lending/domain/member/members-repository.interface';
import { Member } from '@lending/domain/member/member.entity';
import { MemberId } from '@lending/domain/member/member-id.vo';

export class MembersInMemoryRepository implements MembersRepository {
  private readonly members = new Map<string, Member>();

  async save(member: Member): Promise<void> {
    this.members.set(member.id.value, member);
  }

  async findById(id: MemberId): Promise<Member | null> {
    return this.members.get(id.value) ?? null;
  }
}
