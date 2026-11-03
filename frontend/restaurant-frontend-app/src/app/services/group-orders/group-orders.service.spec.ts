// Рівень 2 · сервіс GroupOrdersService: URL, метод, тіло кожного запиту.
// Запуск: npm run test:hw
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { GroupOrdersService } from './group-orders.service';

const BASE_URL = 'https://api.test';

describe('Рівень 2 · GroupOrdersService', () => {
  let service: GroupOrdersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE_URL }],
    });
    service = TestBed.inject(GroupOrdersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getOwnerGroup$: uses the authenticated Owner endpoint, not guest invite lookup', () => {
    let groupId = '';
    service.getOwnerGroup$('res-1').subscribe((invite) => (groupId = invite.GroupReservationId));

    const request = http.expectOne(`${BASE_URL}/reservations/res-1/group-order`);
    expect(request.request.method).toBe('GET');
    request.flush({ GroupReservationId: 'grp-1' });
    http.expectNone(`${BASE_URL}/reservations/res-1/invite-token`);
    http.expectNone(`${BASE_URL}/guest/invites/tok`);
    expect(groupId).toBe('grp-1');
  });

  it('getOwnerPreOrder$: loads the Owner cart from the existing order endpoint', () => {
    let orderId = '';
    service.getOwnerPreOrder$('res-1').subscribe((order) => (orderId = order.orderId));

    const request = http.expectOne(`${BASE_URL}/orders/res-1`);
    expect(request.request.method).toBe('GET');
    request.flush({ orderId: 'order-1', reservationId: 'res-1', orderItems: [] });
    expect(orderId).toBe('order-1');
  });

  it('treats a missing personal Owner cart (404) as empty, not as a missing group', () => {
    let itemCount = -1;
    service.getOwnerPreOrder$('res-1').subscribe((order) => itemCount = order.orderItems.length);
    http.expectOne(`${BASE_URL}/orders/res-1`)
      .flush({ error: 'no personal cart' }, { status: 404, statusText: 'Not Found' });
    expect(itemCount).toBe(0);
  });

  it('getSessions$: GET /guest/groups/{id}/sessions', () => {
    let response: unknown;
    service.getSessions$('grp-1').subscribe((value) => (response = value));
    const req = http.expectOne(`${BASE_URL}/guest/groups/grp-1/sessions`);
    expect(req.request.method).toBe('GET');
    req.flush({
      participants: [{
        id: 'session-1',
        type: 'Guest',
        name: 'Olena',
        items: [{ dish: { id: 'dish-1', name: 'Spring Salad', price: 12 }, quantity: 2 }],
        total: 24,
        isSubmitted: true,
      }],
      total: 24,
    });
    expect(response).toEqual({
      participants: [{
        id: 'session-1',
        type: 'Guest',
        name: 'Olena',
        items: [{ dish: { id: 'dish-1', name: 'Spring Salad', price: 12 }, quantity: 2 }],
        total: 24,
        isSubmitted: true,
      }],
      total: 24,
    });
  });

  it('getOwnerSessionId$: повертає рядок guestSessionId', () => {
    let id = '';
    service.getOwnerSessionId$('res-1').subscribe((value) => (id = value));
    const req = http.expectOne(`${BASE_URL}/reservations/res-1/guest-session-id`);
    expect(req.request.method).toBe('GET');
    req.flush({ guestSessionId: 'owner-1' });
    expect(id).toBe('owner-1');
  });

  it('getStatus$: GET /guest/groups/{id}/status', () => {
    service.getStatus$('grp-1').subscribe();
    const req = http.expectOne(`${BASE_URL}/guest/groups/grp-1/status`);
    expect(req.request.method).toBe('GET');
    req.flush({ currentParticipants: 3, maxCapacity: 5, status: 'Open' });
  });

  it('submit$: POST /group-reservations/{id}/submit з тілом { reservationId }', () => {
    service.submit$('grp-1', 'res-1').subscribe();
    const req = http.expectOne(`${BASE_URL}/group-reservations/grp-1/submit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reservationId: 'res-1' });
    req.flush([]);
  });
});
