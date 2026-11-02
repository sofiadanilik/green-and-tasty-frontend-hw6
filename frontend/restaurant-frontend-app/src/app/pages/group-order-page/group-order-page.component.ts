
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
import { forkJoin, interval, switchMap } from 'rxjs';

import { Participant } from '@app/models/group-orders/participant.model';
import { Order } from '@app/models/orders/order.model';
import { GroupReservationDetails } from '@app/models/reservations/guest-invite.model';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { ToastService } from '@app/services/toast/toast.service';
import { ParticipantCardComponent } from '@app/components/group-orders/participant-card/participant-card.component';
import { ModalComponent } from '@app/shared/custom-components/modal/modal.component';

@Component({
  selector: 'app-group-order-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    ModalComponent,
    ParticipantCardComponent,
  ],
  templateUrl: './group-order-page.component.html',
  styleUrl: './group-order-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class GroupOrderPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(GroupOrdersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  private readonly syncIntervalMs = 15_000;

  readonly reservationId =
    this.route.snapshot.paramMap.get('reservationId') ?? '';

  readonly groupDetails = signal<GroupReservationDetails | null>(null);
  readonly groupId = signal('');
  readonly ownerSessionId = signal('');
  readonly participants = signal<Participant[]>([]);
  readonly status = signal('Open');

  readonly loading = signal(true);
  readonly loadError = signal<'not-found' | 'other' | null>(null);
  readonly confirmOpen = signal(false);
  readonly submitting = signal(false);

  // Рівень 3: стан синхронізації.
  readonly updatedAt = signal<Date | null>(null);
  readonly refreshError = signal(false);
  readonly refreshing = signal(false);

  // Об'єднуємо однакові страви лише з підтверджених кошиків.
  readonly consolidated = computed(() => {
    type Dish = Participant['items'][number]['dish'];

    const dishes = new Map<
      string,
      { dish: Dish; quantity: number }
    >();

    for (const person of this.participants()) {
      if (person.type !== 'Owner' && !person.isSubmitted) {
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
      (sum, item) =>
        sum + item.dish.price * item.quantity,
      0
    );

    return { items, total };
  });

  readonly pendingCount = computed(() =>
    this.participants().filter(
      (person) => person.type === 'Guest' && !person.isSubmitted
    ).length
  );

  readonly hasDishes = computed(() =>
    this.participants().some(
      (person) => person.items.length > 0
    )
  );

  readonly canSubmit = computed(() =>
    this.status() === 'Open' &&
    this.consolidated().items.length > 0 &&
    this.participants().some(
      (person) =>
        person.type === 'Guest' &&
        person.isSubmitted &&
        person.items.length > 0
    ) &&
    !this.refreshing() &&
    !this.submitting()
  );

  // Завантаження сторінки та автоматична синхронізація.
  ngOnInit(): void {
    this.load();

    interval(this.syncIntervalMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Не надсилаємо нові запити після Submit,
        // під час першого завантаження чи іншого оновлення.
        if (
          this.status() !== 'Open' ||
          this.loading() ||
          this.refreshing() ||
          this.submitting()
        ) {
          return;
        }

        this.refresh();
      });
  }

  // Початкове завантаження.
  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.refreshError.set(false);
    this.confirmOpen.set(false);

    this.service
      .getOwnerGroup$(this.reservationId)
      .pipe(
        switchMap((invite) => {
          this.groupDetails.set(invite);
          this.groupId.set(invite.GroupReservationId);

          return forkJoin({
            sessions: this.service.getSessions$(
              invite.GroupReservationId
            ),
            ownerOrder: this.service.getOwnerPreOrder$(
              this.reservationId
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
        next: ({ sessions, ownerOrder, ownerId, groupStatus }) => {
          this.participants.set(
            this.withOwnerPreOrder(
              sessions.participants,
              ownerId,
              ownerOrder
            )
          );
          this.ownerSessionId.set(ownerId);
          this.status.set(groupStatus.status);

          this.updatedAt.set(new Date());
          this.refreshError.set(false);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          const notFound =
            error instanceof HttpErrorResponse &&
            error.status === 404;

          this.loadError.set(
            notFound ? 'not-found' : 'other'
          );

          this.loading.set(false);
        },
      });
  }

  // Рівень 3: ручне і фонове оновлення даних.
  refresh(): void {
    const groupId = this.groupId();

    if (
      !groupId ||
      this.status() !== 'Open' ||
      this.loading() ||
      this.refreshing() ||
      this.submitting()
    ) {
      return;
    }

    this.refreshing.set(true);
    this.refreshError.set(false);

    forkJoin({
      sessions: this.service.getSessions$(
        groupId,
        { silent: true }
      ),
      ownerOrder: this.service.getOwnerPreOrder$(
        this.reservationId,
        { silent: true }
      ),
      groupStatus: this.service.getStatus$(
        groupId,
        { silent: true }
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ sessions, ownerOrder, groupStatus }) => {
          // Keep the previous view unless every refresh request succeeds.
          this.participants.set(
            this.withOwnerPreOrder(
              sessions.participants,
              this.ownerSessionId(),
              ownerOrder
            )
          );
          this.status.set(groupStatus.status);
          if (groupStatus.status !== 'Open') {
            this.confirmOpen.set(false);
          }

          this.updatedAt.set(new Date());
          this.refreshError.set(false);
          this.refreshing.set(false);
        },
        error: () => {
          // Не очищаємо учасників і страви.
          // Показуємо помилку та залишаємо старі дані.
          this.refreshError.set(true);
          this.refreshing.set(false);
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
    if (
      !this.confirmOpen() ||
      !this.canSubmit()
    ) {
      return;
    }

    // Захист від подвійного натискання.
    this.submitting.set(true);

    this.service
      .submit$(
        this.groupId(),
        this.reservationId
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.status.set('Submitted');
          this.confirmOpen.set(false);
          this.submitting.set(false);
          this.toast.success('Pre-order sent to the restaurant');

          // Після зміни статусу на Submitted
          // фонові запити більше не виконуватимуться.
        },
        error: () => {
          this.confirmOpen.set(false);
          this.submitting.set(false);
        },
      });
  }

  private withOwnerPreOrder(
    participants: Participant[],
    ownerSessionId: string,
    order: Order
  ): Participant[] {
    const existingOwner = participants.find(
      (participant) => participant.id === ownerSessionId
    );
    const orderItems = order.orderItems.map((item) => ({
      dish: {
        id: item.dish.id,
        name: item.dish.name,
        price: item.dish.price,
        imageUrl: item.dish.imageUrl ?? undefined,
        weight: item.dish.weight,
      },
      quantity: item.quantity,
    }));
    const items = orderItems.length > 0
      ? orderItems
      : existingOwner?.items ?? [];
    const owner: Participant = {
      id: ownerSessionId,
      type: 'Owner',
      name: existingOwner?.name ?? 'Owner',
      items,
      total: items.reduce(
        (total, item) => total + item.dish.price * item.quantity,
        0
      ),
      isSubmitted: existingOwner?.isSubmitted ?? false,
    };

    return existingOwner
      ? participants.map((participant) =>
          participant.id === ownerSessionId ? owner : participant
        )
      : [owner, ...participants];
  }
}
