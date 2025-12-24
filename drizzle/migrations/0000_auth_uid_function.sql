-- ========================================
-- APP.CURRENT_USER_ID() FUNCTION FOR BETTER AUTH COMPATIBILITY
-- ========================================
-- This creates a function that works with Better Auth 
-- by reading from a PostgreSQL session variable

-- Create app schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS app;

-- Create the app.current_user_id() function
-- This function reads the user_id from a session variable set by the application
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::TEXT
$$;

-- Grant execute permission to public
GRANT USAGE ON SCHEMA app TO PUBLIC;
GRANT EXECUTE ON FUNCTION app.current_user_id() TO PUBLIC;

-- ========================================
-- COMMENTS
-- ========================================
COMMENT ON FUNCTION app.current_user_id() IS 'Returns the current user ID from the session variable app.current_user_id. Compatible with Better Auth.';
