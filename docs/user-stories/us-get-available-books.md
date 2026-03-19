# US: View Available Books

**As a** library member,
**I want to** see which books are available for borrowing,
**So that** I can choose one to borrow.

---

## Acceptance Criteria

**All books available:**
- Given books in the catalog and none are currently borrowed
- When the member queries available books
- Then all books are returned with their id, ISBN, title and author

**Some books borrowed:**
- Given books in the catalog and some are currently borrowed
- When the member queries available books
- Then only the non-borrowed books are returned

**No books available:**
- Given all books in the catalog are currently borrowed
- When the member queries available books
- Then an empty list is returned

**Cross-BC sync — book borrowed:**
- Given a book in the catalog
- When a `lending::book-borrowed` event is dispatched for that book
- Then the book is removed from the available list

**Cross-BC sync — book returned:**
- Given a borrowed book
- When a `lending::book-returned` event is dispatched for that book
- Then the book reappears in the available list
