import { describe, it, expect } from 'vitest';
import { MemberName } from '@lending/domain/member/member-name.vo';
import { MemberNameCannotBeEmpty } from '@lending/domain/member/exceptions/member-name-cannot-be-empty.exception';
import { MemberNameCannotExceed255Characters } from '@lending/domain/member/exceptions/member-name-cannot-exceed-255-characters.exception';

describe('MemberName', () => {
  it('creates a valid member name', () => {
    expect(MemberName.create('Alice Dupont').value).toBe('Alice Dupont');
  });

  it('trims whitespace', () => {
    expect(MemberName.create('  Alice  ').value).toBe('Alice');
  });

  it('rejects an empty name', () => {
    expect(() => MemberName.create('')).toThrow(MemberNameCannotBeEmpty);
    expect(() => MemberName.create('   ')).toThrow(MemberNameCannotBeEmpty);
  });

  it('rejects a name exceeding 255 characters', () => {
    expect(() => MemberName.create('A'.repeat(256))).toThrow(MemberNameCannotExceed255Characters);
  });

  it('accepts a name of exactly 255 characters', () => {
    expect(MemberName.create('A'.repeat(255)).value).toHaveLength(255);
  });

  it('two names with the same value are equal', () => {
    expect(MemberName.create('Alice').equals(MemberName.create('Alice'))).toBe(true);
  });
});
