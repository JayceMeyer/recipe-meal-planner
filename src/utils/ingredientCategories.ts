const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Produce: [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'tomato', 'potato', 'onion',
    'garlic', 'ginger', 'carrot', 'celery', 'lettuce', 'spinach', 'kale',
    'broccoli', 'cauliflower', 'pepper', 'cucumber', 'zucchini', 'squash',
    'mushroom', 'avocado', 'berry', 'strawberry', 'blueberry', 'raspberry',
    'grape', 'melon', 'watermelon', 'mango', 'pineapple', 'peach', 'pear',
    'plum', 'cherry', 'cabbage', 'asparagus', 'corn', 'peas', 'beans',
    'green bean', 'eggplant', 'beet', 'radish', 'turnip', 'parsnip',
    'sweet potato', 'leek', 'scallion', 'shallot', 'herb', 'basil', 'cilantro',
    'parsley', 'mint', 'thyme', 'rosemary', 'oregano', 'dill', 'chive',
    'arugula', 'romaine', 'fennel', 'artichoke', 'okra', 'jalapeño',
  ],
  Dairy: [
    'milk', 'cream', 'cheese', 'butter', 'yogurt', 'sour cream', 'cottage cheese',
    'ricotta', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'goat cheese',
    'cream cheese', 'half and half', 'whipping cream', 'heavy cream',
    'buttermilk', 'ghee', 'mascarpone', 'brie', 'gouda', 'swiss',
  ],
  Meat: [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'veal', 'bacon',
    'sausage', 'ham', 'ground beef', 'ground turkey', 'ground pork',
    'steak', 'roast', 'chop', 'tenderloin', 'rib', 'brisket', 'sirloin',
    'filet', 'wing', 'thigh', 'breast', 'drumstick', 'leg', 'meatball',
    'hot dog', 'salami', 'pepperoni', 'prosciutto', 'pancetta',
  ],
  Seafood: [
    'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'scallop',
    'clam', 'mussel', 'oyster', 'cod', 'tilapia', 'halibut', 'trout',
    'sardine', 'anchovy', 'mackerel', 'snapper', 'bass', 'swordfish',
    'calamari', 'squid', 'octopus', 'crawfish', 'prawn',
  ],
  Bakery: [
    'bread', 'roll', 'baguette', 'croissant', 'bagel', 'muffin', 'donut',
    'cake', 'pie', 'pastry', 'cookie', 'tortilla', 'pita', 'naan',
    'biscuit', 'cracker', 'breadcrumb', 'crouton', 'wrap',
  ],
  Pantry: [
    'flour', 'sugar', 'salt', 'pepper', 'oil', 'olive oil', 'vegetable oil',
    'vinegar', 'soy sauce', 'hot sauce', 'ketchup', 'mustard', 'mayonnaise',
    'honey', 'maple syrup', 'molasses', 'vanilla', 'baking powder',
    'baking soda', 'yeast', 'cornstarch', 'cocoa', 'chocolate', 'rice',
    'pasta', 'noodle', 'spaghetti', 'penne', 'macaroni', 'quinoa', 'oat',
    'cereal', 'granola', 'nut', 'almond', 'walnut', 'pecan', 'cashew',
    'peanut', 'seed', 'sesame', 'sunflower', 'coconut', 'raisin', 'date',
    'dried', 'canned', 'broth', 'stock', 'tomato sauce', 'tomato paste',
    'salsa', 'sauce', 'marinade', 'dressing', 'spice', 'cumin', 'paprika',
    'cinnamon', 'nutmeg', 'clove', 'turmeric', 'curry', 'chili powder',
    'cayenne', 'garlic powder', 'onion powder', 'italian seasoning',
    'bay leaf', 'lentil', 'chickpea', 'black bean', 'kidney bean',
  ],
  Frozen: [
    'frozen', 'ice cream', 'popsicle', 'frozen pizza', 'frozen vegetable',
    'frozen fruit', 'frozen dinner', 'frozen waffle', 'frozen fry',
  ],
  Beverages: [
    'water', 'juice', 'soda', 'coffee', 'tea', 'wine', 'beer', 'liquor',
    'vodka', 'rum', 'whiskey', 'gin', 'tequila', 'brandy', 'champagne',
    'sparkling', 'lemonade', 'smoothie', 'shake', 'milk alternative',
    'almond milk', 'oat milk', 'soy milk', 'coconut milk',
  ],
  Eggs: [
    'egg', 'eggs',
  ],
}

const CATEGORY_ORDER = [
  'Produce',
  'Dairy',
  'Eggs',
  'Meat',
  'Seafood',
  'Bakery',
  'Frozen',
  'Beverages',
  'Pantry',
  'Other',
]

export function categorizeIngredient(ingredientName: string): string {
  const lowerName = ingredientName.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return category
      }
    }
  }

  return 'Other'
}

export function getCategoryOrder(category: string): number {
  const index = CATEGORY_ORDER.indexOf(category)
  return index === -1 ? CATEGORY_ORDER.length : index
}

export function sortByCategory<T extends { category: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const categoryA = a.category || 'Other'
    const categoryB = b.category || 'Other'
    return getCategoryOrder(categoryA) - getCategoryOrder(categoryB)
  })
}

export const CATEGORIES = CATEGORY_ORDER
