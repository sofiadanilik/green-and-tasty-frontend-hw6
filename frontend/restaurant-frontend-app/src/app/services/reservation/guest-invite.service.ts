import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GroupInviteToken, GuestInvite } from '@app/models/reservations/guest-invite.model';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { apiUrlForInvite, apiUrlForReservation } from '@app/shared/config/local-e2e-routing';

@Injectable({
  providedIn: 'root',
})
export class GuestInviteService {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly http = inject(HttpClient);

  getInviteToken$(reservationId: string): Observable<GroupInviteToken> {
    return this.http.get<GroupInviteToken>(
      `${apiUrlForReservation(this.baseUrl, reservationId)}/reservations/${encodeURIComponent(reservationId)}/invite-token`,
    );
  }

  getInvite$(token: string): Observable<GuestInvite> {
    return this.http.get<GuestInvite>(
      `${apiUrlForInvite(this.baseUrl, token)}/guest/invites/${encodeURIComponent(token)}`
    );
  }
}
