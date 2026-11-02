import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CardReservationComponent } from './card-reservation.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { ReservationCustomer, ReservationStatusCustomer } from '@app/models/reservations/reservation.model';
import { Router } from '@angular/router';

const RESERVATION: ReservationCustomer = {
  id: 'res-1',
  tableId: 'table-1',
  startTime: new Date('2026-10-21T16:00:00Z'),
  endTime: new Date('2026-10-21T17:30:00Z'),
  guestCount: 2,
  status: ReservationStatusCustomer.Reserved,
  restaurantName: 'Green & Tasty',
  locationAddress: 'Rustaveli Avenue 48',
  waiterId: 'waiter-1',
};

describe('CardReservationComponent', () => {
  let component: CardReservationComponent;
  let fixture: ComponentFixture<CardReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: API_BASE_URL, useValue: 'https://test.api' }, provideRouter([])],
      imports: [CardReservationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardReservationComponent);
    component = fixture.componentInstance;
    // r — обов'язковий input: без нього компонент падає з NG0950
    fixture.componentRef.setInput('r', RESERVATION);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows separate My Pre-Order and Group Pre-Order actions for group reservations', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.some((button) => button.textContent?.trim() === 'My Pre-Order')).toBeTrue();
    expect(buttons.some((button) => button.textContent?.trim() === 'Group Pre-Order')).toBeTrue();

    buttons.find((button) => button.textContent?.trim() === 'My Pre-Order')?.click();
    expect(router.navigate).toHaveBeenCalledWith(['/menu'], {
      queryParams: jasmine.objectContaining({
        preOrder: 'true',
        reservationId: 'res-1',
      }),
    });

    buttons.find((button) => button.textContent?.trim() === 'Group Pre-Order')?.click();

    expect(router.navigate).toHaveBeenCalledWith([
      '/reservations',
      'res-1',
      'group-order',
    ]);
  });

  it('keeps individual pre-order navigation for single-guest reservations', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.componentRef.setInput('r', { ...RESERVATION, guestCount: 1 });
    fixture.detectChanges();

    const button = [...fixture.nativeElement.querySelectorAll('button')]
      .find((element: HTMLButtonElement) => element.textContent?.trim() === 'Pre-order') as HTMLButtonElement;
    button.click();
    expect([...fixture.nativeElement.querySelectorAll('button')]
      .some((element: HTMLButtonElement) => element.textContent?.trim() === 'Group Pre-Order')).toBeFalse();

    expect(router.navigate).toHaveBeenCalledWith(['/menu'], {
      queryParams: jasmine.objectContaining({
        preOrder: 'true',
        reservationId: 'res-1',
      }),
    });
  });
});
