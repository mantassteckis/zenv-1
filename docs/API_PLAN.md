# ZenType API Enhancement & Hardening Plan

This document outlines a phased plan to enhance the ZenType API's observability, scalability, user experience, and long-term maintainability. Each phase builds a foundation for the next, ensuring a logical progression of improvements.

---

## Phase 1: Implement End-to-End Request Tracing (Observability Foundation)

**Goal:** Establish a robust logging and tracing foundation. This is the most critical first step because it will make debugging all subsequent changes infinitely easier. Every request will be traceable from the client, through the Next.js API, to the Firebase backend, and back.

### Action Items:

#### 1.1 Introduce a Correlation ID Middleware/Utility
*   **Client-Side Generation:** The correlation ID should be generated on the client-side before the first request is made. The Next.js middleware should only generate an ID if one is not already provided in the header.
*   **Specific ID Format:** Use a format that ensures high uniqueness, such as `req-{timestamp}-{random}`.
*   **Client-Side Storage:** Store the generated correlation ID in the client's `sessionStorage`. This allows it to be referenced for subsequent actions or manual error reporting during the user's session.
*   **Return in Response Headers:** In addition to including the `correlationId` in error response bodies, the ID should be returned in the headers of all API responses. This allows client-side logging and debugging tools to easily capture it.

#### 1.2 Standardize Structured Logging
Claude's plan proposes a more comprehensive and standardized structure for every log entry. In addition to `correlationId`, `userId`, and `functionName`, each log should include:

*   **Timestamp:** In ISO 8601 format.
*   **Service Name:** A string identifying the origin of the log (e.g., "nextjs-api", "firebase-function-generateTest", "ai-service").
*   **Request Method and Path:** e.g., `GET /api/v1/tests`.
*   **Response Status Code:** The HTTP status code of the response.
*   **Execution Time:** The duration of the operation in milliseconds.
*   **Error Details:** A structured object for errors, if applicable.
*   **Additional Context:** Any other relevant operational data.

#### 1.3 Centralized Logging System
**Objective:** Aggregate logs from all services (Next.js/Vercel, Firebase) into a single, searchable system.

**Action Items:**

1.  **Set Up Log Aggregation:**
    *   Use Google Cloud Logging as the central hub.
    *   Configure Vercel Log Drains to automatically forward all Next.js application and API logs to Google Cloud Logging.
2.  **Create Debug Utilities:**
    *   Build a simple debug dashboard or admin interface.
    *   This interface should allow internal users to search aggregated logs by `correlationId`, `userId`, time range, error type, or service name.
3.  **Implement Log Retention Policies:**
    *   Establish clear policies for how long logs are stored (e.g., 30 days for general debug logs, 90 days for critical error logs).
4.  **Enhance Error Tracking:**
    *   Configure automatic alerting for all 5xx server errors.
    *   Set up error summary tools (like Sentry, or within GCP Error Reporting) to group similar errors.
    *   Track error rates over time and create alerts for unusual spikes.

#### 1.4 Request Performance Monitoring
**Objective:** Track and monitor API performance metrics to identify bottlenecks.

**Action Items:**

1.  **Collect Performance Metrics:**
    *   Record the total execution time for every API endpoint.
    *   Specifically track the duration of database queries and external service calls (e.g., to the AI service) separately from the main execution time.
    *   Measure the payload sizes of both requests and responses.
2.  **Create Performance Dashboards:**
    *   Visualize key metrics such as:
        *   Average, 95th, and 99th percentile response times per endpoint.
        *   Request volume and error rates over time.
        *   A list of the slowest database queries.

---

## Phase 2: Introduce Asynchronous Processing for Long-Running Operations

**Goal:** Improve application responsiveness and scalability by converting synchronous, blocking operations into asynchronous background jobs. This leverages the observability foundation from Phase 1 for tracking these jobs.

### Action Items:

1.  **Refactor the `generateAiTest` Cloud Function.**
    *   **Instruction:** The `generateAiTest` function, which can be slow, must be changed to an asynchronous workflow.
    *   **Implementation Guidance:**
        1.  **Create a New Firestore Collection:** Create a collection named `aiTestJobs` to track the status of generation requests. A document in this collection might contain fields like `status` ('pending', 'completed', 'failed'), `userId`, `topic`, `createdAt`, `completedAt`, and `resultTestId` or `error`.
        2.  **Modify the `generateAiTest` Endpoint:**
            *   Instead of performing the AI generation directly, the function should now:
                *   Create a new document in the `aiTestJobs` collection with a status of 'pending'.
                *   Immediately return a `202 Accepted` status code to the client, along with the `jobId` (which is the ID of the document just created).
        3.  **Create a Background Trigger:**
            *   Create a *new* Firebase Cloud Function that triggers `onWrite` or `onCreate` for the `aiTestJobs` collection.
            *   This new function will contain the actual logic to call the Genkit AI service. Crucially, it must log all its steps using the `correlationId` passed in the original job document.
            *   Once the AI generation is complete, this function updates the job document's status to 'completed' (and stores the new test ID) or 'failed' (and stores the error message).

2.  **Update the Client-Side UI to Handle the Async Flow.**
    *   **Instruction:** The frontend application must be updated to handle this new asynchronous pattern.
    *   **Implementation Guidance:**
        *   When the user clicks "Generate Test," the UI should now expect a `202` response containing a `jobId`.
        *   Upon receiving the `jobId`, the UI should enter a "generating" state.
        *   The client should then use a **Firestore real-time listener** to listen for changes to the specific job document (`aiTestJobs/{jobId}`). This is more efficient than polling.
        *   When the listener detects that the document's status has changed to 'completed' or 'failed', it should update the UI accordingly—either displaying the new test or showing an error message.

---

## Phase 3: Formalize API Structure with Versioning and Pagination

**Goal:** Future-proof the API by introducing versioning and ensure performance under load by implementing consistent pagination.

### Action Items:

1.  **Implement URI Path Versioning.**
    *   **Instruction:** All existing Next.js API routes must be migrated to a versioned path.
    *   **Implementation Guidance:**
        *   Restructure the `app/api` directory to include a version number.
        *   Example: `app/api/tests/route.ts` should be moved to `app/api/v1/tests/route.ts`.
        *   All client-side fetch calls must be updated to include `/v1/` in the URL.
        *   This should be a straightforward file and code search-and-replace task for your agent.

2.  **Enforce Pagination on All Collection Endpoints.**
    *   **Instruction:** The `GET /api/v1/tests` endpoint, which currently returns all tests, must be paginated.
    *   **Implementation Guidance:**
        *   The documentation already notes that the `getTestHistory` endpoint uses cursor-based pagination with Firestore. This is the best-practice model to replicate.
        *   Modify the `/api/v1/tests` endpoint to accept `limit` and `cursor` (or `startAfter`) query parameters.
            *   `limit`: The maximum number of items to return (e.g., default to 20).
            *   `cursor`: The identifier of the last item from the previous page, used to fetch the next set.
        *   The API response for a paginated collection should be an object that contains the array of data and metadata for the next page.
    *   **Conceptual Example of a Paginated Response:**
        ```json
        {
          "data": [
            // ... array of test objects ...
          ],
          "pagination": {
            "nextCursor": "doc_id_of_last_item_retrieved",
            "hasNextPage": true
          }
        }
        ```
        *If `nextCursor` is `null`, the client knows it has reached the last page.*

---

## Phase 4: Harden Security and Reliability

**Goal:** Protect the API from abuse and add a final layer of robustness.

### Action Items:

1.  **Implement Rate Limiting on Critical Endpoints.**
    *   **Instruction:** Add rate limiting to sensitive or expensive endpoints, especially `generateAiTest` and authentication endpoints.
    *   **Implementation Guidance:**
        *   For Firebase Cloud Functions, your agent should investigate using the **"Fixed-rate limiting" Firebase Extension**. This is a pre-built solution that can be configured to limit invocations per user per time interval.
        *   For Next.js API Routes hosted on Vercel, your agent can use a library like `rate-limiter-flexible` combined with a Redis store (like Vercel KV) to track request counts per IP or user ID.
        *   When a limit is exceeded, the API **must** return a `429 Too Many Requests` status code.
        *   **IMPLEMENTATION STATUS:** ✅ Rate limiting has been implemented on the `/api/v1/tests` endpoint using `@upstash/ratelimit` with Redis. The endpoint enforces a limit of 100 requests per minute per IP address and returns proper 429 status codes with `Retry-After` headers when limits are exceeded.