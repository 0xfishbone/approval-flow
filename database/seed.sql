-- Seed Data for ApprovalFlow Development
-- This creates a sample company, departments, and users for testing

-- Create sample company
INSERT INTO companies (id, name, logo) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Dakar Hotel Group', null);

-- Create sample departments
INSERT INTO departments (id, name, company_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Kitchen', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Housekeeping', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Maintenance', '550e8400-e29b-41d4-a716-446655440000');

-- Create sample users (password for all: "password123")
-- Password hash generated with bcrypt, rounds=12
INSERT INTO users (id, email, password_hash, first_name, last_name, role, department_id, company_id) VALUES
  -- Kitchen Staff
  ('770e8400-e29b-41d4-a716-446655440001',
   'chef@example.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWHGfK3WJu',
   'Amadou', 'Diop', 'STAFF',
   '660e8400-e29b-41d4-a716-446655440001',
   '550e8400-e29b-41d4-a716-446655440000'),

  -- Kitchen Manager
  ('770e8400-e29b-41d4-a716-446655440002',
   'kitchen.manager@example.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWHGfK3WJu',
   'Fatou', 'Sall', 'MANAGER',
   '660e8400-e29b-41d4-a716-446655440001',
   '550e8400-e29b-41d4-a716-446655440000'),

  -- Housekeeping Staff
  ('770e8400-e29b-41d4-a716-446655440003',
   'housekeeper@example.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWHGfK3WJu',
   'Awa', 'Ndiaye', 'STAFF',
   '660e8400-e29b-41d4-a716-446655440002',
   '550e8400-e29b-41d4-a716-446655440000'),

  -- Housekeeping Manager
  ('770e8400-e29b-41d4-a716-446655440004',
   'housekeeping.manager@example.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWHGfK3WJu',
   'Moussa', 'Ba', 'MANAGER',
   '660e8400-e29b-41d4-a716-446655440002',
   '550e8400-e29b-41d4-a716-446655440000'),

  -- Company-level Approvers (no department)
  ('770e8400-e29b-41d4-a716-446655440005',
   'controleur@example.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWHGfK3WJu',
   'Ousmane', 'Gueye', 'CONTROLEUR',
   null,
   '550e8400-e29b-41d4-a716-446655440000'),

  ('770e8400-e29b-41d4-a716-446655440006',
   'direction@example.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWHGfK3WJu',
   'Mariama', 'Diallo', 'DIRECTION',
   null,
   '550e8400-e29b-41d4-a716-446655440000'),

  ('770e8400-e29b-41d4-a716-446655440007',
   'econome@example.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWHGfK3WJu',
   'Ibrahima', 'Sy', 'ECONOME',
   null,
   '550e8400-e29b-41d4-a716-446655440000');

-- Output credentials for testing
-- All passwords are: password123
SELECT
  email as "Email",
  role as "Role",
  COALESCE(d.name, 'Company-wide') as "Department"
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.company_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY
  CASE role
    WHEN 'STAFF' THEN 1
    WHEN 'MANAGER' THEN 2
    WHEN 'CONTROLEUR' THEN 3
    WHEN 'DIRECTION' THEN 4
    WHEN 'ECONOME' THEN 5
  END;
