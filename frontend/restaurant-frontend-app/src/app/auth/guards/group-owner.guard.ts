import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LOCAL_E2E_RESERVATION_ID } from '@app/shared/config/local-e2e-routing';
import { AuthGuard } from './auth.guard';

/** Only the explicit local test reservation is accessible without a Cognito login. */
export const groupOwnerGuard: CanActivateFn = (route) => {
  if (environment.localE2E && route.paramMap.get('reservationId') === LOCAL_E2E_RESERVATION_ID) {
    return true;
  }
  return inject(AuthGuard).canActivate(route);
};
