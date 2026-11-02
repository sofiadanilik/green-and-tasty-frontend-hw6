import { getDishImageUrl } from './dish-image.helpers';

describe('getDishImageUrl', () => {
  it('keeps a backend-provided dish photo', () => {
    expect(getDishImageUrl('Spring Salad', ' https://images.test/salad.jpg '))
      .toBe('https://images.test/salad.jpg');
  });

  it('maps only exact local menu dish names to their matching assets', () => {
    const images = [
      getDishImageUrl('Spring Salad'),
      getDishImageUrl('Fresh Strawberry Mint Salad'),
      getDishImageUrl('Roasted Sweet Potato & Lentil Salad'),
      getDishImageUrl('Avocado Pine Nut Bowl'),
    ];

    expect(images).toEqual([
      'assets/img/dishes/spring-salad.jpg',
      'assets/img/dishes/fresh-strawberry-mint-salad.jpg',
      'assets/img/dishes/roasted-sweet-potato-and-lentil-salad.jpg',
      'assets/img/dishes/avocado-pine-nut-bowl.jpg',
    ]);
    expect(new Set(images).size).toBe(4);
  });

  it('does not assign a food photo to an unrelated or unknown dish', () => {
    expect(getDishImageUrl('Grilled Salmon')).toBeNull();
    expect(getDishImageUrl('Spring Salad Deluxe')).toBeNull();
  });
});
