-- Clear all mock/seed data from the database
-- This keeps the schema but removes all test data

-- Delete in correct order to respect foreign keys
DELETE FROM ride_members;
DELETE FROM rides;
DELETE FROM otp_logs;
DELETE FROM drivers;
DELETE FROM users;

-- Optionally, reset sequences if needed
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;

SELECT 'Database cleared - all mock data removed' as status;
