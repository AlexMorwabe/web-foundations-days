# TicketHub System Design & Architecture Specification

## 1. Requirements

### Functional Requirements
1. **Event Browsing & Search**: Users can search, filter, and view upcoming concerts and event details.
2. **Interactive Seat Selection**: Users can view real-time seat availability maps for specific venues.
3. **Temporary Seat Hold**: Users can temporarily reserve selected seats for up to 10 minutes to complete checkout.
4. **Order Processing & Payment**: Users can pay for held seats and receive digital confirmation tickets.
5. **Ticket Management**: Users can view and manage their purchased tickets in their user portal.

### Non-Functional Requirements
1. **Correctness (Zero Overbooking)**: Under no circumstances may two users purchase the exact same seat (100% strict transaction isolation).
2. **High Availability**: The system must remain responsive during extreme peak traffic surges (e.g., flash sales).
3. **Low Latency**: Page load and seat map status checks must complete in under 100 ms under normal load and under 500 ms during major concert drops.
4. **Fairness**: Virtual queuing must enforce First-Come, First-Served (FCFS) access during high-demand flash sales to prevent bot exploitation.

---

## 2. Capacity Estimates & Traffic Analysis

### Baseline Facts
- **Registered Users**: 2,000,000 users
- **Normal Daily Visitors**: 50,000 visitors/day (10 page views each = 500,000 page views/day)
- **Normal Ticket Sales**: 5,000 tickets sold/day
- **Flash Sale Event**: 200,000 concurrent users competing for 20,000 seats within a 10-minute window (600 seconds)

---

### Quantitative Estimates

#### A. Normal Daily Traffic
- **Page Views/sec**: 
  $$\frac{500,000 \text{ views}}{86,400 \text{ seconds}} \approx 5.79 \text{ views/sec}$$
- **Normal Writes (Purchases)/sec**: 
  $$\frac{5,000 \text{ purchases}}{86,400 \text{ seconds}} \approx 0.058 \text{ writes/sec}$$

#### B. Flash Sale Peak Traffic (10-Minute Window)
- **Peak Users**: 200,000 concurrent active connections.
- **Seat Map / Status Reads**: Assuming 200,000 users refresh/check seat availability every 5 seconds over 600 seconds:
  $$\frac{200,000 \times 120 \text{ checks}}{600 \text{ seconds}} \approx 40,000 \text{ read requests/sec}$$
- **Seat Hold / Purchase Attempts**: 200,000 users attempting seat holds almost simultaneously during the opening minute (60 seconds):
  $$\frac{200,000 \text{ write attempts}}{60 \text{ seconds}} \approx 3,333 \text{ write requests/sec}$$

#### C. Normal vs. Flash Sale Comparison
| Metric | Normal Daily Operations | Flash Sale Peak | Multiplier Increase |
| :--- | :--- | :--- | :--- |
| **Read Requests/sec** | ~5.8 RPS | ~40,000 RPS | **~6,900× increase** |
| **Write Requests/sec**| ~0.06 RPS | ~3,333 RPS | **~55,500× increase** |

---

## 3. API Design

### 1. `GET /api/v1/events`
* **Description**: List and filter available events.
* **Success Status**: `200 OK`

### 2. `GET /api/v1/events/{id}/seats`
* **Description**: Fetch live seat mapping and availability status for an event.
* **Success Status**: `200 OK`

### 3. `POST /api/v1/seats/hold`
* **Description**: Request a temporary 10-minute lock on specific seat IDs.
* **Request Body**:
  ```json
  {
    "event_id": 402,
    "seat_ids": [101, 102],
    "user_id": 8921
  }