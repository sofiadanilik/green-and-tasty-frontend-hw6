import { selectEighteenRealDishes } from '@app/shared/helpers/restaurant-menu.helpers';

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';

import { DishCardComponent } from '@app/shared/custom-components/dish-card/dish-card.component';
import { DishesService } from '@app/services/dishes/dishes.service';
import { DishListResponse } from '@app/models/dishes/dish-list-response.model';
import { MainCoverImageComponent } from '@app/shared/custom-components/main-cover-image/main-cover-image.component';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DishSort } from '@app/models/enums/dish-sort.model';
import { DishType } from '@app/models/enums/dish-type.model';
import {
  DishSortingLabels,
  DishTypeLabels,
} from '@app/shared/mappers/dish-enum.mapper';
import { DishModalComponent } from '@app/components/dish-modal/dish-modal.component';
import { PreOrdersService } from '@app/services/pre-orders/pre-orders.service';
import { ToastService } from '@app/services/toast/toast.service';
import { getDishImageUrl } from '@app/shared/helpers/dish-image.helpers';
import { SHOWCASE_MENU_DISHES } from '@app/shared/mock/showcase-menu.data';

// Real food photographs instead of SVG illustrations.
// These URLs require an internet connection.
const REAL_DISH_PHOTOS: Readonly<Record<string, string>> = {
  'grilled salmon':
    'assets/img/dishes/plate-grilled-salmon.jpg',

  'grilled salmon 2':
    'assets/img/dishes/plate-grilled-salmon.jpg',

  'margherita pizza':
    'assets/img/dishes/plate-margherita-pizza.jpg',

  'truffle mushroom risotto':
    'assets/img/dishes/plate-mushroom-risotto.jpg',

  'fresh avocado toast':
    'assets/img/dishes/plate-avocado-toast.jpg',

  'green salad':
    'assets/img/dishes/plate-green-salad.jpg',

  'spring salad':
    'assets/img/dishes/spring-salad.jpg',

  'avocado & pine nut bowl':
    'assets/img/dishes/avocado-pine-nut-bowl.jpg',

  'roasted sweet potato & lentil salad':
    'assets/img/dishes/roasted-sweet-potato-and-lentil-salad.jpg',

  'fresh strawberry mint salad':
    'assets/img/dishes/fresh-strawberry-mint-salad.jpg',
};

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [
    RouterModule,
    DishCardComponent,
    MainCoverImageComponent,
    DishModalComponent,
  ],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [DishesService],
})
export class MenuPageComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly dishesService = inject(DishesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(PreOrdersService);

  dishes: DishListResponse[] = [];
  filteredDishes: DishListResponse[] = [];

  isPreOrderEnabled = false;
  preOrderReservationId?: string;
  preOrderReservationLabel?: string;

  sortOptions = Object.values(DishSort);
  sortLabels = DishSortingLabels;

  menuCategories = Object.values(DishType);
  menuCategoryLabels = DishTypeLabels;

  selectedCategory: DishType | null = null;
  selectedSort: DishSort = DishSort.PopularityDescending;

  selectedDish: DishListResponse | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const preOrder = params['preOrder'];

      this.isPreOrderEnabled = !!preOrder;

      if (this.isPreOrderEnabled) {
        this.preOrderReservationId = params['reservationId'];
        this.preOrderReservationLabel = params['reservationLabel'];

        if (!this.preOrderReservationId) {
          console.error(
            'Pre-order is enabled but no reservation ID provided.'
          );

          this.toast.error(
            'Pre-order is enabled but no reservation ID provided.',
            'Error'
          );

          this.isPreOrderEnabled = false;
        }
      }

      const category = params['category'] as DishType;
      const sort = params['sort'] as DishSort;

      this.selectedCategory =
        category && Object.values(DishType).includes(category)
          ? category
          : null;

      this.selectedSort =
        sort && Object.values(DishSort).includes(sort)
          ? sort
          : DishSort.PopularityDescending;

      this.loadDishes();
    });
  }

  private getRealDishPhoto(
    name: string,
    imageUrl?: string | null
  ): string {
    const normalizedName = (name || '')
      .trim()
      .toLowerCase();

    // Prefer a matching real photograph.
    const matchingPhoto = REAL_DISH_PHOTOS[normalizedName];

    if (matchingPhoto) {
      return matchingPhoto;
    }

    // Keep the API image for other dishes.
    const apiImage = imageUrl?.trim();

    if (apiImage) {
      return apiImage;
    }

    // Preserve the existing application fallback.
    return (
      getDishImageUrl(name, null) ??
      'assets/img/dishes/spring-salad.jpg'
    );
  }

  loadDishes(): void {
    // The public menu and owner pre-order now use the SAME 18 real API dishes.
    // Do not send temporary showcase-* IDs to the order endpoint.
    this.dishesService.getDishes().subscribe({
      next: (data) => {
        this.dishes = selectEighteenRealDishes(data);
        const visible = this.dishes.filter(
          (dish) => !this.selectedCategory || dish.dishType === this.selectedCategory
        );

        switch (this.selectedSort) {
          case DishSort.PriceAscending:
            visible.sort((a, b) => a.price - b.price);
            break;
          case DishSort.PriceDescending:
            visible.sort((a, b) => b.price - a.price);
            break;
          case DishSort.PopularityAscending:
            visible.reverse();
            break;
          default:
            // Keep the chosen 18-card visual order in the reference catalog.
            break;
        }

        this.filteredDishes = visible;
      },
      error: () => {
        this.dishes = [];
        this.filteredDishes = [];
        this.toast.error('Unable to load the restaurant menu.', 'Menu');
      },
    });
  }

  onCategorySelected(category: DishType | null): void {
    this.selectedCategory =
      this.selectedCategory === category ? null : category;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.selectedCategory || null,
        sort: this.selectedSort,
      },
      queryParamsHandling: 'merge',
    });
  }

  onSortChanged(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const sort = selectElement.value as DishSort;

    this.selectedSort = sort;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.selectedCategory || null,
        sort: this.selectedSort,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  openModal(dish: DishListResponse): void {
    this.selectedDish = dish;
  }

  closeModal(): void {
    this.selectedDish = null;
  }

  addDishToCart(dish: DishListResponse): void {
    this.orderService
      .addDishToPreOrderByReservationId(
        this.preOrderReservationId!,
        dish,
        1
      )
      .subscribe({
        next: () => {
          this.toast.success(
            'Dish added to cart successfully!',
            'Success'
          );
        },
        error: (err) => {
          this.toast.error(
            (err as Error).message,
            'Error'
          );
        },
      });
  }
}
