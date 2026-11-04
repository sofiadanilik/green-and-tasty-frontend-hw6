
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { Participant } from '@app/models/group-orders/participant.model';
import { Order } from '@app/models/orders/order.model';
import { GroupReservationDetails } from '@app/models/reservations/guest-invite.model';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { apiUrlForGroup, apiUrlForReservation } from '@app/shared/config/local-e2e-routing';

import { SKIP_ERROR_TOAST } from '@app/auth/skip-error-toast.context';
import {
  normalizeOwnerGroup, normalizeOwnerOrder, normalizeSessions,
  normalizeOwnerSessionId, normalizeGroupStatus, normalizeSubmission,
} from './owner-api-normalizers';

export interface GroupInvite {
  GroupReservationId: string;
  LocationAddress?: string;
  StartTime?: string;
  EndTime?: string;
  MaxGuestCount?: number;
}

export interface GroupSessions {
  participants: Participant[];
  total: number;
}

export interface GroupStatus {
  currentParticipants: number;
  maxCapacity: number;
  status: string;
}

export interface ConsolidatedDish {
  dishId: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class GroupOrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL).replace(/\/$/, '');

  // Load group details through the authenticated Owner endpoint.
  getOwnerGroup$(reservationId: string): Observable<GroupReservationDetails> {
    return this.http.get<unknown>(
      `${apiUrlForReservation(this.baseUrl, reservationId)}/reservations/${reservationId}/group-order`
    ).pipe(map(normalizeOwnerGroup));
  }

  getOwnerPreOrder$(
    reservationId: string,
    options?: { silent?: boolean }
  ): Observable<Order> {
    return this.http.get<unknown>(
      `${apiUrlForReservation(this.baseUrl, reservationId)}/orders/${reservationId}`,
      {
        context: new HttpContext().set(
          SKIP_ERROR_TOAST,
          options?.silent === true
        ),
      }
    ).pipe(
      map(normalizeOwnerOrder),
      catchError((error: unknown) => {
        // An Owner may not have started a personal cart yet. This is not a missing group.
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of<Order>({
            orderId: '', reservationAddress: '', reservationTime: '',
            reservationId, orderItems: [], status: 0,
          });
        }
        return throwError(() => error);
      })
    );
  }


  // 2. Отримати учасників, страви та загальну суму
  getSessions$(
  groupReservationId: string,
  options?: { silent?: boolean }
): Observable<GroupSessions> {
   return this.http.get<unknown>(
  `${apiUrlForGroup(this.baseUrl, groupReservationId)}/guest/groups/${groupReservationId}/sessions`,
  {
    context: new HttpContext().set(
      SKIP_ERROR_TOAST,
      options?.silent === true
    ),
  }
).pipe(map(normalizeSessions));
}

  // 3. Отримати ID власної сесії Owner
  getOwnerSessionId$(reservationId: string): Observable<string> {
    return this.http
      .get<unknown>(
        `${apiUrlForReservation(this.baseUrl, reservationId)}/reservations/${reservationId}/guest-session-id`
      )
      .pipe(map(normalizeOwnerSessionId));
  }

  // 4. Отримати статус групового замовлення
  getStatus$(
  groupReservationId: string,
  options?: { silent?: boolean }
): Observable<GroupStatus> {
    return this.http.get<unknown>(
  `${apiUrlForGroup(this.baseUrl, groupReservationId)}/guest/groups/${groupReservationId}/status`,
  {
    context: new HttpContext().set(
      SKIP_ERROR_TOAST,
      options?.silent === true
    ),
  }
).pipe(map(normalizeGroupStatus));
}

  // HW6 bonus / HW8 Level 3: Owner removes a Guest session.
  removeSession$(groupReservationId: string, guestSessionId: string): Observable<GroupSessions> {
    return this.http.delete<unknown>(
      `${apiUrlForGroup(this.baseUrl, groupReservationId)}/guest/groups/${encodeURIComponent(groupReservationId)}/sessions/${encodeURIComponent(guestSessionId)}`
    ).pipe(map(normalizeSessions));
  }

  // 5. Підтвердити спільне замовлення
  submit$(
    groupReservationId: string,
    reservationId: string
  ): Observable<ConsolidatedDish[]> {
    return this.http.post<unknown>(
      `${apiUrlForGroup(this.baseUrl, groupReservationId)}/group-reservations/${groupReservationId}/submit`,
      { reservationId }
    ).pipe(map(normalizeSubmission));
  }
}
