const DISH_IMAGE_BY_NAME: Record<string, string> = {
  'green salad': 'assets/img/dishes/green-salad.svg',
  'spring salad': 'assets/img/dishes/spring-salad.svg',
  'green bowl': 'assets/img/dishes/green-bowl.svg',
  'grilled salmon': 'assets/img/dishes/grilled-salmon.svg',
  'grilled salmon 2': 'assets/img/dishes/grilled-salmon.svg',
  'truffle mushroom risotto': 'assets/img/dishes/mushroom-risotto.svg',
  'margherita pizza': 'assets/img/dishes/margherita-pizza.svg',
  'fresh avocado toast': 'assets/img/dishes/avocado-toast.svg',
};

function normalizeDishName(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function getDishImage(dish: {
  name?: string | null;
  imageUrl?: string | null;
} | null | undefined): string {
  if (!dish) {
    return 'assets/img/dishes/default-dish.svg';
  }

  const apiImage = dish.imageUrl?.trim();
  if (apiImage) {
    return apiImage;
  }

  const normalizedName = normalizeDishName(dish.name);
  return (
    DISH_IMAGE_BY_NAME[normalizedName] ??
    'assets/img/dishes/default-dish.svg'
  );
}