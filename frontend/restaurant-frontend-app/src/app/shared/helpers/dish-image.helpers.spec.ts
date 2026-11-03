import { getDishImageUrl } from './dish-image.helpers';
import { environment } from '../../../environments/environment';

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
      getDishImageUrl('Grilled Salmon'),
    ];

    expect(images).toEqual([
      'assets/img/dishes/spring-salad.jpg',
      'assets/img/dishes/fresh-strawberry-mint-salad.jpg',
      'assets/img/dishes/roasted-sweet-potato-and-lentil-salad.jpg',
      'assets/img/dishes/avocado-pine-nut-bowl.jpg',
      'assets/img/dishes/grilled-salmon.svg',
    ]);
    expect(new Set(images).size).toBe(5);
  });

  it('shows different existing photos for the isolated local salad and bowl', () => {
    const previous = environment.localE2E;
    environment.localE2E = true;
    try {
      const salad = getDishImageUrl('Test salad', null, 'local-salad');
      const bowl = getDishImageUrl('Test bowl', null, 'local-bowl');
      expect(salad).toBe('assets/img/dishes/spring-salad.jpg');
      expect(bowl).toBe('assets/img/dishes/avocado-pine-nut-bowl.jpg');
      expect(salad).not.toBe(bowl);
      expect(getDishImageUrl('Unknown', null, 'other-id')).toBeNull();
    } finally {
      environment.localE2E = previous;
    }
  });

  it('does not assign a food photo to an unrelated or unknown dish', () => {
    expect(getDishImageUrl('Mystery Dish')).toBeNull();
    expect(getDishImageUrl('Spring Salad Deluxe')).toBeNull();
  });
});
