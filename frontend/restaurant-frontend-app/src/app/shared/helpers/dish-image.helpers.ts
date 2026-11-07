import { environment } from '../../../environments/environment';

const LOCAL_DISH_IMAGES: Readonly<Record<string, string>> = {
  'avocado-pine-nut-bowl': 'assets/img/dishes/avocado-pine-nut-bowl.jpg',
  'fresh-strawberry-mint-salad': 'assets/img/dishes/fresh-strawberry-mint-salad.jpg',
  'roasted-sweet-potato-and-lentil-salad':
    'assets/img/dishes/roasted-sweet-potato-and-lentil-salad.jpg',
  'spring-salad': 'assets/img/dishes/spring-salad.jpg',
  'green-salad': 'assets/img/dishes/plate-green-salad.jpg',

  'fresh-avocado-toast': 'assets/img/dishes/plate-avocado-toast.jpg',
  'grilled-salmon': 'assets/img/dishes/plate-grilled-salmon.jpg',
  'grilled-salmon-2': 'assets/img/dishes/plate-grilled-salmon.jpg',
  'truffle-mushroom-risotto': 'assets/img/dishes/plate-mushroom-risotto.jpg',
  'margherita-pizza': 'assets/img/dishes/plate-margherita-pizza.jpg',
};

const LOCAL_E2E_DISH_IMAGES: Readonly<Record<string, string>> = {
  'local-salad': 'assets/img/dishes/spring-salad.jpg',
  'local-bowl': 'assets/img/dishes/avocado-pine-nut-bowl.jpg',
};

function dishSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getDishImageUrl(
  name: string,
  imageUrl?: string | null,
  dishId?: string
): string | null {
  const providedImage = imageUrl?.trim();
  if (providedImage) {
    return providedImage;
  }

  return LOCAL_DISH_IMAGES[dishSlug(name)] ??
    (environment.localE2E && dishId ? LOCAL_E2E_DISH_IMAGES[dishId] : null) ?? null;
}
