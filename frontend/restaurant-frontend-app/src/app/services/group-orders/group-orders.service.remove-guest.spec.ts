import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { GroupOrdersService } from './group-orders.service';

describe('HW6 bonus · Remove Guest API', () => {
  it('sends authenticated Owner DELETE to the group session endpoint and normalizes the updated snapshot', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.test' }],
    });
    const service = TestBed.inject(GroupOrdersService);
    const http = TestBed.inject(HttpTestingController);
    let actualTotal = -1;
    service.removeSession$('group-1', 'guest-2').subscribe(snapshot => actualTotal = snapshot.total);
    const req = http.expectOne('https://api.test/guest/groups/group-1/sessions/guest-2');
    expect(req.request.method).toBe('DELETE');
    req.flush({ Participants: [], Total: 0 });
    expect(actualTotal).toBe(0);
    http.verify();
  });
});
