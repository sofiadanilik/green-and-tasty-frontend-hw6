import { DishListResponse } from '@app/models/dishes/dish-list-response.model';
import { SHOWCASE_MENU_DISHES } from '@app/shared/mock/showcase-menu.data';

/**
 * The 18 IDs were read from the catalog's selected-ids.json backup generated
 * after the real DynamoDB records were created. These IDs belong to the real
 * API catalog, not to the temporary showcase-* placeholders.
 *
 * GT_REAL_MENU_EVERYWHERE_V1
 */
export const REAL_MENU_IDS: Readonly<Record<string, string>> = {
    "Spring Salad":  "393bd29d-7fd9-3445-4025-03a260eb5b33",
    "Dark Chocolate Fondant":  "d2aee92c-ffe5-6b68-ceae-9f87e70f678a",
    "Citrus Avocado Toast":  "2a2740a8-275b-4b52-2368-a8d01d56c33c",
    "Chicken Kyiv with Mashed Potatoes":  "beeeaf69-8d66-6140-a491-5fa66980943d",
    "Beetroot Carpaccio":  "d77ebac4-00a5-e790-bb99-f504089c8b25",
    "Mushroom Risotto":  "712c190a-c687-ae4e-cb21-d2212d5a463c",
    "Cheesecake with Berries":  "4d5395db-3957-c6c5-8d0e-7bb97bce51e8",
    "Honey Cake Medovik":  "49d353b9-12f8-fb66-b6fe-1d80f7a8af47",
    "Truffle Mushroom Risotto":  "95f0b087-4128-428f-bd3c-cc3353471e75",
    "Grilled Salmon with Quinoa":  "772f8d15-0c1b-0653-f411-7af905cee496",
    "Fresh Berry Cheesecake":  "3fa2280f-57d0-0b33-0d91-1fb278e739d2",
    "Classic Margherita Pizza":  "27c30ee3-8ad7-5144-0a0b-e9809c947253",
    "Roasted Sweet Potato Salad":  "9007287f-1db0-ce16-4da6-92fc042eeba7",
    "Burrata with Heirloom Tomatoes":  "58c7d77e-48a3-ff5d-d0b8-0410668b335a",
    "Avocado Pine Nut Bowl":  "2837b817-2860-e8f2-5c57-06f36e87af66",
    "Grilled Salmon":  "07efc9a8-e9fc-4612-9e80-59fda0dc7fc3",
    "Veggie Burger":  "db8652f3-9e3f-06b9-b8e8-83513a54487f",
    "Avocado Tartare":  "726a6f6a-efc7-5162-f365-e99d6d429cb8"
};

/** Present exactly the 18 selected REAL backend dishes, retaining local photos. */
export function selectEighteenRealDishes(apiDishes: DishListResponse[]): DishListResponse[] {
  const byId = new Map(apiDishes.map((dish) => [dish.id, dish]));

  return SHOWCASE_MENU_DISHES.flatMap((reference) => {
    const realId = REAL_MENU_IDS[reference.name];
    const dish = realId ? byId.get(realId) : undefined;
    if (!dish) return [];

    return [{
      ...dish,
      imageUrl: reference.imageUrl,
      description: dish.description || reference.description,
    }];
  });
}

export function getShowcasePhotoForName(name: string): string | undefined {
  const key = name.trim().toLowerCase();
  return SHOWCASE_MENU_DISHES.find((dish) => dish.name.trim().toLowerCase() === key)?.imageUrl;
}

/** Featured five: a curated row, not an invented popularity ranking. */
export function selectFiveFeaturedDishes(apiDishes: DishListResponse[]): DishListResponse[] {
  const fullMenu = selectEighteenRealDishes(apiDishes);
  const featuredNames = [
    'Grilled Salmon',
    'Avocado Tartare',
    'Veggie Burger',
    'Truffle Mushroom Risotto',
    'Green Salad',
  ];

  const chosen = featuredNames
    .map((name) => fullMenu.find((dish) => dish.name === name))
    .filter((dish): dish is DishListResponse => dish !== undefined);

  for (const dish of fullMenu) {
    if (chosen.length >= 5) break;
    if (!chosen.some((item) => item.id === dish.id)) chosen.push(dish);
  }

  return chosen.slice(0, 5);
}
