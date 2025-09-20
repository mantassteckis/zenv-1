# ZenType API Architecture & Design

This document provides a detailed overview of the architectural and design principles of the ZenType API, based on the existing codebase and documentation.

## Section 1: Core Principles & Design Philosophy

### What is the primary architectural style of the API (e.g., REST, GraphQL, gRPC, SOAP)? Describe the core principles guiding its design.

The API follows a hybrid architectural style, primarily leveraging:
1.  **RESTful principles** for client-server communication via Next.js API Route Handlers.
2.  **RPC-style calls** for secure, server-side operations using Firebase Cloud Functions (`onCall` triggers).

The core design principles are:
*   **Clean Separation of Concerns**: The UI (React components) is strictly for presentation. All business logic, data fetching, and state mutations are handled by a dedicated backend layer (API Routes, Cloud Functions, and hooks).
*   **Security First**: Authorization and data access are enforced on the server-side through Firebase Security Rules, ensuring users can only access their own data. All data-writing operations are handled by secure Cloud Functions.
*   **Statelessness**: The server does not hold any client-specific state. Each request from the client contains all the necessary information to be processed, with authentication handled via self-contained JWT tokens.
*   **Consistency**: The API strives for consistency in naming conventions (URL paths, JSON fields), response structures, and error handling.

### Is the API stateless? Explain how server-side state is avoided or managed if it exists.

Yes, the API is stateless. State is not stored on the server between requests. This is achieved through the use of **JSON Web Tokens (JWT)** provided by Firebase Authentication. Every authenticated request includes an `Authorization: Bearer <token>` header, which provides the server with the user's identity and permissions for that specific request.

### How does the API identify resources? Does it use nouns for resource names (e.g., `/users`) or verbs (e.g., `/getUsers`)?

The API identifies resources using **plural nouns**, which is a core convention of RESTful design.

Examples:
*   `/api/tests`
*   `/api/test/results`
*   `/api/leaderboard`

### How is consistency maintained across the API in terms of naming, response structures, and behavior?

Consistency is maintained through a set of established conventions:
*   **Naming**:
    *   **URL Paths**: Plural nouns are used for resource collections (e.g., `/api/tests`).
    *   **JSON Fields**: `camelCase` is the standard for all fields in request and response bodies.
*   **Response Structures**: APIs provide consistent JSON object structures. Successful responses for collections include the data array, and error responses contain a structured error message.
*   **Behavior**: Standard HTTP methods are used according to their semantic meaning (e.g., `GET` for retrieval, `POST` for creation/actions).

### What are the guiding principles for the API's simplicity and ease of use for client developers?

The API is designed with the client developer in mind, following these principles:
*   **Clear Documentation**: Files like `API_ENDPOINTS.md` and `backend_api_endpoints.md` document the purpose, parameters, and response formats for each endpoint.
*   **Standard Conventions**: The API adheres to widely accepted standards (REST, JSON, HTTP status codes), making it predictable and intuitive.
*   **Abstraction**: Complex server-side logic (like database queries and transactions) is abstracted away behind simple API endpoints.

## Section 2: Resource Modeling & URL Design

### What is the standard naming convention for URL path segments (e.g., kebab-case, snake_case, camelCase)?

The standard naming convention for multi-word URL path segments is **kebab-case**, as seen in `app/api/submit-test-result/route.ts`.

### How are collections of resources named? Provide an example (e.g., /products vs. /product).

Collections are named using **plural nouns**.
*   Example: `/api/tests` is used to represent the collection of typing tests.

### Describe the structure for accessing a single resource within a collection (e.g., /products/{productId}).

While the current documentation primarily focuses on fetching collections with filters, the standard RESTful approach of using a path parameter to identify a single resource (e.g., `/api/tests/{testId}`) would be the expected structure. This pattern is not explicitly implemented in the current set of API routes but is a standard REST convention.

### How are nested or related resources represented in the URL? What is the maximum nesting depth allowed (e.g., /users/{userId}/orders/{orderId})?

The API favors a **flat URL structure** and does not currently use nested resource paths. Relationships are managed through:
1.  **Authentication Context**: User-specific resources are fetched based on the `uid` from the authenticated user's JWT, not from a nested URL like `/users/{userId}/...`.
2.  **Query Parameters**: Filtering related data is done via query parameters (e.g., fetching tests for a specific category).

There is no defined maximum nesting depth, as it is not a pattern that is currently used.

### Are there any instances where actions or verbs are used in the URL paths (e.g., /users/{id}/send-password-reset)? If so, explain the rationale.

Yes, there are a few instances where paths represent actions rather than resources. This is a pragmatic exception to strict REST principles for operations that don't map cleanly to a standard CRUD model.

*   `/api/submit-test-result`: This `POST` endpoint represents the action of submitting a completed test.
*   `/api/auth/login`, `/api/auth/signup`: These are common and accepted non-RESTful endpoints for handling authentication workflows.
*   `/api/test/ai_text`: This `POST` endpoint triggers the AI generation process, which is an action, not a resource.

## Section 3: HTTP Methods & Operations

### Explain how each of the standard HTTP methods (GET, POST, PUT, PATCH, DELETE) is used across the API.

*   **`GET`**: Used to retrieve resources. For example, `GET /api/tests` fetches a collection of pre-made typing tests.
*   **`POST`**: Used for two purposes:
    1.  **Resource Creation**: `POST /api/test/results` saves a new test result to the database.
    2.  **Triggering Actions**: `POST /api/auth/login` authenticates a user, and `POST /api/test/ai_text` initiates AI content generation.
*   **`PUT`, `PATCH`, `DELETE`**: These methods are not currently documented or used in the existing Next.js API routes. Profile updates are handled by a dedicated `updateUserProfile` function within a Firebase Cloud Function, which behaves like a `PATCH` operation, but it is not exposed as a standard REST endpoint.

### How does the API differentiate between PUT (full update) and PATCH (partial update)? Provide an example of a PATCH request body.

The API does not currently expose `PUT` or `PATCH` endpoints, so there is no differentiation documented. The internal `updateUserProfile` function accepts a partial object of data to update, which is characteristic of a `PATCH` operation.

### Are all GET, PUT, and DELETE operations idempotent? How is this idempotency ensured, especially for write operations?

*   **`GET`**: All `GET` operations are idempotent by nature, as they only retrieve data and do not have side effects.
*   **`PUT` / `DELETE`**: Since these methods are not currently implemented as HTTP endpoints, their idempotency is not defined in the context of the API.

### Does the API use the POST method for anything other than resource creation? If so, describe these non-standard use cases.

Yes. As described previously, `POST` is used for action-oriented operations that do not involve creating a resource in a collection, such as:
*   User authentication (`/api/auth/login`).
*   Triggering the AI test generation process (`/api/test/ai_text`).
*   Submitting a test result for processing and storage (`/api/submit-test-result`).

### Is the HEAD method supported for any endpoints to retrieve only headers?

Support for the `HEAD` method is not mentioned in the project's documentation.

## Section 4: Data Handling, Payloads & Filtering

### What is the primary data format for request and response bodies (e.g., JSON, XML)? Is application/json the standard Content-Type?

The primary and standard data format is **JSON**. The standard `Content-Type` header for requests is `application/json`, as seen in client-side `fetch` calls.

### What is the naming convention for fields within JSON payloads (e.g., camelCase, snake_case)?

The standard naming convention for all JSON fields is **`camelCase`**. This is enforced across all TypeScript interfaces and API responses.

### How are date and time values formatted in responses (e.g., ISO 8601 string, Unix timestamp)?

Date and time values are formatted as **ISO 8601 strings**. For example, the `createdAt` field is generated using `new Date().toISOString()`.

### How does the API support filtering collections of resources? Provide an example of a URL with filter parameters (e.g., /products?status=active&category=electronics).

Filtering is supported through **URL query parameters**. The `/api/tests` endpoint can be filtered by `difficulty`, `timeLimit`, and `category`.

*   **Example**: `GET /api/tests?difficulty=Hard&category=Technology`

### How is sorting implemented for resource collections (e.g., ?sort=-createdAt)?

A generic URL-based sorting parameter (like `?sort=...`) is not implemented. Sorting is handled within the backend logic based on the endpoint's purpose. For instance, the `/app/history/page.tsx` component constructs a Firestore query with an `orderBy` clause to sort results directly from the database.

### What pagination strategy is used (e.g., offset/limit, cursor-based)? Describe the query parameters and response structure for pagination.

The project uses two strategies:
1.  **Cursor-based Pagination**: This is the primary strategy used for fetching data directly from Firestore, as seen in the history page (`app/history/page.tsx`). It uses Firestore's `startAfter(documentSnapshot)` and `limit(pageSize)` methods to fetch subsequent pages. This is highly efficient for large datasets.
2.  **Offset/Limit Pagination**: The documentation for the `/api/test/history` endpoint in `docs/backend_api_endpoints.md` specifies `limit` and `offset` query parameters, suggesting a more traditional pagination style for some API routes.

### Does the API support sparse fieldsets (allowing clients to request only specific fields) to reduce payload size? If so, how (e.g., ?fields=id,name,email)?

Support for sparse fieldsets is not mentioned in the project's documentation.

## Section 5: Authentication & Authorization

### What authentication mechanism is used to secure the API (e.g., OAuth 2.0 Bearer Tokens, JWT, API Keys)?

The API is secured using **JWT Bearer Tokens** issued by Firebase Authentication.

### How are authentication credentials transmitted? (e.g., in the Authorization header, as a cookie).

Credentials are transmitted in the **`Authorization` header** of each authenticated request.

*   **Format**: `Authorization: Bearer <ID_TOKEN>`

### Describe the token lifecycle: how are tokens issued, what is their expiration time, and is there a refresh mechanism?

*   **Issuance**: Tokens are issued by the Firebase Authentication service upon a successful user login (via email/password or Google OAuth).
*   **Expiration**: Firebase ID tokens have a default expiration time of **one hour**.
*   **Refresh**: The Firebase client-side SDK automatically and transparently handles token renewal in the background before they expire, ensuring a seamless user session.

### How does the API handle authorization (i.e., determining what an authenticated user is allowed to do)? Is this based on roles, scopes, or another model?

Authorization is handled through a **user-based access control model** enforced by **Firestore Security Rules**. These rules ensure that users can only read or write data associated with their own `userId`. There is no evidence of a role-based (e.g., admin) or scope-based authorization model.

*   **Example Rule**: `allow read, write: if request.auth != null && request.auth.uid == userId;`

### Are different levels of access granted for different API clients or user types? Explain the mechanism.

The primary access level distinction is between **authenticated** and **unauthenticated** users. The Firestore security rules are the mechanism for enforcing this. There is no documentation to suggest different access levels among different types of authenticated users.

## Section 6: Error Handling & Status Codes

### Describe the standard structure of an error response body. Does it include a unique error code, a human-readable message, and any contextual details?

Yes, the error responses are structured. The format depends on the source:
*   **Firebase Cloud Functions**: Errors are returned with a specific `errorCode` and a human-readable `errorMessage`.
    *   Example: `{ "errorCode": "functions/unauthenticated", "errorMessage": "User must be authenticated" }`
*   **Next.js API Routes**: Errors are typically returned in a simpler JSON object.
    *   Example: `{ "error": "Failed to fetch tests" }`

### How does the API use HTTP status codes to differentiate between client-side errors (4xx) and server-side errors (5xx)?

The API follows standard HTTP practice by using `4xx` status codes for client-side errors and `5xx` codes for server-side failures. For example, a server-side database connection issue would return a `500 Internal Server Error`.

### What is the difference in usage between a 400 Bad Request, 401 Unauthorized, 403 Forbidden, and 404 Not Found in this API?

*   **`400 Bad Request`**: Used for input validation failures. For example, if a required `topic` is missing when generating an AI test, the Cloud Function returns an `invalid-argument` error, which maps to a 400 status.
*   **`401 Unauthorized`**: Used when authentication is required but is missing or invalid. The Cloud Functions return an `unauthenticated` error, which maps to a 401 status.
*   **`403 Forbidden`**: Used when an authenticated user attempts to access a resource they do not have permission for. This is enforced by Firestore Security Rules, which would return a `PERMISSION_DENIED` error that maps to a 403 status.
*   **`404 Not Found`**: Used when the requested resource or endpoint does not exist.

### When is a 422 Unprocessable Entity status code used? Provide an example scenario (e.g., validation failure).

The `422 Unprocessable Entity` status code is not mentioned in the documentation. Client-side validation errors that make it to the server are handled with a `400 Bad Request`.

### Does the API include a correlation ID or request ID in every response (both success and error) to aid in debugging?

The client-side debug logging system (`DebugProvider`) generates and uses a `sessionId` to correlate logs within a single user session. However, there is no evidence that this ID is returned in the headers of API responses.

## Section 7: Performance & Optimization

### What caching strategies are implemented? Describe the use of HTTP headers like Cache-Control, ETag, and Last-Modified.

Server-side HTTP caching strategies (using headers like `Cache-Control` or `ETag`) are not explicitly documented in the application's API code. Caching appears to be a client-side concern:
*   User preferences are cached in `localStorage`.
*   The AI Generation Guide mentions plans for client-side caching of generated tests.

### How does the API handle long-running operations that cannot be completed synchronously? (e.g., returns a 202 Accepted with a status polling link).

The API handles potentially long-running operations, like AI test generation, with a **synchronous request-response model**. The client-side application sets a loading state (e.g., `isGenerating`) and waits for the `fetch` call to complete. The API does not use a `202 Accepted` response with a polling mechanism.

### Is rate limiting or request throttling in place? How is it configured (e.g., by IP, user, API key)? What response is sent when a limit is exceeded (429 Too Many Requests)?

Rate limiting is mentioned as a planned feature and a security best practice in the documentation (`backend_api_endpoints.md` and `AI_TEST_GENERATION_GUIDE.md`). However, the specific implementation details (e.g., configuration by IP/user, or the use of `429 Too Many Requests`) are not documented.

### Is response compression (e.g., Gzip, Brotli) supported and enabled?

Response compression is not configured at the application level. This is typically handled automatically by the hosting platform (Vercel for Next.js applications), which enables compression like Gzip or Brotli by default for optimal performance.

## Section 8: Versioning & Lifecycle Management

### How is the API versioned? (e.g., URI path /v1/, custom request header Api-Version: 1, or via content negotiation).

The API is not currently versioned. As the application is in its early stages, versioning has not been implemented. The standard and recommended approach for future implementation would be **URI path versioning** (e.g., `/api/v1/...`).

### What is the policy for introducing breaking changes versus non-breaking changes?

There is no formal policy documented yet. However, following standard best practices:
*   **Non-breaking changes** (e.g., adding a new optional field to a response) could be introduced to the existing API.
*   **Breaking changes** (e.g., removing a field, changing a data type) would require the introduction of a new API version (e.g., `/v2`).

### How are clients notified of upcoming endpoint deprecations? Is the Deprecation header or documentation used?

A formal deprecation notification process is not yet in place. When implemented, deprecations would be announced in the project's documentation, specifically in `API_ENDPOINTS.md` and `backend_api_endpoints.md`.

### Is there a defined lifecycle and sunset policy for older API versions?

No, as there is only one unversioned API currently, a lifecycle and sunset policy has not been defined.

## Section 9: Security

### Is HTTPS (TLS) enforced for all API traffic?

Yes. The application is hosted on Vercel, which **automatically enforces HTTPS (TLS)** for all traffic, encrypting data in transit between the client and the server.

### What measures are in place to prevent common vulnerabilities like SQL Injection, Cross-Site Scripting (XSS), and Insecure Direct Object References (IDOR)? Describe the input validation and output encoding strategy.

*   **SQL Injection**: Not applicable. The project uses Firestore, a NoSQL database, which is not vulnerable to traditional SQL injection attacks.
*   **Cross-Site Scripting (XSS)**: React, by default, **escapes and encodes** dynamic content rendered in JSX, which mitigates most XSS risks.
*   **Insecure Direct Object References (IDOR)**: This is prevented by **Firestore Security Rules**. These server-side rules ensure that a user can only access documents where their `userId` matches the `userId` associated with the data, thus preventing them from accessing another user's resources.
*   **Input Validation**: Input validation is performed on the server-side within Firebase Cloud Functions. For example, the function to generate an AI test checks for the presence and validity of the `topic` parameter.

### What is the Cross-Origin Resource Sharing (CORS) policy? Is it configured restrictively for known clients?

The CORS policy is managed by the hosting environments:
*   **Next.js API Routes (Vercel)**: By default, API routes are same-origin only.
*   **Firebase Cloud Functions**: The `onCall` functions are designed to be called from the app itself, and Firebase manages the CORS policy to allow requests from the application's domain.

### Is any sensitive information, such as tokens or personal data, ever exposed in URL query parameters?

No. Sensitive information is never exposed in URLs. Authentication tokens are sent in the `Authorization` header, and user-specific data is identified by the user's ID token on the server, not via URL parameters.

### Are security headers like Strict-Transport-Security, Content-Security-Policy, and X-Content-Type-Options used?

These headers are not explicitly configured in the application code. However, modern hosting platforms like Vercel often add key security headers (like `Strict-Transport-Security`) by default to enhance security.

## Section 10: Documentation & Discoverability

### How is the API documented? (e.g., OpenAPI/Swagger specification, Postman Collection, custom developer portal).

The API is documented manually in **Markdown files** within the `docs/` directory.
*   `API_ENDPOINTS.md`
*   `backend_api_endpoints.md`

### Is the documentation generated automatically from code comments/annotations or maintained manually?

The documentation is **maintained manually**.

### Does the API utilize hypermedia (HATEOAS) to allow clients to discover available actions from resource representations? If so, provide an example link object in a response.

No, the API does not use HATEOAS. It follows a more traditional REST model where the client is expected to know the available endpoints based on the documentation.