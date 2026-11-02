import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { GuestInviteService } from '@app/services/reservation/guest-invite.service';
import { GuestSessionsService } from '@app/services/guest-sessions/guest-sessions.service';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { GuestPreorderStore } from './guest-preorder.store';

const INVITE: GuestInvite = {
  GroupReservationId: 'group-1',
  LocationId: 'location-1',
  RestaurantName: 'Green & Tasty',
  LocationAddress: 'Rustaveli Avenue 48',
  StartTime: '2026-10-21T16:00:00Z',
  EndTime: '2026-10-21T17:30:00Z',
  MaxGuestCount: 4,
  TableNumber: 12,
  InviterName: 'Owner',
};

describe('GuestPreorderStore', () => {
  let store: GuestPreorderStore;
  let guestSessions: jasmine.SpyObj<GuestSessionsService>;

  beforeEach(() => {
    guestSessions = jasmine.createSpyObj<GuestSessionsService>(
      'GuestSessionsService',
      ['createSession', 'getMenu', 'addDish', 'removeDish', 'submit'],
    );
    guestSessions.createSession.and.returnValue(
      of({ SessionId: 'session-1', SessionToken: 'guest-token' }),
    );
    guestSessions.getMenu.and.returnValue(of({ dishes: {} }));
    guestSessions.addDish.and.returnValue(of({}));
    guestSessions.removeDish.and.returnValue(of({}));
    guestSessions.submit.and.returnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        GuestPreorderStore,
        {
          provide: GuestInviteService,
          useValue: jasmine.createSpyObj('GuestInviteService', ['getInvite$']),
        },
        { provide: GuestSessionsService, useValue: guestSessions },
      ],
    });

    store = TestBed.inject(GuestPreorderStore);
    store.invite.set(INVITE);
  });

  it('persists the submitted guest name in the created session and uses its token for menu and cart actions', async () => {
    await store.join('  Alex Guest  ');

    expect(guestSessions.createSession).toHaveBeenCalledOnceWith({
      groupReservationId: 'group-1',
      guestName: 'Alex Guest',
    });
    expect(store.guestName()).toBe('Alex Guest');
    expect(guestSessions.getMenu).toHaveBeenCalledOnceWith(
      'session-1',
      'guest-token',
    );

    const added = await store.addDish({
      dishId: 'dish-1',
      title: 'Spring Salad',
      price: 12,
    });
    expect(added).toBeTrue();
    expect(guestSessions.addDish).toHaveBeenCalledOnceWith(
      'session-1',
      'guest-token',
      'dish-1',
      1,
    );
    expect(store.cartItems()).toEqual([{
      dishId: 'dish-1',
      title: 'Spring Salad',
      price: 12,
      qty: 1,
    }]);

    await store.submitPreorder();
    expect(guestSessions.submit).toHaveBeenCalledOnceWith(
      'session-1',
      'guest-token',
    );
    expect(store.status()).toBe('submitted');
  });

  it('keeps the name form available when session creation fails', async () => {
    guestSessions.createSession.and.returnValue(
      throwError(() => new Error('Request failed')),
    );

    await store.join('Alex Guest');

    expect(store.guestName()).toBe('');
    expect(store.guestSessionId()).toBeNull();
    expect(store.joinError()).toBe('Failed to join session');
  });
});
