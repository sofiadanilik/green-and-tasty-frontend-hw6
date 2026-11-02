
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';

import { Participant } from '@app/models/group-orders/participant.model';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';

import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { HttpContext } from '@angular/common/http';
import { SKIP_ERROR_TOAST } from '@app/auth/skip-error-toast.context';

interface InviteTokenResponse {
  token: string;
}

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

  // 1. Отримати запрошення за reservationId

getGroupInvite$(reservationId: string): Observable<GuestInvite> {
  return this.http
    .get<InviteTokenResponse>(
      `${this.baseUrl}/reservations/${reservationId}/invite-token`
    )
    .pipe(
      switchMap((response) =>
        this.http.get<GuestInvite>(
          `${this.baseUrl}/guest/invites/${response.token}`
        )
      )
    );
}


  // 2. Отримати учасників, страви та загальну суму
  getSessions$(
  groupReservationId: string,
  options?: { silent?: boolean }
): Observable<GroupSessions> {
   return this.http.get<GroupSessions>(
  `${this.baseUrl}/guest/groups/${groupReservationId}/sessions`,
  {
    context: new HttpContext().set(
      SKIP_ERROR_TOAST,
      options?.silent === true
    ),
  }
);
}

  // 3. Отримати ID власної сесії Owner
  getOwnerSessionId$(reservationId: string): Observable<string> {
    return this.http
      .get<{ guestSessionId: string }>(
        `${this.baseUrl}/reservations/${reservationId}/guest-session-id`
      )
      .pipe(map((response) => response.guestSessionId));
  }

  // 4. Отримати статус групового замовлення
  getStatus$(
  groupReservationId: string,
  options?: { silent?: boolean }
): Observable<GroupStatus> {
    return this.http.get<GroupStatus>(
  `${this.baseUrl}/guest/groups/${groupReservationId}/status`,
  {
    context: new HttpContext().set(
      SKIP_ERROR_TOAST,
      options?.silent === true
    ),
  }
);
}

  // 5. Підтвердити спільне замовлення
  submit$(
    groupReservationId: string,
    reservationId: string
  ): Observable<ConsolidatedDish[]> {
    return this.http.post<ConsolidatedDish[]>(
      `${this.baseUrl}/group-reservations/${groupReservationId}/submit`,
      { reservationId }
    );
  }
}
