import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { ToastService } from '@app/services/toast/toast.service';
import { GroupOrderPageComponent } from './group-order-page.component';

describe('HW6 bonus Â· Remove Guest in Owner UI', () => {
  let service: jasmine.SpyObj<GroupOrdersService>;

  function render(status: 'Open' | 'Submitted' = 'Open') {
    service.getStatus$.and.returnValue(of({ status, currentParticipants: 2, maxCapacity: 5 }));
    TestBed.configureTestingModule({
      imports: [GroupOrderPageComponent],
      providers: [
        { provide: GroupOrdersService, useValue: service },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error', 'info']) },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ reservationId: 'res-1' }) } } },
      ],
    });
    const fixture = TestBed.createComponent(GroupOrderPageComponent);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    service = jasmine.createSpyObj<GroupOrdersService>('GroupOrdersService', [
      'getOwnerGroup$', 'getOwnerPreOrder$', 'getSessions$', 'getOwnerSessionId$', 'getStatus$',
      'submit$', 'removeSession$',
    ]);
    service.getOwnerGroup$.and.returnValue(of({
      GroupReservationId: 'group-1', LocationAddress: 'Rustaveli Avenue 48', MaxGuestCount: 5,
      LocationId: 'loc-1', RestaurantName: 'Green & Tasty', TableNumber: 1, InviterName: 'Owner',
      StartTime: '2026-11-10T12:00:00Z', EndTime: '2026-11-10T14:00:00Z',
    }));
    service.getOwnerPreOrder$.and.returnValue(of({
      orderId: 'order-1', reservationId: 'res-1', reservationAddress: '', reservationTime: '', status: 0,
      orderItems: [],
    }));
    service.getSessions$.and.returnValue(of({
      participants: [
        { id: 'owner', type: 'Owner', name: 'Owner', isSubmitted: false, total: 0, items: [] },
        { id: 'guest-1', type: 'Guest', name: 'Nania', isSubmitted: true, total: 25,
          items: [{ dish: { id: 'salad', name: 'Spring Salad', price: 12.5 }, quantity: 2 }] },
      ], total: 25,
    }));
    service.getOwnerSessionId$.and.returnValue(of('owner'));
    service.removeSession$.and.returnValue(of({
      participants: [{ id: 'owner', type: 'Owner', name: 'Owner', isSubmitted: false, total: 0, items: [] }],
      total: 0,
    }));
  });

  it('shows Remove Nania, confirms once, and updates the total from backend snapshot', () => {
    const { fixture, root } = render();
    expect(root.querySelector('[aria-label="Remove Owner"]')).toBeNull();
    const remove = root.querySelector<HTMLButtonElement>('[aria-label="Remove Nania"]');
    expect(remove).not.toBeNull();
    remove!.click(); fixture.detectChanges();
    expect(root.textContent).toContain('This action cannot be undone');
    root.querySelector<HTMLButtonElement>('.dialog-remove')!.click(); fixture.detectChanges();
    expect(service.removeSession$).toHaveBeenCalledOnceWith('group-1', 'guest-1');
    expect(root.textContent).not.toContain('Guest: Nania');
    expect(root.textContent).toContain('$0.00');
  });

  it('does not render Remove Guest after group submission', () => {
    const { root } = render('Submitted');
    expect(root.querySelector('.remove-guest-button')).toBeNull();
  });
});
