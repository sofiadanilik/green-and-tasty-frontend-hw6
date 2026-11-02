const LOCAL_DISH_IMAGES: Readonly<Record<string, string>> = {
  'avocado-pine-nut-bowl': 'assets/img/dishes/avocado-pine-nut-bowl.jpg',
  'fresh-strawberry-mint-salad': 'assets/img/dishes/fresh-strawberry-mint-salad.jpg',
  'roasted-sweet-potato-and-lentil-salad':
    'assets/img/dishes/roasted-sweet-potato-and-lentil-salad.jpg',
  'spring-salad': 'assets/img/dishes/spring-salad.jpg',
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
  imageUrl?: string | null
): string | null {
  const providedImage = imageUrl?.trim();
  if (providedImage) {
    return providedImage;
  }

  return LOCAL_DISH_IMAGES[dishSlug(name)] ?? null;
}
