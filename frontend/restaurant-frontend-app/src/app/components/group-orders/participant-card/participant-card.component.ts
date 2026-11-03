
import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DishShort, Participant } from '@app/models/group-orders/participant.model';
import { getDishImageUrl } from '@app/shared/helpers/dish-image.helpers';

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
  readonly isFinalOrder = input(false);

  readonly title = computed(() => {
    const person = this.participant();

    if (this.isOwnerOrder()) {
      return this.isFinalOrder() ? 'Restaurant Order' : 'My Pre-Order';
    }

    return person.type === 'Owner' ? `Owner: ${person.name}` : `Guest: ${person.name}`;
  });

  imageUrl(dish: DishShort): string | null {
    return getDishImageUrl(dish.name, dish.imageUrl, dish.id);
  }

  hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }
}
