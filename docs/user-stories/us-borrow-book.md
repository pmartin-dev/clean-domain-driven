# US: Borrow a Book

**As a** library member,
**I want to** borrow an available book,
**So that** I can read it at home.

---

## Acceptance Criteria

**Happy path:**
- Given a registered member with borrowing capacity
- And a book that is available (not currently borrowed)
- When the member borrows the book
- Then a loan is created with a 21-day period
- And the member's active loan count increases
- And a `lending::book-borrowed` event is published

**Book already borrowed:**
- Given a book that is currently borrowed by another member
- When the member tries to borrow it
- Then the system rejects with "Book is already borrowed"

**Borrowing limit reached:**
- Given a member who has reached their borrowing limit (e.g. 2 out of 2)
- When the member tries to borrow another book
- Then the system rejects with "Member has reached borrowing limit"

**Member has overdue loans:**
- Given a member with at least one overdue loan
- When the member tries to borrow a new book
- Then the system rejects with "Member has overdue loans and cannot borrow"

**Member not found:**
- Given a member ID that does not exist
- When someone tries to borrow a book with that ID
- Then the system rejects with "Member not found"

**Book not in catalog:**
- Given a book ID that has no matching BookReference in Lending
- When the member tries to borrow it
- Then the system rejects with "Book not found in catalog"
