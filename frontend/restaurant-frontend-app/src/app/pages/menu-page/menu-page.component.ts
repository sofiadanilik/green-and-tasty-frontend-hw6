
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

// Real food photographs instead of SVG illustrations.
// These URLs require an internet connection.
const REAL_DISH_PHOTOS: Readonly<Record<string, string>> = {
  'grilled salmon':
    'https://images.unsplash.com/photo-1748712831461-9fbf45338e13?auto=format&fit=crop&w=640&h=640&q=80',

  'grilled salmon 2':
    'https://images.unsplash.com/photo-1748712831461-9fbf45338e13?auto=format&fit=crop&w=640&h=640&q=80',

  'margherita pizza':
    'https://images.unsplash.com/photo-1680405620826-83b0f0f61b28?auto=format&fit=crop&w=640&h=640&q=80',

  'truffle mushroom risotto':
    'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=640&h=640&q=80',

  'fresh avocado toast':
    'https://images.unsplash.com/photo-1603046891743-0f28d1192132?auto=format&fit=crop&w=640&h=640&q=80',

  'green salad':
    'assets/img/dishes/spring-salad.jpg',

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
    const category = this.selectedCategory ?? undefined;
    const sort = this.selectedSort;

    this.dishesService.getDishes(category, sort).subscribe((data) => {
      this.dishes = data.map((dish) => ({
        ...dish,

        imageUrl: this.getRealDishPhoto(
          dish.name,
          dish.imageUrl
        ),

        name: dish.name || 'Unknown Dish',
        price: dish.price || 0,
        weight: dish.weight || 'N/A',
        description: dish.description || 'N/A',
        state: dish.state || 'N/A',
        dishType: dish.dishType || 'N/A',
        calories: dish.calories || '0',
        proteins: dish.proteins || '0',
        fats: dish.fats || '0',
        carbohydrates: dish.carbohydrates || '0',
        vitamins: dish.vitamins || '0',
      }));

      this.filteredDishes = this.dishes;
    });
  }

  onCategorySelected(category: DishType): void {
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
