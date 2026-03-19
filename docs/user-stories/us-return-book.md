# US: Return a Book

**As a** library member,
**I want to** return a borrowed book,
**So that** it becomes available for other members.

---

## Acceptance Criteria

**Happy path:**
- Given an active loan
- When the member returns the book
- Then the loan is marked as returned
- And the member's active loan count decreases
- And a `lending::book-returned` event is published
- And the book becomes available again in the catalog

**Loan not found:**
- Given a loan ID that does not exist
- When someone tries to return it
- Then the system rejects with "Loan not found"

**Already returned:**
- Given a loan that has already been returned
- When someone tries to return it again
- Then the system rejects the request

**Member not found:**
- Given a loan whose member no longer exists
- When someone tries to return it
- Then the system rejects with "Member not found"
