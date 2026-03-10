-- Cookbook Digitization: cookbooks table + cookbook_id on recipes
-- Supports: adding physical cookbooks (ISBN/barcode) and linking recipes to them

--------------------------------------------------------------------------------
-- 1. Create cookbooks table
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cookbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text,
  isbn text,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cookbooks_household_id_idx ON public.cookbooks(household_id);
CREATE INDEX cookbooks_isbn_idx ON public.cookbooks(isbn) WHERE isbn IS NOT NULL;

CREATE TRIGGER cookbooks_updated_at
  BEFORE UPDATE ON public.cookbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

--------------------------------------------------------------------------------
-- 2. Add cookbook columns to recipes
--------------------------------------------------------------------------------

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS cookbook_id uuid REFERENCES public.cookbooks(id) ON DELETE SET NULL;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS cookbook_page_number integer;

CREATE INDEX recipes_cookbook_id_idx ON public.recipes(cookbook_id) WHERE cookbook_id IS NOT NULL;

--------------------------------------------------------------------------------
-- 3. RLS policies for cookbooks
--------------------------------------------------------------------------------

ALTER TABLE public.cookbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view their cookbooks"
  ON public.cookbooks FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Household members can create cookbooks"
  ON public.cookbooks FOR INSERT
  WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "Household members can update their cookbooks"
  ON public.cookbooks FOR UPDATE
  USING (public.is_household_member(household_id))
  WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "Household members can delete their cookbooks"
  ON public.cookbooks FOR DELETE
  USING (public.is_household_member(household_id));
