-- Recategorize items that had the old catch-all "Pantry" category
-- into more specific categories: Spices & Seasonings, Oils & Vinegars,
-- Condiments, Grains & Pasta, Baking, Nuts & Seeds, Canned & Dried Goods

-- Spices & Seasonings
update public.pantry_items set category = 'Spices & Seasonings'
where category = 'Pantry' and (
  lower(ingredient_name) like '%salt%' or lower(ingredient_name) like '%pepper%'
  or lower(ingredient_name) like '%spice%' or lower(ingredient_name) like '%cumin%'
  or lower(ingredient_name) like '%paprika%' or lower(ingredient_name) like '%cinnamon%'
  or lower(ingredient_name) like '%nutmeg%' or lower(ingredient_name) like '%clove%'
  or lower(ingredient_name) like '%turmeric%' or lower(ingredient_name) like '%curry%'
  or lower(ingredient_name) like '%chili powder%' or lower(ingredient_name) like '%cayenne%'
  or lower(ingredient_name) like '%garlic powder%' or lower(ingredient_name) like '%onion powder%'
  or lower(ingredient_name) like '%italian seasoning%' or lower(ingredient_name) like '%bay leaf%'
  or lower(ingredient_name) like '%seasoning%'
);

-- Oils & Vinegars
update public.pantry_items set category = 'Oils & Vinegars'
where category = 'Pantry' and (
  lower(ingredient_name) like '%oil%' or lower(ingredient_name) like '%vinegar%'
  or lower(ingredient_name) like '%balsamic%'
);

-- Condiments
update public.pantry_items set category = 'Condiments'
where category = 'Pantry' and (
  lower(ingredient_name) like '%soy sauce%' or lower(ingredient_name) like '%hot sauce%'
  or lower(ingredient_name) like '%ketchup%' or lower(ingredient_name) like '%mustard%'
  or lower(ingredient_name) like '%mayonnaise%' or lower(ingredient_name) like '%honey%'
  or lower(ingredient_name) like '%maple syrup%' or lower(ingredient_name) like '%molasses%'
  or lower(ingredient_name) like '%salsa%' or lower(ingredient_name) like '%sauce%'
  or lower(ingredient_name) like '%marinade%' or lower(ingredient_name) like '%dressing%'
  or lower(ingredient_name) like '%worcestershire%' or lower(ingredient_name) like '%sriracha%'
  or lower(ingredient_name) like '%bbq sauce%'
);

-- Grains & Pasta
update public.pantry_items set category = 'Grains & Pasta'
where category = 'Pantry' and (
  lower(ingredient_name) like '%rice%' or lower(ingredient_name) like '%pasta%'
  or lower(ingredient_name) like '%noodle%' or lower(ingredient_name) like '%spaghetti%'
  or lower(ingredient_name) like '%penne%' or lower(ingredient_name) like '%macaroni%'
  or lower(ingredient_name) like '%quinoa%' or lower(ingredient_name) like '%oat%'
  or lower(ingredient_name) like '%cereal%' or lower(ingredient_name) like '%granola%'
  or lower(ingredient_name) like '%couscous%' or lower(ingredient_name) like '%barley%'
  or lower(ingredient_name) like '%farro%' or lower(ingredient_name) like '%bulgur%'
);

-- Baking
update public.pantry_items set category = 'Baking'
where category = 'Pantry' and (
  lower(ingredient_name) like '%flour%' or lower(ingredient_name) like '%sugar%'
  or lower(ingredient_name) like '%baking powder%' or lower(ingredient_name) like '%baking soda%'
  or lower(ingredient_name) like '%yeast%' or lower(ingredient_name) like '%cornstarch%'
  or lower(ingredient_name) like '%cocoa%' or lower(ingredient_name) like '%chocolate%'
  or lower(ingredient_name) like '%vanilla%'
);

-- Nuts & Seeds
update public.pantry_items set category = 'Nuts & Seeds'
where category = 'Pantry' and (
  lower(ingredient_name) like '%nut%' or lower(ingredient_name) like '%almond%'
  or lower(ingredient_name) like '%walnut%' or lower(ingredient_name) like '%pecan%'
  or lower(ingredient_name) like '%cashew%' or lower(ingredient_name) like '%peanut%'
  or lower(ingredient_name) like '%pistachio%' or lower(ingredient_name) like '%seed%'
  or lower(ingredient_name) like '%sesame%' or lower(ingredient_name) like '%sunflower%'
  or lower(ingredient_name) like '%flax%' or lower(ingredient_name) like '%chia%'
);

-- Canned & Dried Goods (catch remaining Pantry items)
update public.pantry_items set category = 'Canned & Dried Goods'
where category = 'Pantry' and (
  lower(ingredient_name) like '%canned%' or lower(ingredient_name) like '%broth%'
  or lower(ingredient_name) like '%stock%' or lower(ingredient_name) like '%tomato sauce%'
  or lower(ingredient_name) like '%tomato paste%' or lower(ingredient_name) like '%coconut%'
  or lower(ingredient_name) like '%raisin%' or lower(ingredient_name) like '%dried%'
  or lower(ingredient_name) like '%lentil%' or lower(ingredient_name) like '%chickpea%'
  or lower(ingredient_name) like '%black bean%' or lower(ingredient_name) like '%kidney bean%'
  or lower(ingredient_name) like '%pinto bean%'
);

-- Any remaining "Pantry" items that didn't match above go to "Other"
update public.pantry_items set category = 'Other'
where category = 'Pantry';

-- Do the same for grocery_items
update public.grocery_items set category = 'Spices & Seasonings'
where category = 'Pantry' and (
  lower(ingredient_name) like '%salt%' or lower(ingredient_name) like '%pepper%'
  or lower(ingredient_name) like '%spice%' or lower(ingredient_name) like '%cumin%'
  or lower(ingredient_name) like '%paprika%' or lower(ingredient_name) like '%cinnamon%'
  or lower(ingredient_name) like '%nutmeg%' or lower(ingredient_name) like '%clove%'
  or lower(ingredient_name) like '%turmeric%' or lower(ingredient_name) like '%curry%'
  or lower(ingredient_name) like '%chili powder%' or lower(ingredient_name) like '%cayenne%'
  or lower(ingredient_name) like '%garlic powder%' or lower(ingredient_name) like '%onion powder%'
  or lower(ingredient_name) like '%italian seasoning%' or lower(ingredient_name) like '%bay leaf%'
  or lower(ingredient_name) like '%seasoning%'
);

update public.grocery_items set category = 'Oils & Vinegars'
where category = 'Pantry' and (
  lower(ingredient_name) like '%oil%' or lower(ingredient_name) like '%vinegar%'
  or lower(ingredient_name) like '%balsamic%'
);

update public.grocery_items set category = 'Condiments'
where category = 'Pantry' and (
  lower(ingredient_name) like '%soy sauce%' or lower(ingredient_name) like '%hot sauce%'
  or lower(ingredient_name) like '%ketchup%' or lower(ingredient_name) like '%mustard%'
  or lower(ingredient_name) like '%mayonnaise%' or lower(ingredient_name) like '%honey%'
  or lower(ingredient_name) like '%maple syrup%' or lower(ingredient_name) like '%molasses%'
  or lower(ingredient_name) like '%salsa%' or lower(ingredient_name) like '%sauce%'
  or lower(ingredient_name) like '%marinade%' or lower(ingredient_name) like '%dressing%'
  or lower(ingredient_name) like '%worcestershire%' or lower(ingredient_name) like '%sriracha%'
  or lower(ingredient_name) like '%bbq sauce%'
);

update public.grocery_items set category = 'Grains & Pasta'
where category = 'Pantry' and (
  lower(ingredient_name) like '%rice%' or lower(ingredient_name) like '%pasta%'
  or lower(ingredient_name) like '%noodle%' or lower(ingredient_name) like '%spaghetti%'
  or lower(ingredient_name) like '%penne%' or lower(ingredient_name) like '%macaroni%'
  or lower(ingredient_name) like '%quinoa%' or lower(ingredient_name) like '%oat%'
  or lower(ingredient_name) like '%cereal%' or lower(ingredient_name) like '%granola%'
  or lower(ingredient_name) like '%couscous%' or lower(ingredient_name) like '%barley%'
  or lower(ingredient_name) like '%farro%' or lower(ingredient_name) like '%bulgur%'
);

update public.grocery_items set category = 'Baking'
where category = 'Pantry' and (
  lower(ingredient_name) like '%flour%' or lower(ingredient_name) like '%sugar%'
  or lower(ingredient_name) like '%baking powder%' or lower(ingredient_name) like '%baking soda%'
  or lower(ingredient_name) like '%yeast%' or lower(ingredient_name) like '%cornstarch%'
  or lower(ingredient_name) like '%cocoa%' or lower(ingredient_name) like '%chocolate%'
  or lower(ingredient_name) like '%vanilla%'
);

update public.grocery_items set category = 'Nuts & Seeds'
where category = 'Pantry' and (
  lower(ingredient_name) like '%nut%' or lower(ingredient_name) like '%almond%'
  or lower(ingredient_name) like '%walnut%' or lower(ingredient_name) like '%pecan%'
  or lower(ingredient_name) like '%cashew%' or lower(ingredient_name) like '%peanut%'
  or lower(ingredient_name) like '%pistachio%' or lower(ingredient_name) like '%seed%'
  or lower(ingredient_name) like '%sesame%' or lower(ingredient_name) like '%sunflower%'
  or lower(ingredient_name) like '%flax%' or lower(ingredient_name) like '%chia%'
);

update public.grocery_items set category = 'Canned & Dried Goods'
where category = 'Pantry' and (
  lower(ingredient_name) like '%canned%' or lower(ingredient_name) like '%broth%'
  or lower(ingredient_name) like '%stock%' or lower(ingredient_name) like '%tomato sauce%'
  or lower(ingredient_name) like '%tomato paste%' or lower(ingredient_name) like '%coconut%'
  or lower(ingredient_name) like '%raisin%' or lower(ingredient_name) like '%dried%'
  or lower(ingredient_name) like '%lentil%' or lower(ingredient_name) like '%chickpea%'
  or lower(ingredient_name) like '%black bean%' or lower(ingredient_name) like '%kidney bean%'
  or lower(ingredient_name) like '%pinto bean%'
);

update public.grocery_items set category = 'Other'
where category = 'Pantry';
