import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthGuard } from './auth.guard';
import { groupOwnerGuard } from './group-owner.guard';

describe('groupOwnerGuard', () => {
  const previous = environment.localE2E;
  const auth = jasmine.createSpyObj<AuthGuard>('AuthGuard', ['canActivate']);
  beforeEach(() => {
    auth.canActivate.calls.reset();
    auth.canActivate.and.returnValue(of(true));
    TestBed.configureTestingModule({ providers: [{ provide: AuthGuard, useValue: auth }] });
    environment.localE2E = true;
  });
  afterEach(() => { environment.localE2E = previous; });
  const run = (id: string) => TestBed.runInInjectionContext(() =>
    groupOwnerGuard({ paramMap: convertToParamMap({ reservationId: id }) } as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot));

  it('opens only local-reservation without Cognito in local development', () => {
    expect(run('local-reservation')).toBeTrue();
    expect(auth.canActivate).not.toHaveBeenCalled();
    run('real-reservation');
    expect(auth.canActivate).toHaveBeenCalledTimes(1);
  });

  it('keeps production auth enabled even for local-reservation ID', () => {
    environment.localE2E = false;
    run('local-reservation');
    expect(auth.canActivate).toHaveBeenCalledTimes(1);
  });
});
