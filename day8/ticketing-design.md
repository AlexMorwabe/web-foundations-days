# TicketHub: Event Ticketing System Design

## 1. Requirements

### Functional requirements

1.  Users can register, sign in, and manage their profiles.
2.  Users can browse, search, filter, and view upcoming events.
3.  Users can view venue seating plans and see whether seats are
    available, held, or sold.
4.  Users can temporarily hold available seats while completing
    checkout.
5.  Users can pay for an order and receive a confirmed booking only
    after payment is verified.
6.  Users can view their orders and tickets, including ticket
    identifiers and event details.
7.  The system can release expired or abandoned seat holds.
8.  Administrators and event organizers can create events, configure
    seats and prices, and review sales.
9.  The system records order and payment status so that failed or
    duplicate payment notifications can be handled safely.

### Non-functional requirements

-   **Speed:** Event pages and seat maps should usually load within 2
    seconds under normal load. Seat-hold requests should usually respond
    within 1 second, excluding external payment-provider delays.
-   **Correctness:** A seat can have at most one active hold or
    confirmed sale. The database, not just the user interface, must
    enforce this rule.
-   **Fairness:** Apply a consistent queue or rate-limiting policy
    during high-demand sales. Give users a clear queue position or
    status, avoid allowing automated clients to overwhelm the service,
    and use a short, fixed hold duration. Queue admission should not
    depend on repeatedly refreshing the page.
-   **Availability:** Browsing should remain available during a sale
    even if checkout is temporarily throttled. If the booking database
    is unavailable, the system must fail safely rather than confirm
    uncertain bookings.
-   **Security:** Use HTTPS, secure password hashing, authorization
    checks, input validation, rate limits, and payment-provider
    tokenization. Never store raw payment-card details.
-   **Scalability:** Application services should scale horizontally to
    handle sudden spikes in traffic.
-   **Reliability and recovery:** Back up the database, monitor service
    health, and keep auditable order and payment records.
-   **Accessibility:** Support keyboard navigation, readable contrast,
    and accessible seat-selection controls.

## 2. Traffic and capacity estimates

### Normal day

Given: - 50,000 visitors per day - 10 page views per visitor - 5,000
tickets sold per day - 2 million registered users

Calculations: - Page views per day = 50,000 × 10 = **500,000 page
views/day** - Average page-view rate = 500,000 ÷ 86,400 ≈ **5.8 page
views/second** - If visits are concentrated into 10 active hours, the
average during those hours is 500,000 ÷ 36,000 ≈ **13.9 page
views/second** - Average ticket sales = 5,000 ÷ 86,400 ≈ **0.058
tickets/second**, or about 208 tickets/hour averaged across the full
day.

These are averages, not peak values. Real traffic will be uneven, so
capacity planning should include headroom and load testing.

### Popular concert sale

Given 200,000 people try to buy 20,000 seats within 10 minutes: -
Arrival rate = 200,000 ÷ 600 ≈ **333 people/second** - Seats available =
**20,000** - Attempting users per seat = 200,000 ÷ 20,000 = **10 people
per seat** - If all 20,000 seats sell in the 10-minute window, the
average sale rate is 20,000 ÷ 600 ≈ **33.3 tickets/second**.

The 333 people/second figure is the approximate incoming attempt rate,
not a guaranteed request rate. One person may make multiple API
requests, and retries can increase load. Load tests should model
browsing, queue polling, seat holds, checkout, and payment callbacks
separately.

### Comparison and implications

The big sale creates about 333 incoming users/second. This is far above
the normal average of 5.8 page views/second, although the measurements
are different units and should not be compared as if they were
identical. A sale can also generate several requests per user. Use a
waiting room, cache read-heavy event data, rate-limit requests, scale
stateless application servers horizontally, and protect the booking
database with a controlled admission rate.

## 3. API design

All endpoints use HTTPS and JSON. Authenticated endpoints require a
valid session or bearer token. Responses include suitable HTTP status
codes and useful error messages.

  -----------------------------------------------------------------------------------------
  Method and endpoint                       Purpose                 Important behaviour
  ----------------------------------------- ----------------------- -----------------------
  `GET /api/events?search=&date=&page=`     Browse and search       Paginated; cacheable
                                            events                  for public event
                                                                    information

  `GET /api/events/{eventId}`               View event details      Returns venue, date,
                                                                    description, and sale
                                                                    status

  `GET /api/events/{eventId}/seats`         View seats and          Returns seat
                                            availability            identifiers, sections,
                                                                    prices, and status;
                                                                    availability can change
                                                                    immediately

  `POST /api/seat-holds`                    Hold selected seats     Requires
                                                                    authentication;
                                                                    validates availability
                                                                    atomically; returns
                                                                    hold ID and expiry time

  `DELETE /api/seat-holds/{holdId}`         Release a hold          Only the owner can
                                                                    release it; repeated
                                                                    release requests are
                                                                    safe

  `POST /api/orders`                        Create an order from    Verifies ownership and
                                            valid held seats        unexpired holds; uses
                                                                    an idempotency key

  `POST /api/orders/{orderId}/payments`     Start payment           Creates a
                                                                    payment-provider
                                                                    session; does not
                                                                    itself mark tickets as
                                                                    paid

  `POST /api/payment-webhooks/{provider}`   Receive                 Verifies provider
                                            payment-provider result signature and processes
                                                                    duplicate callbacks
                                                                    safely

  `GET /api/me/orders`                      View the signed-in      Returns only orders
                                            user's orders           owned by that user

  `GET /api/me/tickets`                     View confirmed tickets  Returns confirmed
                                                                    ticket details and
                                                                    ticket identifiers
  -----------------------------------------------------------------------------------------

### Example seat-hold request

``` json
{
  "eventId": "evt_123",
  "seatIds": ["seat_A12", "seat_A13"]
}
```

A successful response could include a hold identifier and expiry
timestamp. If a seat is no longer available, return `409 Conflict` and
identify the seats that could not be held. The client must not assume a
seat shown as available on a previously loaded seat map is still
available.

### API safety rules

-   Require an idempotency key for order creation and payment initiation
    so retries do not create duplicate orders or charges.
-   Verify authentication and ownership for holds, orders, and tickets.
-   Verify payment-provider webhook signatures.
-   Do not confirm an order based solely on a browser redirect; use a
    verified payment-provider result.
-   Return `429 Too Many Requests` when clients exceed defined rate
    limits.

## 4. Data model

The main tables are `users`, `events`, `seats`, and `orders`. Additional
tables for holds, order items, and payments make seat reservation and
payment processing clearer.

### Tables and key fields

**users** - `user_id` --- primary key - `email` --- unique, required -
`password_hash` --- required - `created_at`

**events** - `event_id` --- primary key - `title` - `venue_name` -
`starts_at` - `sales_open_at` - `status` --- for example, draft,
on_sale, sold_out, cancelled

**seats** - `seat_id` --- primary key - `event_id` --- foreign key to
`events.event_id` - `section` - `row_label` - `seat_number` - `price` -
`status` --- available, held, or sold - `hold_expires_at` --- nullable -
`hold_token` --- nullable identifier for the active hold

Add a unique constraint on `(event_id, section, row_label, seat_number)`
so a seat position is not duplicated for the same event. In a production
design, a separate venue-seat inventory model may be appropriate when
venues are reused across events.

**orders** - `order_id` --- primary key - `user_id` --- foreign key to
`users.user_id` - `event_id` --- foreign key to `events.event_id` -
`status` --- pending_payment, confirmed, failed, or cancelled -
`total_amount` - `currency` - `idempotency_key` - `created_at`

Add a uniqueness constraint on `(user_id, idempotency_key)` when the
idempotency key is supplied.

**order_items** - `order_item_id` --- primary key - `order_id` ---
foreign key to `orders.order_id` - `seat_id` --- foreign key to
`seats.seat_id` - `unit_price` - `ticket_code` --- unique identifier for
a confirmed ticket, nullable until issued

A unique constraint on `seat_id` in `order_items` prevents the same
event-seat record from being included in multiple orders. If cancelled
orders must allow the seat to be resold, enforce uniqueness only for
active/confirmed allocations (for example, with a database-specific
partial unique index), or maintain a separate current-inventory
allocation table with a unique `seat_id`. Historical cancelled order
items should be retained for auditing.

**seat_holds** - `hold_id` --- primary key - `user_id` --- foreign key
to `users.user_id` - `seat_id` --- foreign key to `seats.seat_id` -
`expires_at` - `status` --- active, converted, released, or expired -
`created_at`

Use a database constraint or locking strategy to ensure that a seat
cannot have more than one active hold. On databases that support partial
unique indexes, a unique index on `seat_id` for active holds can help,
but expiration must be handled carefully because time-dependent
predicates generally cannot safely define index membership. A
transactional inventory row is the primary concurrency control.

**payments** - `payment_id` --- primary key - `order_id` --- foreign key
to `orders.order_id` - `provider_reference` --- unique - `amount` -
`status` --- initiated, succeeded, failed, or refunded - `created_at`

### Relationships

-   One user can place many orders.
-   One event has many seats.
-   One event can have many orders.
-   One order has many order items.
-   Each order item refers to one seat.
-   A seat can have a history of holds, but only one active hold at a
    time.
-   One order can have payment attempts, each identified by a provider
    reference.

## 5. Preventing two people from buying the same seat

The seat map is only a view of availability; it is not the authority.
Two users may click the same seat at nearly the same time, so the server
must make the decision atomically in the database.

### Seat-hold transaction

1.  Start a database transaction.
2.  Lock the requested seat inventory rows using a row-level lock such
    as `SELECT ... FOR UPDATE`, or use a conditional update.
3.  Check that each seat is available, or that its previous hold has
    expired and been safely released.
4.  Change the seat from available to held, assign the hold owner/token,
    and set a short expiry time (for example, five minutes).
5.  Commit the transaction. If any requested seat cannot be held, roll
    back the entire multi-seat hold so the user does not receive only an
    unexpected partial selection.

A conditional update can also provide atomicity, for example:

``` sql
UPDATE seats
SET status = 'held',
    hold_token = :hold_token,
    hold_expires_at = :expiry
WHERE seat_id = :seat_id
  AND (
    status = 'available'
    OR (status = 'held' AND hold_expires_at < CURRENT_TIMESTAMP)
  );
```

The application must check that exactly one row was updated for every
requested seat. If zero rows were updated, another transaction has
already reserved or sold the seat. The example is illustrative:
multi-seat holds need a transaction and consistent locking order, and
expired holds must be reconciled safely with the associated hold
records.

### Confirming payment

-   Create an order linked to the held seats.
-   Confirm the hold still belongs to the buyer and has not expired
    before allowing checkout to proceed.
-   Process payment with the payment provider, using idempotency to
    prevent duplicate charges.
-   When verified payment succeeds, use a database transaction to mark
    the order confirmed, mark the seats sold, and convert the holds into
    completed allocations.
-   If payment fails or the hold expires before confirmation, do not
    issue tickets; release the seats according to a defined
    reconciliation policy.
-   Handle delayed payment callbacks carefully. If payment succeeds
    after a hold has expired and the seats have been reassigned, do not
    sell the same seats twice; use a compensation process such as
    refunding the payment or offering an approved alternative.

The database transaction and constraints protect correctness even when
requests arrive concurrently. A queue and rate limiter reduce pressure
but do not, by themselves, prevent double-booking.

## 6. Architecture diagram and component explanations

``` mermaid
flowchart TD
    U[Users and Browsers] --> CDN[CDN and WAF]
    CDN --> WEB[Web Front End]
    WEB --> WAIT[Waiting Room and Rate Limiter]
    WAIT --> API[Load Balancer and API Gateway]
    API --> APP[Stateless Application Services]
    APP --> CACHE[Cache for Public Event Data]
    APP --> DB[(Relational Booking Database)]
    APP --> Q[Message Queue]
    Q --> WORKERS[Background Workers]
    APP --> PAY[External Payment Provider]
    PAY --> WH[Verified Payment Webhook]
    WH --> APP
    WORKERS --> DB
    APP --> MON[Logs, Metrics and Alerts]
    DB --> BACKUP[Backups and Recovery]
```

### Components

1.  **Users and browsers:** Let customers browse events, select seats,
    check out, and retrieve tickets.
2.  **CDN and web application firewall (WAF):** Deliver static files
    close to users and filter common malicious traffic.
3.  **Web front end:** Displays event information, seat maps, queue
    status, and checkout results.
4.  **Waiting room and rate limiter:** Admits users at a controlled rate
    during high-demand sales. It should use a fair, clearly communicated
    policy and prevent unlimited refresh or automated request bursts.
5.  **Load balancer and API gateway:** Distributes requests across
    application instances and applies routing, authentication checks,
    and request limits.
6.  **Stateless application services:** Implement event browsing, seat
    holds, order creation, ticket access, and authorization. Multiple
    instances can be added as demand grows.
7.  **Cache:** Serves frequently requested public event information.
    Seat availability and purchase decisions must be revalidated against
    the database.
8.  **Relational booking database:** Stores inventory, holds, orders,
    payments, and ticket allocations. Transactions, row locks, and
    uniqueness constraints protect consistency.
9.  **Message queue and background workers:** Handle email delivery,
    hold-expiry cleanup, ticket generation, and other retryable tasks
    outside the main request path. Queue consumers should be idempotent.
10. **Payment provider and verified webhook:** Process payment securely
    and notify TicketHub of the final payment result.
11. **Monitoring and backups:** Track latency, queue depth, failed
    requests, database locks, payment errors, and inventory conflicts;
    support recovery after failures.

### How the architecture survives the big sale

-   Queue incoming users and admit them at a rate the booking database
    can sustain.
-   Cache event descriptions, images, venue details, and other
    read-heavy information.
-   Scale stateless web and API instances horizontally.
-   Keep seat allocation as a short database transaction; never hold a
    database lock while waiting for a payment provider.
-   Use connection pooling, query indexes, request timeouts, and
    back-pressure to protect the database.
-   Make payment callbacks and background jobs idempotent so retries do
    not create duplicate tickets.
-   Monitor queue waiting time, hold conflicts, database saturation, and
    checkout success, and have a clear degraded-mode message if booking
    must be paused.

## 7. Trade-offs

### Trade-off 1: Strict consistency versus maximum throughput

**Choice:** Use a relational database transaction and row-level locks
for seat allocation.

**Benefit:** Prevents concurrent users from reserving the same seat and
gives a reliable source of truth.

**Cost:** Contended seats can cause lock waits and lower throughput
during the most popular sales.

**Mitigation:** Admit users through a waiting room, keep transactions
short, lock seats in a consistent order, and load-test the expected
contention.

### Trade-off 2: Fairness versus fastest possible checkout

**Choice:** Use a waiting room with controlled admission and a short,
fixed seat-hold period.

**Benefit:** Reduces overload and makes access more predictable instead
of rewarding users who refresh continuously.

**Cost:** Customers may wait even when some seats are available, and
users who need more time may lose a hold.

**Mitigation:** Explain the queue and countdown clearly, provide
accessible controls, and define a reasonable hold period based on
usability testing.

### Trade-off 3: Caching versus immediately fresh seat availability

**Choice:** Cache public event details but retrieve authoritative seat
status from the booking service.

**Benefit:** Reduces load for frequently viewed event pages without
relying on stale data for purchases.

**Cost:** Seat-map requests still create database or booking-service
load, and the displayed availability can change between refresh and
selection.

**Mitigation:** Use short-lived seat-map responses or push updates where
useful, but always validate the seat atomically when creating a hold.
