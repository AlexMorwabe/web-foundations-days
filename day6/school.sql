-- ============================================================
-- 1. SCHEMA DEFINITION (CREATE TABLE STATEMENTS)
-- ============================================================

-- Students Table
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses Table
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

-- Enrolments Table (Junction Table for Students and Courses)
CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    -- Rule preventing the same student from enrolling in the same course twice
    UNIQUE (student_id, course_id)
);


-- ============================================================
-- 2. SAMPLE DATA INSERTION
-- ============================================================

-- Insert at least 3 students (including 1 student with no enrolments)
INSERT INTO students (full_name, email) VALUES
    ('Alice Smith', 'alice@example.com'),
    ('Bob Jones', 'bob@example.com'),
    ('Charlie Brown', 'charlie@example.com'),
    ('Diana Prince', 'diana@example.com');

-- Insert at least 3 courses
INSERT INTO courses (course_name, code) VALUES
    ('Web Foundations', 'CS101'),
    ('Database Design', 'CS102'),
    ('JavaScript Mastery', 'CS103');

-- Insert at least 5 enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
    (1, 1, 'A'),   -- Alice in Web Foundations
    (1, 2, 'B+'),  -- Alice in Database Design
    (2, 1, 'B'),   -- Bob in Web Foundations
    (2, 3, 'A-'),  -- Bob in JavaScript Mastery
    (3, 2, 'C');   -- Charlie in Database Design


-- ============================================================
-- 3. THE FIVE REQUIRED QUERIES
-- ============================================================

-- Query 1: All courses for one student (by name)
SELECT c.course_name, c.code, e.grade
FROM courses c
JOIN enrolments e ON c.id = e.course_id
JOIN students s ON e.student_id = s.id
WHERE s.full_name = 'Alice Smith';


-- Query 2: All students on one course (by course code/name)
SELECT s.full_name, s.email, e.grade
FROM students s
JOIN enrolments e ON s.id = e.student_id
JOIN courses c ON e.course_id = c.id
WHERE c.code = 'CS101';


-- Query 3: The number of students per course
SELECT c.course_name, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.id = e.course_id
GROUP BY c.id, c.course_name;


-- Query 4: Students who have no enrolments
SELECT s.full_name, s.email
FROM students s
LEFT JOIN enrolments e ON s.id = e.student_id
WHERE e.id IS NULL;


-- Query 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = (SELECT id FROM students WHERE full_name = 'Charlie Brown')
  AND course_id = (SELECT id FROM courses WHERE code = 'CS102');

-- Verification for Query 5 update:
SELECT s.full_name, c.course_name, e.grade
FROM enrolments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.full_name = 'Charlie Brown';