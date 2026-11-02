
import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DishShort, Participant } from '@app/models/group-orders/participant.model';

const localDishImageSlugs = new Set([
  'avocado-pine-nut-bowl',
  'fresh-strawberry-mint-salad',
  'roasted-sweet-potato-and-lentil-salad',
  'spring-salad',
]);

@Component({
  selector: 'app-participant-card',
  imports: [CurrencyPipe],
  templateUrl: './participant-card.component.html',
  styleUrl: './participant-card.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ParticipantCardComponent {
  readonly participant = input.required<Participant>();
  readonly isOwnerOrder = input(false);

  readonly title = computed(() => {
    const person = this.participant();

    if (this.isOwnerOrder()) {
      return 'My Pre-Order';
    }

    return person.type === 'Owner' ? `Owner: ${person.name}` : `Guest: ${person.name}`;
  });

  imageUrl(dish: DishShort): string | null {
    if (dish.imageUrl) {
      return dish.imageUrl;
    }

    const slug = dish.name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return localDishImageSlugs.has(slug)
      ? `assets/img/dishes/${slug}.jpg`
      : null;
  }

  hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }
}
