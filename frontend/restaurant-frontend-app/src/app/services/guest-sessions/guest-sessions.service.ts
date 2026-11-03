import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import {
    apiUrlForGroup,
    apiUrlForGuestSession,
    LOCAL_E2E_GROUP_ID,
    rememberLocalE2ESession,
} from '@app/shared/config/local-e2e-routing';
import { map, tap } from 'rxjs';

export interface CreateGuestSessionRequest {
    groupReservationId: string;
    guestName: string;
}

export interface CreateGuestSessionResponse {
    SessionId: string;
    SessionToken: string;
}

/** The local ASP.NET JSON serializer may emit camelCase, unlike the AWS DTO. */
interface SessionCreationWireResponse extends Partial<CreateGuestSessionResponse> {
    sessionId?: string;
    sessionToken?: string;
}

export interface GuestMenuDish {
    id: string;
    name: string;
    description: string;
    price: number;
    weight?: string;
    calories?: string;
    proteins?: string;
    fats?: string;
    carbohydrates?: string;
    vitamins?: string;
    imageUrl?: string | null;
    state: string;        // "Available" | "On Stop"
    selectable: boolean;  // true/false
}

export type GuestMenuCategoryKey = string;

export interface GuestMenuResponse {
    dishes: Record<GuestMenuCategoryKey, GuestMenuDish[]>;
}

@Injectable({ providedIn: 'root' })
export class GuestSessionsService {
    private readonly baseUrl = inject(API_BASE_URL);
    private readonly http = inject(HttpClient);

    createSession(body: CreateGuestSessionRequest) {
        const baseUrl = apiUrlForGroup(this.baseUrl, body.groupReservationId);
        return this.http.post<SessionCreationWireResponse>(`${baseUrl}/guest/sessions`, body).pipe(
            map((response): CreateGuestSessionResponse => {
                const SessionId = response.SessionId ?? response.sessionId;
                const SessionToken = response.SessionToken ?? response.sessionToken;
                if (!SessionId || !SessionToken) {
                    throw new Error('Guest session response does not include an ID and token');
                }
                return { SessionId, SessionToken };
            }),
            tap((response) => {
                if (body.groupReservationId === LOCAL_E2E_GROUP_ID) {
                    rememberLocalE2ESession(response.SessionId);
                }
            })
        );
    }

    getMenu(guestSessionId: string, sessionToken: string) {
        const baseUrl = apiUrlForGuestSession(this.baseUrl, guestSessionId);
        return this.http.get<GuestMenuResponse>(
            `${baseUrl}/guest/sessions/${guestSessionId}/menu`,
            { headers: this.authHeaders(sessionToken) }
        );
    }

    addDish(guestSessionId: string, sessionToken: string, dishId: string, quantity: number) {
        const baseUrl = apiUrlForGuestSession(this.baseUrl, guestSessionId);
        return this.http.post(
            `${baseUrl}/guest/sessions/${guestSessionId}/dishes`,
            { dishId, quantity },
            { headers: this.authHeaders(sessionToken) }
        );
    }

    removeDish(guestSessionId: string, sessionToken: string, dishId: string, quantity: number) {
        const baseUrl = apiUrlForGuestSession(this.baseUrl, guestSessionId);
        return this.http.request(
            'delete',
            `${baseUrl}/guest/sessions/${guestSessionId}/dishes`,
            { body: { dishId, quantity }, headers: this.authHeaders(sessionToken) }
        );
    }

    submit(guestSessionId: string, sessionToken: string) {
        const baseUrl = apiUrlForGuestSession(this.baseUrl, guestSessionId);
        return this.http.post(
            `${baseUrl}/guest/sessions/${guestSessionId}/submit`,
            {},
            { headers: this.authHeaders(sessionToken) }
        );
    }

    private authHeaders(token: string) {
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
}