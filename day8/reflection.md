# Day 8 Reflection

The most difficult concept in the course was understanding how system design changes when many users interact with the same data at the same time. Building a feature for one user is relatively straightforward, but concurrency, database consistency, caching, load balancing and failures require a different way of thinking. I overcame this by breaking requests into smaller steps and tracing what happens from the browser to the API and database. Designing the TicketHub seat-booking flow helped me understand why transactions, row locking and database constraints are essential.

Based on feedback from my capstone work, I would improve my architecture documentation by making traffic assumptions clearer and explaining more explicitly which operations should use the primary database and which can use a read replica. I would also test more failure scenarios, especially payment retries, expired seat holds and simultaneous attempts to purchase the same seat.

Next, I want to learn more about cloud deployment and production operations. I plan to study Docker, CI/CD, monitoring, Redis, database replication and cloud load balancers. I also want to deploy a small full-stack application so I can connect the system-design concepts from this course to a real production environment.

