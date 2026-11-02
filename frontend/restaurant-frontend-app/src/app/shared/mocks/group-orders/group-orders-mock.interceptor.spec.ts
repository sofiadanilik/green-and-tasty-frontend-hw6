import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Order } from '@app/models/orders/order.model';
import { DEMO_RESERVATION_ID } from './group-orders.mock-store';
import {
  groupOrdersMockInterceptor,
  groupOrdersMockStore,
} from './group-orders-mock.interceptor';

describe('groupOrdersMockInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    groupOrdersMockStore.reset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([groupOrdersMockInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('mocks the demo Owner order from the group-order store', fakeAsync(() => {
    let order: Order | undefined;
    http
      .get<Order>(`https://test.api/orders/${DEMO_RESERVATION_ID}`)
      .subscribe((response) => (order = response));

    tick(400);

    expect(order?.reservationId).toBe(DEMO_RESERVATION_ID);
    expect(order?.orderItems.map(({ dish }) => dish.name)).toEqual([
      'Spring Salad',
      'Avocado Pine Nut Bowl',
    ]);
    httpMock.expectNone(`https://test.api/orders/${DEMO_RESERVATION_ID}`);
  }));

  it('forwards orders for non-demo reservations to the API', () => {
    const url = 'https://test.api/orders/reservation-1';
    http.get(url).subscribe();

    const request = httpMock.expectOne(url);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });
});
