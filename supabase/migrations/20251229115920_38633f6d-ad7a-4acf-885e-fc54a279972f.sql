-- 1. Add DELETE policy for services table
CREATE POLICY "Authenticated users can delete services"
ON public.services
FOR DELETE
TO authenticated
USING (true);

-- 2. Add UPDATE and DELETE policies for metrics table
CREATE POLICY "Authenticated users can update metrics"
ON public.metrics
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete metrics"
ON public.metrics
FOR DELETE
TO authenticated
USING (true);

-- 3. Add UPDATE and DELETE policies for logs table
CREATE POLICY "Authenticated users can update logs"
ON public.logs
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete logs"
ON public.logs
FOR DELETE
TO authenticated
USING (true);

-- 4. Create trigger to auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();