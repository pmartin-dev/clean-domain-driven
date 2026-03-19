# US: Add a Book to the Catalog

**As a** librarian,
**I want to** add a book to the catalog,
**So that** members can find and borrow it.

---

## Acceptance Criteria

**Happy path:**
- Given a valid ISBN, title and author
- When the librarian adds the book to the catalog
- Then the book is persisted with a generated unique ID
- And a `catalog::book-registered` event is published
- And the book becomes available for borrowing in the Lending context (via the event)

**Invalid ISBN:**
- Given an ISBN that does not match the ISBN-13 format
- When the librarian tries to add the book
- Then the system rejects the request
- And no book is persisted

**Empty title:**
- Given an empty title
- When the librarian tries to add the book
- Then the system rejects the request
