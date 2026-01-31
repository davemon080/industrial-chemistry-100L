
# ICH Student Hub - Database Schema

To set up the database for this application on Neon (PostgreSQL), execute the following SQL commands:

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    matric_number VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_course_rep BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materials Table
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    pdf_url TEXT NOT NULL,
    uploaded_by VARCHAR(255) REFERENCES users(matric_number),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Schedules Table
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_code VARCHAR(10) NOT NULL,
    venue VARCHAR(100),
    is_online BOOLEAN DEFAULT FALSE,
    link TEXT,
    attachment_url TEXT,
    event_date DATE
);

-- Insert Default Course Rep
INSERT INTO users (matric_number, password, is_course_rep) 
VALUES ('2025/PS/ICH/0034', '2025/PS/ICH/0034', TRUE)
ON CONFLICT (matric_number) DO NOTHING;
```

## Connection Configuration
The application is pre-configured to use the provided Neon credentials. For a production deployment, ensure these are handled securely in a backend environment (Node.js/Next.js).
