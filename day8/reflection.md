# Capstone Reflection & Learning Journey

## 1. Most Difficult Concept & Overcoming It
The most challenging concept in this course was designing for asynchronous systems and eventual consistency, specifically using message queues and background workers to handle heavy write operations. Shifting my mindset away from synchronous, linear request-response execution to decoupled background workflows required a deeper understanding of race conditions and system state transitions. 

I overcame this by drawing step-by-step sequence diagrams for complex user flows—such as thumbnail generation and asynchronous seat holds—and tracing how data moves across stateless app servers, caches, and relational databases under high load.

## 2. Capstone Improvements Based on Feedback
Based on feedback received on my system design projects, I would improve the cache invalidation strategy and real-time state feedback in my capstone layout. Specifically, rather than relying on full cache invalidations or user refreshes during peak events, I would integrate WebSocket connections and event-driven Redis pub/sub channels to push live seat availability updates directly to client browsers.

## 3. What I Will Learn Next
Moving forward, my immediate technical development goals include:
1. **Containerization & Orchestration**: Mastering Docker and Kubernetes to build and deploy autoscaling microservices.
2. **Advanced Database Architecture**: Studying database sharding strategies, connection pooling, and CDC (Change Data Capture) pipelines.
3. **Infrastructure as Code (IaC)**: Learning Terraform to automate scalable cloud infrastructure provisioning.