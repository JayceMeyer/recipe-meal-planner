-- Pantry Enhancement: kits, cuisine mappings, staple fields
-- Supports: starter kits, cuisine-based suggestions, staple tracking

--------------------------------------------------------------------------------
-- 1. New tables
--------------------------------------------------------------------------------

-- Pantry kits: system defaults (household_id IS NULL) + household custom kits
CREATE TABLE IF NOT EXISTS public.pantry_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cuisine text,
  category text,
  is_default boolean NOT NULL DEFAULT false,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pantry_kits_household_id_idx ON public.pantry_kits(household_id);
CREATE INDEX pantry_kits_is_default_idx ON public.pantry_kits(is_default) WHERE is_default = true;

-- Kit items: ingredients that belong to a kit
CREATE TABLE IF NOT EXISTS public.pantry_kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.pantry_kits(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  category text,
  quantity text,
  unit text
);

CREATE INDEX pantry_kit_items_kit_id_idx ON public.pantry_kit_items(kit_id);

-- Cuisine-to-ingredient mappings for preference-based suggestions
CREATE TABLE IF NOT EXISTS public.cuisine_ingredient_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuisine text NOT NULL,
  ingredient_name text NOT NULL,
  category text,
  tier smallint NOT NULL DEFAULT 1,
  CONSTRAINT cuisine_ingredient_tier_check CHECK (tier BETWEEN 1 AND 3)
);

CREATE INDEX cuisine_ingredient_mappings_cuisine_idx ON public.cuisine_ingredient_mappings(cuisine);
CREATE UNIQUE INDEX cuisine_ingredient_mappings_unique_idx ON public.cuisine_ingredient_mappings(cuisine, ingredient_name);

--------------------------------------------------------------------------------
-- 2. Alter pantry_items: add staple fields
--------------------------------------------------------------------------------

ALTER TABLE public.pantry_items
  ADD COLUMN IF NOT EXISTS is_staple boolean NOT NULL DEFAULT false;

ALTER TABLE public.pantry_items
  ADD COLUMN IF NOT EXISTS staple_threshold text;

ALTER TABLE public.pantry_items
  ADD COLUMN IF NOT EXISTS staple_unit text;

CREATE INDEX pantry_items_is_staple_idx ON public.pantry_items(household_id, is_staple)
  WHERE is_staple = true;

--------------------------------------------------------------------------------
-- 3. RLS policies
--------------------------------------------------------------------------------

ALTER TABLE public.pantry_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuisine_ingredient_mappings ENABLE ROW LEVEL SECURITY;

-- pantry_kits: system kits readable by all authenticated, household kits scoped
CREATE POLICY "Anyone can view system kits"
  ON public.pantry_kits FOR SELECT
  USING (household_id IS NULL);

CREATE POLICY "Household members can view their kits"
  ON public.pantry_kits FOR SELECT
  USING (household_id IS NOT NULL AND public.is_household_member(household_id));

CREATE POLICY "Household members can create kits"
  ON public.pantry_kits FOR INSERT
  WITH CHECK (household_id IS NOT NULL AND public.is_household_member(household_id));

CREATE POLICY "Household members can update their kits"
  ON public.pantry_kits FOR UPDATE
  USING (household_id IS NOT NULL AND public.is_household_member(household_id))
  WITH CHECK (household_id IS NOT NULL AND public.is_household_member(household_id));

CREATE POLICY "Household members can delete their kits"
  ON public.pantry_kits FOR DELETE
  USING (household_id IS NOT NULL AND public.is_household_member(household_id));

-- pantry_kit_items: inherit access through kit
CREATE POLICY "Anyone can view system kit items"
  ON public.pantry_kit_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pantry_kits
      WHERE id = kit_id AND household_id IS NULL
    )
  );

CREATE POLICY "Household members can view their kit items"
  ON public.pantry_kit_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pantry_kits
      WHERE id = kit_id AND household_id IS NOT NULL
        AND public.is_household_member(household_id)
    )
  );

CREATE POLICY "Household members can manage their kit items"
  ON public.pantry_kit_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pantry_kits
      WHERE id = kit_id AND household_id IS NOT NULL
        AND public.is_household_member(household_id)
    )
  );

-- cuisine_ingredient_mappings: read-only for all authenticated users
CREATE POLICY "Authenticated users can view cuisine mappings"
  ON public.cuisine_ingredient_mappings FOR SELECT
  TO authenticated
  USING (true);

--------------------------------------------------------------------------------
-- 4. Seed data: default system kits
--------------------------------------------------------------------------------

-- Basic American Kitchen
WITH kit AS (
  INSERT INTO public.pantry_kits (name, description, cuisine, category, is_default)
  VALUES ('Basic American Kitchen', 'Essential staples for everyday American cooking', 'American', 'General', true)
  RETURNING id
)
INSERT INTO public.pantry_kit_items (kit_id, ingredient_name, category, quantity, unit)
SELECT kit.id, v.ingredient_name, v.category, v.quantity, v.unit
FROM kit, (VALUES
  ('Salt', 'Spices & Seasonings', '1', 'container'),
  ('Black Pepper', 'Spices & Seasonings', '1', 'container'),
  ('Garlic Powder', 'Spices & Seasonings', '1', 'container'),
  ('Onion Powder', 'Spices & Seasonings', '1', 'container'),
  ('Paprika', 'Spices & Seasonings', '1', 'container'),
  ('Olive Oil', 'Oils & Vinegars', '1', 'bottle'),
  ('Vegetable Oil', 'Oils & Vinegars', '1', 'bottle'),
  ('Butter', 'Dairy & Eggs', '1', 'lb'),
  ('Eggs', 'Dairy & Eggs', '1', 'dozen'),
  ('Milk', 'Dairy & Eggs', '1', 'gallon'),
  ('All-Purpose Flour', 'Baking', '5', 'lb'),
  ('Sugar', 'Baking', '4', 'lb'),
  ('Brown Sugar', 'Baking', '2', 'lb'),
  ('Baking Powder', 'Baking', '1', 'container'),
  ('Vanilla Extract', 'Baking', '1', 'bottle'),
  ('Rice', 'Grains & Pasta', '2', 'lb'),
  ('Pasta', 'Grains & Pasta', '1', 'lb'),
  ('Bread', 'Grains & Pasta', '1', 'loaf'),
  ('Ketchup', 'Condiments', '1', 'bottle'),
  ('Mustard', 'Condiments', '1', 'bottle'),
  ('Mayonnaise', 'Condiments', '1', 'jar'),
  ('Soy Sauce', 'Condiments', '1', 'bottle'),
  ('Chicken Broth', 'Canned & Dried Goods', '2', 'cans'),
  ('Canned Tomatoes', 'Canned & Dried Goods', '2', 'cans'),
  ('Tomato Paste', 'Canned & Dried Goods', '1', 'can'),
  ('Garlic', 'Produce', '1', 'head'),
  ('Onions', 'Produce', '3', 'pieces'),
  ('Potatoes', 'Produce', '5', 'lb')
) AS v(ingredient_name, category, quantity, unit);

-- Asian Essentials
WITH kit AS (
  INSERT INTO public.pantry_kits (name, description, cuisine, category, is_default)
  VALUES ('Asian Essentials', 'Core ingredients for Chinese, Japanese, Thai, and Korean cooking', 'Asian', 'Regional', true)
  RETURNING id
)
INSERT INTO public.pantry_kit_items (kit_id, ingredient_name, category, quantity, unit)
SELECT kit.id, v.ingredient_name, v.category, v.quantity, v.unit
FROM kit, (VALUES
  ('Soy Sauce', 'Condiments', '1', 'bottle'),
  ('Sesame Oil', 'Oils & Vinegars', '1', 'bottle'),
  ('Rice Vinegar', 'Oils & Vinegars', '1', 'bottle'),
  ('Fish Sauce', 'Condiments', '1', 'bottle'),
  ('Oyster Sauce', 'Condiments', '1', 'bottle'),
  ('Hoisin Sauce', 'Condiments', '1', 'bottle'),
  ('Sriracha', 'Condiments', '1', 'bottle'),
  ('Mirin', 'Condiments', '1', 'bottle'),
  ('Coconut Milk', 'Canned & Dried Goods', '2', 'cans'),
  ('Jasmine Rice', 'Grains & Pasta', '5', 'lb'),
  ('Rice Noodles', 'Grains & Pasta', '1', 'package'),
  ('Ginger', 'Produce', '1', 'piece'),
  ('Garlic', 'Produce', '1', 'head'),
  ('Green Onions', 'Produce', '1', 'bunch'),
  ('Limes', 'Produce', '3', 'pieces'),
  ('Tofu', 'Proteins', '1', 'block'),
  ('Cornstarch', 'Baking', '1', 'container'),
  ('Sesame Seeds', 'Nuts & Seeds', '1', 'bag'),
  ('Red Pepper Flakes', 'Spices & Seasonings', '1', 'container'),
  ('Five Spice Powder', 'Spices & Seasonings', '1', 'container'),
  ('White Pepper', 'Spices & Seasonings', '1', 'container'),
  ('Star Anise', 'Spices & Seasonings', '1', 'package'),
  ('Dried Shiitake Mushrooms', 'Canned & Dried Goods', '1', 'package'),
  ('Bamboo Shoots', 'Canned & Dried Goods', '1', 'can')
) AS v(ingredient_name, category, quantity, unit);

-- Baker's Pantry
WITH kit AS (
  INSERT INTO public.pantry_kits (name, description, cuisine, category, is_default)
  VALUES ('Baker''s Pantry', 'Everything you need for baking bread, cakes, and pastries', NULL, 'Specialty', true)
  RETURNING id
)
INSERT INTO public.pantry_kit_items (kit_id, ingredient_name, category, quantity, unit)
SELECT kit.id, v.ingredient_name, v.category, v.quantity, v.unit
FROM kit, (VALUES
  ('All-Purpose Flour', 'Baking', '5', 'lb'),
  ('Bread Flour', 'Baking', '5', 'lb'),
  ('Cake Flour', 'Baking', '2', 'lb'),
  ('Whole Wheat Flour', 'Baking', '2', 'lb'),
  ('Sugar', 'Baking', '4', 'lb'),
  ('Brown Sugar', 'Baking', '2', 'lb'),
  ('Powdered Sugar', 'Baking', '1', 'lb'),
  ('Baking Powder', 'Baking', '1', 'container'),
  ('Baking Soda', 'Baking', '1', 'box'),
  ('Active Dry Yeast', 'Baking', '3', 'packets'),
  ('Vanilla Extract', 'Baking', '1', 'bottle'),
  ('Almond Extract', 'Baking', '1', 'bottle'),
  ('Cocoa Powder', 'Baking', '1', 'container'),
  ('Chocolate Chips', 'Baking', '1', 'bag'),
  ('Butter', 'Dairy & Eggs', '2', 'lb'),
  ('Eggs', 'Dairy & Eggs', '1', 'dozen'),
  ('Heavy Cream', 'Dairy & Eggs', '1', 'pint'),
  ('Cream Cheese', 'Dairy & Eggs', '1', 'block'),
  ('Honey', 'Baking', '1', 'bottle'),
  ('Cornstarch', 'Baking', '1', 'container'),
  ('Salt', 'Spices & Seasonings', '1', 'container'),
  ('Cinnamon', 'Spices & Seasonings', '1', 'container'),
  ('Nutmeg', 'Spices & Seasonings', '1', 'container'),
  ('Walnuts', 'Nuts & Seeds', '1', 'bag'),
  ('Pecans', 'Nuts & Seeds', '1', 'bag')
) AS v(ingredient_name, category, quantity, unit);

-- Mediterranean Staples
WITH kit AS (
  INSERT INTO public.pantry_kits (name, description, cuisine, category, is_default)
  VALUES ('Mediterranean Staples', 'Essential ingredients for Greek, Italian, and Middle Eastern dishes', 'Mediterranean', 'Regional', true)
  RETURNING id
)
INSERT INTO public.pantry_kit_items (kit_id, ingredient_name, category, quantity, unit)
SELECT kit.id, v.ingredient_name, v.category, v.quantity, v.unit
FROM kit, (VALUES
  ('Extra Virgin Olive Oil', 'Oils & Vinegars', '1', 'bottle'),
  ('Red Wine Vinegar', 'Oils & Vinegars', '1', 'bottle'),
  ('Balsamic Vinegar', 'Oils & Vinegars', '1', 'bottle'),
  ('Lemons', 'Produce', '4', 'pieces'),
  ('Garlic', 'Produce', '2', 'heads'),
  ('Onions', 'Produce', '3', 'pieces'),
  ('Tomatoes', 'Produce', '4', 'pieces'),
  ('Feta Cheese', 'Dairy & Eggs', '1', 'block'),
  ('Parmesan Cheese', 'Dairy & Eggs', '1', 'wedge'),
  ('Dried Oregano', 'Spices & Seasonings', '1', 'container'),
  ('Dried Basil', 'Spices & Seasonings', '1', 'container'),
  ('Dried Thyme', 'Spices & Seasonings', '1', 'container'),
  ('Cumin', 'Spices & Seasonings', '1', 'container'),
  ('Smoked Paprika', 'Spices & Seasonings', '1', 'container'),
  ('Canned Chickpeas', 'Canned & Dried Goods', '2', 'cans'),
  ('Canned Tomatoes', 'Canned & Dried Goods', '2', 'cans'),
  ('Dried Lentils', 'Canned & Dried Goods', '1', 'bag'),
  ('Tahini', 'Condiments', '1', 'jar'),
  ('Hummus', 'Condiments', '1', 'container'),
  ('Kalamata Olives', 'Canned & Dried Goods', '1', 'jar'),
  ('Capers', 'Condiments', '1', 'jar'),
  ('Pine Nuts', 'Nuts & Seeds', '1', 'bag'),
  ('Couscous', 'Grains & Pasta', '1', 'box'),
  ('Orzo', 'Grains & Pasta', '1', 'box'),
  ('Pita Bread', 'Grains & Pasta', '1', 'package')
) AS v(ingredient_name, category, quantity, unit);

-- Mexican Kitchen
WITH kit AS (
  INSERT INTO public.pantry_kits (name, description, cuisine, category, is_default)
  VALUES ('Mexican Kitchen', 'Staples for authentic Mexican and Tex-Mex cooking', 'Mexican', 'Regional', true)
  RETURNING id
)
INSERT INTO public.pantry_kit_items (kit_id, ingredient_name, category, quantity, unit)
SELECT kit.id, v.ingredient_name, v.category, v.quantity, v.unit
FROM kit, (VALUES
  ('Cumin', 'Spices & Seasonings', '1', 'container'),
  ('Chili Powder', 'Spices & Seasonings', '1', 'container'),
  ('Smoked Paprika', 'Spices & Seasonings', '1', 'container'),
  ('Dried Oregano', 'Spices & Seasonings', '1', 'container'),
  ('Cayenne Pepper', 'Spices & Seasonings', '1', 'container'),
  ('Coriander', 'Spices & Seasonings', '1', 'container'),
  ('Corn Tortillas', 'Grains & Pasta', '1', 'package'),
  ('Flour Tortillas', 'Grains & Pasta', '1', 'package'),
  ('Rice', 'Grains & Pasta', '2', 'lb'),
  ('Canned Black Beans', 'Canned & Dried Goods', '2', 'cans'),
  ('Canned Pinto Beans', 'Canned & Dried Goods', '2', 'cans'),
  ('Canned Tomatoes', 'Canned & Dried Goods', '2', 'cans'),
  ('Chipotle in Adobo', 'Canned & Dried Goods', '1', 'can'),
  ('Salsa', 'Condiments', '1', 'jar'),
  ('Hot Sauce', 'Condiments', '1', 'bottle'),
  ('Limes', 'Produce', '6', 'pieces'),
  ('Jalapenos', 'Produce', '4', 'pieces'),
  ('Cilantro', 'Produce', '1', 'bunch'),
  ('Onions', 'Produce', '3', 'pieces'),
  ('Garlic', 'Produce', '1', 'head'),
  ('Avocados', 'Produce', '3', 'pieces'),
  ('Sour Cream', 'Dairy & Eggs', '1', 'container'),
  ('Mexican Cheese Blend', 'Dairy & Eggs', '1', 'bag'),
  ('Vegetable Oil', 'Oils & Vinegars', '1', 'bottle')
) AS v(ingredient_name, category, quantity, unit);

-- Indian Cooking
WITH kit AS (
  INSERT INTO public.pantry_kits (name, description, cuisine, category, is_default)
  VALUES ('Indian Cooking', 'Spices and staples for Indian curries, dals, and rice dishes', 'Indian', 'Regional', true)
  RETURNING id
)
INSERT INTO public.pantry_kit_items (kit_id, ingredient_name, category, quantity, unit)
SELECT kit.id, v.ingredient_name, v.category, v.quantity, v.unit
FROM kit, (VALUES
  ('Turmeric', 'Spices & Seasonings', '1', 'container'),
  ('Cumin', 'Spices & Seasonings', '1', 'container'),
  ('Coriander', 'Spices & Seasonings', '1', 'container'),
  ('Garam Masala', 'Spices & Seasonings', '1', 'container'),
  ('Chili Powder', 'Spices & Seasonings', '1', 'container'),
  ('Cardamom', 'Spices & Seasonings', '1', 'container'),
  ('Cinnamon Sticks', 'Spices & Seasonings', '1', 'container'),
  ('Mustard Seeds', 'Spices & Seasonings', '1', 'container'),
  ('Fenugreek', 'Spices & Seasonings', '1', 'container'),
  ('Curry Leaves', 'Spices & Seasonings', '1', 'package'),
  ('Basmati Rice', 'Grains & Pasta', '5', 'lb'),
  ('Red Lentils', 'Canned & Dried Goods', '1', 'bag'),
  ('Yellow Lentils', 'Canned & Dried Goods', '1', 'bag'),
  ('Chickpeas', 'Canned & Dried Goods', '2', 'cans'),
  ('Coconut Milk', 'Canned & Dried Goods', '2', 'cans'),
  ('Canned Tomatoes', 'Canned & Dried Goods', '2', 'cans'),
  ('Tomato Paste', 'Canned & Dried Goods', '1', 'can'),
  ('Ghee', 'Oils & Vinegars', '1', 'jar'),
  ('Vegetable Oil', 'Oils & Vinegars', '1', 'bottle'),
  ('Ginger', 'Produce', '1', 'piece'),
  ('Garlic', 'Produce', '1', 'head'),
  ('Onions', 'Produce', '3', 'pieces'),
  ('Cilantro', 'Produce', '1', 'bunch'),
  ('Yogurt', 'Dairy & Eggs', '1', 'container'),
  ('Naan Bread', 'Grains & Pasta', '1', 'package')
) AS v(ingredient_name, category, quantity, unit);

--------------------------------------------------------------------------------
-- 5. Seed data: cuisine-ingredient mappings
-- Tier 1 = essential (must-have), Tier 2 = common, Tier 3 = nice-to-have
--------------------------------------------------------------------------------

INSERT INTO public.cuisine_ingredient_mappings (cuisine, ingredient_name, category, tier) VALUES
-- Italian
('Italian', 'Extra Virgin Olive Oil', 'Oils & Vinegars', 1),
('Italian', 'Garlic', 'Produce', 1),
('Italian', 'Canned Tomatoes', 'Canned & Dried Goods', 1),
('Italian', 'Parmesan Cheese', 'Dairy & Eggs', 1),
('Italian', 'Dried Basil', 'Spices & Seasonings', 1),
('Italian', 'Dried Oregano', 'Spices & Seasonings', 1),
('Italian', 'Pasta', 'Grains & Pasta', 1),
('Italian', 'Tomato Paste', 'Canned & Dried Goods', 2),
('Italian', 'Balsamic Vinegar', 'Oils & Vinegars', 2),
('Italian', 'Red Wine Vinegar', 'Oils & Vinegars', 2),
('Italian', 'Red Pepper Flakes', 'Spices & Seasonings', 2),
('Italian', 'Pine Nuts', 'Nuts & Seeds', 3),
('Italian', 'Capers', 'Condiments', 3),
('Italian', 'Anchovies', 'Canned & Dried Goods', 3),

-- Mexican
('Mexican', 'Cumin', 'Spices & Seasonings', 1),
('Mexican', 'Chili Powder', 'Spices & Seasonings', 1),
('Mexican', 'Limes', 'Produce', 1),
('Mexican', 'Cilantro', 'Produce', 1),
('Mexican', 'Garlic', 'Produce', 1),
('Mexican', 'Onions', 'Produce', 1),
('Mexican', 'Corn Tortillas', 'Grains & Pasta', 1),
('Mexican', 'Canned Black Beans', 'Canned & Dried Goods', 2),
('Mexican', 'Jalapenos', 'Produce', 2),
('Mexican', 'Salsa', 'Condiments', 2),
('Mexican', 'Sour Cream', 'Dairy & Eggs', 2),
('Mexican', 'Avocados', 'Produce', 2),
('Mexican', 'Chipotle in Adobo', 'Canned & Dried Goods', 3),
('Mexican', 'Cotija Cheese', 'Dairy & Eggs', 3),

-- Asian (general)
('Asian', 'Soy Sauce', 'Condiments', 1),
('Asian', 'Sesame Oil', 'Oils & Vinegars', 1),
('Asian', 'Rice', 'Grains & Pasta', 1),
('Asian', 'Garlic', 'Produce', 1),
('Asian', 'Ginger', 'Produce', 1),
('Asian', 'Green Onions', 'Produce', 1),
('Asian', 'Rice Vinegar', 'Oils & Vinegars', 2),
('Asian', 'Cornstarch', 'Baking', 2),
('Asian', 'Sriracha', 'Condiments', 2),
('Asian', 'Sesame Seeds', 'Nuts & Seeds', 2),
('Asian', 'Tofu', 'Proteins', 3),
('Asian', 'Hoisin Sauce', 'Condiments', 3),

-- Indian
('Indian', 'Turmeric', 'Spices & Seasonings', 1),
('Indian', 'Cumin', 'Spices & Seasonings', 1),
('Indian', 'Coriander', 'Spices & Seasonings', 1),
('Indian', 'Garam Masala', 'Spices & Seasonings', 1),
('Indian', 'Garlic', 'Produce', 1),
('Indian', 'Ginger', 'Produce', 1),
('Indian', 'Onions', 'Produce', 1),
('Indian', 'Basmati Rice', 'Grains & Pasta', 1),
('Indian', 'Ghee', 'Oils & Vinegars', 2),
('Indian', 'Red Lentils', 'Canned & Dried Goods', 2),
('Indian', 'Coconut Milk', 'Canned & Dried Goods', 2),
('Indian', 'Cardamom', 'Spices & Seasonings', 2),
('Indian', 'Mustard Seeds', 'Spices & Seasonings', 3),
('Indian', 'Fenugreek', 'Spices & Seasonings', 3),
('Indian', 'Curry Leaves', 'Spices & Seasonings', 3),

-- Mediterranean
('Mediterranean', 'Extra Virgin Olive Oil', 'Oils & Vinegars', 1),
('Mediterranean', 'Lemons', 'Produce', 1),
('Mediterranean', 'Garlic', 'Produce', 1),
('Mediterranean', 'Dried Oregano', 'Spices & Seasonings', 1),
('Mediterranean', 'Canned Chickpeas', 'Canned & Dried Goods', 1),
('Mediterranean', 'Feta Cheese', 'Dairy & Eggs', 1),
('Mediterranean', 'Tahini', 'Condiments', 2),
('Mediterranean', 'Cumin', 'Spices & Seasonings', 2),
('Mediterranean', 'Kalamata Olives', 'Canned & Dried Goods', 2),
('Mediterranean', 'Pine Nuts', 'Nuts & Seeds', 3),
('Mediterranean', 'Sumac', 'Spices & Seasonings', 3),
('Mediterranean', 'Za''atar', 'Spices & Seasonings', 3),

-- American
('American', 'Salt', 'Spices & Seasonings', 1),
('American', 'Black Pepper', 'Spices & Seasonings', 1),
('American', 'Butter', 'Dairy & Eggs', 1),
('American', 'Eggs', 'Dairy & Eggs', 1),
('American', 'All-Purpose Flour', 'Baking', 1),
('American', 'Sugar', 'Baking', 1),
('American', 'Ketchup', 'Condiments', 2),
('American', 'Mustard', 'Condiments', 2),
('American', 'Mayonnaise', 'Condiments', 2),
('American', 'Worcestershire Sauce', 'Condiments', 3),
('American', 'BBQ Sauce', 'Condiments', 3),

-- Thai
('Thai', 'Fish Sauce', 'Condiments', 1),
('Thai', 'Coconut Milk', 'Canned & Dried Goods', 1),
('Thai', 'Limes', 'Produce', 1),
('Thai', 'Garlic', 'Produce', 1),
('Thai', 'Lemongrass', 'Produce', 1),
('Thai', 'Thai Basil', 'Produce', 1),
('Thai', 'Thai Chili Peppers', 'Produce', 2),
('Thai', 'Jasmine Rice', 'Grains & Pasta', 1),
('Thai', 'Rice Noodles', 'Grains & Pasta', 2),
('Thai', 'Soy Sauce', 'Condiments', 2),
('Thai', 'Palm Sugar', 'Baking', 2),
('Thai', 'Galangal', 'Produce', 3),
('Thai', 'Kaffir Lime Leaves', 'Produce', 3),
('Thai', 'Tamarind Paste', 'Condiments', 3),

-- Japanese
('Japanese', 'Soy Sauce', 'Condiments', 1),
('Japanese', 'Mirin', 'Condiments', 1),
('Japanese', 'Rice Vinegar', 'Oils & Vinegars', 1),
('Japanese', 'Dashi', 'Canned & Dried Goods', 1),
('Japanese', 'Short Grain Rice', 'Grains & Pasta', 1),
('Japanese', 'Sesame Oil', 'Oils & Vinegars', 2),
('Japanese', 'Miso Paste', 'Condiments', 2),
('Japanese', 'Sake', 'Condiments', 2),
('Japanese', 'Nori', 'Canned & Dried Goods', 2),
('Japanese', 'Panko Breadcrumbs', 'Baking', 2),
('Japanese', 'Wasabi', 'Condiments', 3),
('Japanese', 'Pickled Ginger', 'Condiments', 3),

-- French
('French', 'Butter', 'Dairy & Eggs', 1),
('French', 'Heavy Cream', 'Dairy & Eggs', 1),
('French', 'Shallots', 'Produce', 1),
('French', 'Garlic', 'Produce', 1),
('French', 'Dijon Mustard', 'Condiments', 1),
('French', 'Dried Thyme', 'Spices & Seasonings', 1),
('French', 'Bay Leaves', 'Spices & Seasonings', 2),
('French', 'Dried Tarragon', 'Spices & Seasonings', 2),
('French', 'White Wine Vinegar', 'Oils & Vinegars', 2),
('French', 'Herbes de Provence', 'Spices & Seasonings', 2),
('French', 'Cornichons', 'Condiments', 3),
('French', 'Gruyere Cheese', 'Dairy & Eggs', 3),

-- Greek
('Greek', 'Extra Virgin Olive Oil', 'Oils & Vinegars', 1),
('Greek', 'Lemons', 'Produce', 1),
('Greek', 'Feta Cheese', 'Dairy & Eggs', 1),
('Greek', 'Dried Oregano', 'Spices & Seasonings', 1),
('Greek', 'Garlic', 'Produce', 1),
('Greek', 'Kalamata Olives', 'Canned & Dried Goods', 2),
('Greek', 'Red Wine Vinegar', 'Oils & Vinegars', 2),
('Greek', 'Dried Dill', 'Spices & Seasonings', 2),
('Greek', 'Honey', 'Baking', 2),
('Greek', 'Pita Bread', 'Grains & Pasta', 2),
('Greek', 'Phyllo Dough', 'Baking', 3),

-- Chinese
('Chinese', 'Soy Sauce', 'Condiments', 1),
('Chinese', 'Sesame Oil', 'Oils & Vinegars', 1),
('Chinese', 'Garlic', 'Produce', 1),
('Chinese', 'Ginger', 'Produce', 1),
('Chinese', 'Green Onions', 'Produce', 1),
('Chinese', 'Rice', 'Grains & Pasta', 1),
('Chinese', 'Oyster Sauce', 'Condiments', 2),
('Chinese', 'Hoisin Sauce', 'Condiments', 2),
('Chinese', 'Rice Vinegar', 'Oils & Vinegars', 2),
('Chinese', 'Cornstarch', 'Baking', 2),
('Chinese', 'Five Spice Powder', 'Spices & Seasonings', 2),
('Chinese', 'Shaoxing Wine', 'Condiments', 3),
('Chinese', 'White Pepper', 'Spices & Seasonings', 3),
('Chinese', 'Star Anise', 'Spices & Seasonings', 3),

-- Korean
('Korean', 'Gochujang', 'Condiments', 1),
('Korean', 'Soy Sauce', 'Condiments', 1),
('Korean', 'Sesame Oil', 'Oils & Vinegars', 1),
('Korean', 'Garlic', 'Produce', 1),
('Korean', 'Ginger', 'Produce', 1),
('Korean', 'Green Onions', 'Produce', 1),
('Korean', 'Short Grain Rice', 'Grains & Pasta', 1),
('Korean', 'Gochugaru', 'Spices & Seasonings', 2),
('Korean', 'Sesame Seeds', 'Nuts & Seeds', 2),
('Korean', 'Rice Vinegar', 'Oils & Vinegars', 2),
('Korean', 'Doenjang', 'Condiments', 3),
('Korean', 'Korean Radish', 'Produce', 3),

-- Vietnamese
('Vietnamese', 'Fish Sauce', 'Condiments', 1),
('Vietnamese', 'Limes', 'Produce', 1),
('Vietnamese', 'Garlic', 'Produce', 1),
('Vietnamese', 'Rice Noodles', 'Grains & Pasta', 1),
('Vietnamese', 'Fresh Herbs', 'Produce', 1),
('Vietnamese', 'Hoisin Sauce', 'Condiments', 2),
('Vietnamese', 'Sriracha', 'Condiments', 2),
('Vietnamese', 'Lemongrass', 'Produce', 2),
('Vietnamese', 'Rice Paper', 'Grains & Pasta', 2),
('Vietnamese', 'Jasmine Rice', 'Grains & Pasta', 2),
('Vietnamese', 'Star Anise', 'Spices & Seasonings', 3),
('Vietnamese', 'Tamarind Paste', 'Condiments', 3),

-- Spanish
('Spanish', 'Extra Virgin Olive Oil', 'Oils & Vinegars', 1),
('Spanish', 'Garlic', 'Produce', 1),
('Spanish', 'Smoked Paprika', 'Spices & Seasonings', 1),
('Spanish', 'Saffron', 'Spices & Seasonings', 1),
('Spanish', 'Onions', 'Produce', 1),
('Spanish', 'Canned Tomatoes', 'Canned & Dried Goods', 2),
('Spanish', 'Sherry Vinegar', 'Oils & Vinegars', 2),
('Spanish', 'Bay Leaves', 'Spices & Seasonings', 2),
('Spanish', 'Chorizo', 'Proteins', 2),
('Spanish', 'Manchego Cheese', 'Dairy & Eggs', 3),
('Spanish', 'Piquillo Peppers', 'Canned & Dried Goods', 3),

-- Middle Eastern
('Middle Eastern', 'Extra Virgin Olive Oil', 'Oils & Vinegars', 1),
('Middle Eastern', 'Lemons', 'Produce', 1),
('Middle Eastern', 'Garlic', 'Produce', 1),
('Middle Eastern', 'Cumin', 'Spices & Seasonings', 1),
('Middle Eastern', 'Tahini', 'Condiments', 1),
('Middle Eastern', 'Canned Chickpeas', 'Canned & Dried Goods', 1),
('Middle Eastern', 'Za''atar', 'Spices & Seasonings', 2),
('Middle Eastern', 'Sumac', 'Spices & Seasonings', 2),
('Middle Eastern', 'Pomegranate Molasses', 'Condiments', 2),
('Middle Eastern', 'Dried Mint', 'Spices & Seasonings', 2),
('Middle Eastern', 'Rose Water', 'Baking', 3),
('Middle Eastern', 'Harissa', 'Condiments', 3),

-- Caribbean
('Caribbean', 'Allspice', 'Spices & Seasonings', 1),
('Caribbean', 'Scotch Bonnet Peppers', 'Produce', 1),
('Caribbean', 'Thyme', 'Spices & Seasonings', 1),
('Caribbean', 'Limes', 'Produce', 1),
('Caribbean', 'Garlic', 'Produce', 1),
('Caribbean', 'Coconut Milk', 'Canned & Dried Goods', 1),
('Caribbean', 'Rice', 'Grains & Pasta', 1),
('Caribbean', 'Kidney Beans', 'Canned & Dried Goods', 2),
('Caribbean', 'Soy Sauce', 'Condiments', 2),
('Caribbean', 'Brown Sugar', 'Baking', 2),
('Caribbean', 'Nutmeg', 'Spices & Seasonings', 2),
('Caribbean', 'Plantains', 'Produce', 3),

-- African
('African', 'Peanut Butter', 'Condiments', 1),
('African', 'Canned Tomatoes', 'Canned & Dried Goods', 1),
('African', 'Onions', 'Produce', 1),
('African', 'Garlic', 'Produce', 1),
('African', 'Ginger', 'Produce', 1),
('African', 'Cumin', 'Spices & Seasonings', 1),
('African', 'Cayenne Pepper', 'Spices & Seasonings', 2),
('African', 'Coriander', 'Spices & Seasonings', 2),
('African', 'Coconut Milk', 'Canned & Dried Goods', 2),
('African', 'Rice', 'Grains & Pasta', 2),
('African', 'Berbere Spice', 'Spices & Seasonings', 3),
('African', 'Injera', 'Grains & Pasta', 3),

-- Brazilian
('Brazilian', 'Garlic', 'Produce', 1),
('Brazilian', 'Onions', 'Produce', 1),
('Brazilian', 'Limes', 'Produce', 1),
('Brazilian', 'Black Beans', 'Canned & Dried Goods', 1),
('Brazilian', 'Rice', 'Grains & Pasta', 1),
('Brazilian', 'Bay Leaves', 'Spices & Seasonings', 2),
('Brazilian', 'Cumin', 'Spices & Seasonings', 2),
('Brazilian', 'Coconut Milk', 'Canned & Dried Goods', 2),
('Brazilian', 'Palm Oil', 'Oils & Vinegars', 2),
('Brazilian', 'Cilantro', 'Produce', 2),
('Brazilian', 'Cassava Flour', 'Baking', 3),
('Brazilian', 'Malagueta Peppers', 'Produce', 3),

-- British
('British', 'Butter', 'Dairy & Eggs', 1),
('British', 'All-Purpose Flour', 'Baking', 1),
('British', 'Eggs', 'Dairy & Eggs', 1),
('British', 'Milk', 'Dairy & Eggs', 1),
('British', 'Worcestershire Sauce', 'Condiments', 1),
('British', 'English Mustard', 'Condiments', 2),
('British', 'HP Sauce', 'Condiments', 2),
('British', 'Dried Thyme', 'Spices & Seasonings', 2),
('British', 'Bay Leaves', 'Spices & Seasonings', 2),
('British', 'Malt Vinegar', 'Oils & Vinegars', 2),
('British', 'Stilton Cheese', 'Dairy & Eggs', 3),
('British', 'Clotted Cream', 'Dairy & Eggs', 3),

-- German
('German', 'Butter', 'Dairy & Eggs', 1),
('German', 'Onions', 'Produce', 1),
('German', 'Potatoes', 'Produce', 1),
('German', 'Mustard', 'Condiments', 1),
('German', 'Caraway Seeds', 'Spices & Seasonings', 1),
('German', 'Vinegar', 'Oils & Vinegars', 2),
('German', 'Sauerkraut', 'Canned & Dried Goods', 2),
('German', 'Juniper Berries', 'Spices & Seasonings', 2),
('German', 'Paprika', 'Spices & Seasonings', 2),
('German', 'Horseradish', 'Condiments', 3),
('German', 'Pumpernickel Bread', 'Grains & Pasta', 3)

ON CONFLICT (cuisine, ingredient_name) DO NOTHING;
