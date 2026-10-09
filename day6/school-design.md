# School Database System Design

## Table Explanations & Relationships

1. **`students`**: Stores core information about registered students, including a unique primary key (`id`), full name, and a unique email address.
2. **`courses`**: Stores available course information, including a unique primary key (`id`), course title, and a unique course code.
3. **`enrolments`**: Acts as a junction (associative) table that records which students are taking which courses alongside their assigned grades.

### Relationships & Junction Table Requirement
- **`One-to-Many Relationships**: The relationship between `students` and `enrolments` is 1-to-Many (one student can have many enrolment records). Similarly, the relationship between `courses` and `enrolments` is 1-to-Many (one course can have many enrolment records).
- **`Many-to-Many Relationship**: The relationship between `students` and `courses` is inherently **Many-to-Many (M:N)** because a single student can enrol in multiple courses, and a single course can contain multiple students.
- **`Why a Join Table is Needed**: Relational databases cannot directly store Many-to-Many links without duplicating data or placing list/array values into single cells, both of which violate database normalization rules. A junction table (`enrolments`) decomposes the single M:N relationship into two 1:N relationships using foreign keys (`student_id` and `course_id`), keeping the data structure clean, normalized, and performant.

## Index Optimization

```sql
CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);
```
## Reason:
In a typical school system, lookups filtering by student_id (e.g., retrieving student transcripts or active schedules) happen frequently. Creating an index on enrolments.student_id drastically speeds up JOIN queries between the students and enrolments tables by avoiding full table scans as the dataset grows.

## SQL vs. NoSQL Justification
For a school enrolment system, SQL (Relational Database) is the vastly superior choice over NoSQL. School systems require high transactional integrity and strict constraints—such as guaranteeing unique email addresses, enforcing referential integrity with foreign keys so enrolments cannot reference nonexistent students, and preventing duplicate course registrations. SQL ensures ACID compliance out of the box and simplifies multi-table queries (such as generating student transcripts or aggregate enrolment statistics) through standardized JOIN operations.
