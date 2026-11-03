import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { GuestSessionsService } from './guest-sessions.service';

const BASE_URL = 'https://api.test';

describe('GuestSessionsService', () => {
  let service: GuestSessionsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });

    service = TestBed.inject(GuestSessionsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a guest session with the entered name and invite group id', () => {
    service.createSession({
      groupReservationId: 'group-1',
      guestName: 'Alex Guest',
    }).subscribe();

    const request = http.expectOne(`${BASE_URL}/guest/sessions`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      groupReservationId: 'group-1',
      guestName: 'Alex Guest',
    });
    request.flush({ SessionId: 'session-1', SessionToken: 'guest-token' });
  });

  it('accepts camelCase guest session IDs from local ASP.NET JSON', () => {
    let id = '';
    service.createSession({ groupReservationId: 'group-1', guestName: 'Marta' })
      .subscribe((response) => id = response.SessionId);
    http.expectOne(`${BASE_URL}/guest/sessions`)
      .flush({ sessionId: 'local-guest-1', sessionToken: 'local-token' });
    expect(id).toBe('local-guest-1');
  });

  it('writes selected dish quantities with the guest session token', () => {
    service.addDish('session-1', 'guest-token', 'dish-1', 2).subscribe();

    const request = http.expectOne(`${BASE_URL}/guest/sessions/session-1/dishes`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer guest-token');
    expect(request.request.body).toEqual({ dishId: 'dish-1', quantity: 2 });
    request.flush({});
  });

  it('submits the personal pre-order with the same guest session token', () => {
    service.submit('session-1', 'guest-token').subscribe();

    const request = http.expectOne(`${BASE_URL}/guest/sessions/session-1/submit`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer guest-token');
    expect(request.request.body).toEqual({});
    request.flush({});
  });
});
