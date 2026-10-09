# Library Books REST API Design

Base path: `/api/books`. Requests and responses use JSON unless otherwise stated.

## Endpoints

- **List all books**
  - **Method:** `GET`
  - **Path:** `/api/books`
  - **Description:** Returns the collection of books.
  - **Success status:** `200 OK`
  - **Request body:** None.

- **Get one book**
  - **Method:** `GET`
  - **Path:** `/api/books/{id}`
  - **Description:** Returns the book matching the supplied ID.
  - **Success status:** `200 OK`
  - **Request body:** None.

- **Create a book**
  - **Method:** `POST`
  - **Path:** `/api/books`
  - **Description:** Creates a book record.
  - **Success status:** `201 Created`
  - **Example request body:**
    ```json
    {
      "title": "Things Fall Apart",
      "author": "Chinua Achebe",
      "isbn": "9780435905255",
      "publishedYear": 1958
    }
    ```

- **Update a book**
  - **Method:** `PUT`
  - **Path:** `/api/books/{id}`
  - **Description:** Updates the details of an existing book.
  - **Success status:** `200 OK`
  - **Example request body:**
    ```json
    {
      "title": "Things Fall Apart",
      "author": "Chinua Achebe",
      "isbn": "9780435905255",
      "publishedYear": 1958
    }
    ```

- **Delete a book**
  - **Method:** `DELETE`
  - **Path:** `/api/books/{id}`
  - **Description:** Deletes the specified book.
  - **Success status:** `204 No Content`
  - **Request body:** None.

- **List books by author**
  - **Method:** `GET`
  - **Path:** `/api/books?author=Chinua%20Achebe`
  - **Description:** Filters the book collection by the `author` query parameter.
  - **Success status:** `200 OK`
  - **Request body:** None; author is supplied in the query string.

## Error responses

- **`400 Bad Request`** — The request is invalid, such as a create request missing a required `title` or `author`, or containing an invalid publication year.
- **`404 Not Found`** — The requested book ID does not exist, such as `GET /api/books/9999` when no book has that ID.
