# US: View My Active Loans

**As a** library member,
**I want to** see my active loans,
**So that** I know what I've borrowed and when to return each book.

---

## Acceptance Criteria

**Member with active loans:**
- Given a member with active loans
- When the member queries their loans
- Then each loan is returned with loanId, bookReference, startDate, dueDate and overdue status

**No active loans:**
- Given a member with no active loans
- When the member queries their loans
- Then an empty list is returned

**Overdue detection:**
- Given a member with a loan past its due date
- When the member queries their loans
- Then that loan is flagged as overdue (`isOverdue: true`)

**Returned loans excluded:**
- Given a member with a returned loan
- When the member queries their loans
- Then the returned loan is not included

**Member not found:**
- Given a member ID that does not exist
- When someone queries loans for that ID
- Then the system rejects with "Member not found"
