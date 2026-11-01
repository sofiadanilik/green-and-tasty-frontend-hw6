
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';

import { Participant } from '@app/models/group-orders/participant.model';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { ParticipantCardComponent } from '@app/components/group-orders/participant-card/participant-card.component';

@Component({
  selector: 'app-group-order-page',
  imports: [CurrencyPipe, DatePipe, ParticipantCardComponent],
  templateUrl: './group-order-page.component.html',
  styleUrl: './group-order-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class GroupOrderPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(GroupOrdersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly reservationId =
    this.route.snapshot.paramMap.get('reservationId') ?? '';

  readonly invite = signal<GuestInvite | null>(null);
  readonly groupId = signal('');
  readonly ownerSessionId = signal('');
  readonly participants = signal<Participant[]>([]);
  readonly status = signal('Open');

  readonly loading = signal(true);
  readonly loadError = signal<'not-found' | 'other' | null>(null);
  readonly confirmOpen = signal(false);
  readonly submitting = signal(false);

  // Збираємо тільки підтверджені кошики.
  // Однакові страви об'єднуємо за dish.id.
  readonly consolidated = computed(() => {
    type Dish = Participant['items'][number]['dish'];

    const dishes = new Map<
      string,
      { dish: Dish; quantity: number }
    >();

    for (const person of this.participants()) {
      if (!person.isSubmitted) {
        continue;
      }

      for (const item of person.items) {
        const existing = dishes.get(item.dish.id);

        if (existing) {
          existing.quantity += item.quantity;
        } else {
          dishes.set(item.dish.id, {
            dish: item.dish,
            quantity: item.quantity,
          });
        }
      }
    }

    const items = Array.from(dishes.values());

    const total = items.reduce(
      (sum, item) => sum + item.dish.price * item.quantity,
      0
    );

    return { items, total };
  });

  readonly pendingCount = computed(() =>
    this.participants().filter((person) => !person.isSubmitted).length
  );

  readonly hasDishes = computed(() =>
    this.participants().some((person) => person.items.length > 0)
  );

  readonly canSubmit = computed(() =>
    this.status() === 'Open' &&
    this.consolidated().items.length > 0 &&
    !this.submitting()
  );

  // Завантажуємо дані одразу після відкриття сторінки.
  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.confirmOpen.set(false);

    this.service
      .getGroupInvite$(this.reservationId)
      .pipe(
        switchMap((invite) => {
          this.invite.set(invite);
          this.groupId.set(invite.GroupReservationId);

          return forkJoin({
            sessions: this.service.getSessions$(
              invite.GroupReservationId
            ),
            ownerId: this.service.getOwnerSessionId$(
              this.reservationId
            ),
            groupStatus: this.service.getStatus$(
              invite.GroupReservationId
            ),
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ sessions, ownerId, groupStatus }) => {
          this.participants.set(sessions.participants);
          this.ownerSessionId.set(ownerId);
          this.status.set(groupStatus.status);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          const notFound =
            error instanceof HttpErrorResponse &&
            error.status === 404;

          this.loadError.set(notFound ? 'not-found' : 'other');
          this.loading.set(false);
        },
      });
  }

  openConfirmation(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.confirmOpen.set(true);
  }

  closeConfirmation(): void {
    if (this.submitting()) {
      return;
    }

    this.confirmOpen.set(false);
  }

  submitPreOrder(): void {
    if (!this.confirmOpen() || !this.canSubmit()) {
      return;
    }

    // Одразу блокуємо повторний клік.
    this.submitting.set(true);

    this.service
      .submit$(this.groupId(), this.reservationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.status.set('Submitted');
          this.confirmOpen.set(false);
          this.submitting.set(false);
        },
        error: () => {
          this.confirmOpen.set(false);
          this.submitting.set(false);
        },
      });
  }
}
