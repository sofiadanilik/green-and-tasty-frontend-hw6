import { environment } from '../../../environments/environment';

export const LOCAL_E2E_API_URL = 'http://127.0.0.1:5278';
export const LOCAL_E2E_RESERVATION_ID = 'local-reservation';
export const LOCAL_E2E_GROUP_ID = 'local-group';
export const LOCAL_E2E_INVITE_TOKEN = 'local-invite';

const LOCAL_E2E_SESSION_IDS_KEY = 'local-e2e-guest-session-ids';

export function apiUrlForReservation(apiUrl: string, reservationId: string): string {
  return environment.localE2E && reservationId === LOCAL_E2E_RESERVATION_ID
    ? LOCAL_E2E_API_URL
    : apiUrl.replace(/\/$/, '');
}

export function apiUrlForGroup(apiUrl: string, groupId: string): string {
  return environment.localE2E && groupId === LOCAL_E2E_GROUP_ID
    ? LOCAL_E2E_API_URL
    : apiUrl.replace(/\/$/, '');
}

export function apiUrlForInvite(apiUrl: string, inviteToken: string): string {
  return environment.localE2E && inviteToken === LOCAL_E2E_INVITE_TOKEN
    ? LOCAL_E2E_API_URL
    : apiUrl.replace(/\/$/, '');
}

export function rememberLocalE2ESession(sessionId: string): void {
  const sessionIds = readLocalE2ESessionIds();
  if (!sessionIds.includes(sessionId)) {
    sessionIds.push(sessionId);
    sessionStorage.setItem(LOCAL_E2E_SESSION_IDS_KEY, sessionIds.join(','));
  }
}

export function apiUrlForGuestSession(apiUrl: string, sessionId: string): string {
  return environment.localE2E && readLocalE2ESessionIds().includes(sessionId)
    ? LOCAL_E2E_API_URL
    : apiUrl.replace(/\/$/, '');
}

function readLocalE2ESessionIds(): string[] {
  return (sessionStorage.getItem(LOCAL_E2E_SESSION_IDS_KEY) ?? '')
    .split(',')
    .filter(Boolean);
}

/**
 * The LocalE2E test host accepts this NON-PRODUCTION fixture token. It is not
 * a Cognito credential. Never attach it to AWS or to a different localhost port.
 */
export const LOCAL_E2E_OWNER_TOKEN =
  'eyJhbGciOiJub25lIn0.eyJzdWIiOiJsb2NhbC1vd25lciIsImV4cCI6NDEwMjQ0NDgwMH0.local-only';

/** Only the six explicit isolated local Owner routes require the test token. */
export function isLocalE2EOwnerRequest(url: string): boolean {
  if (!environment.localE2E || !url.startsWith(`${LOCAL_E2E_API_URL}/`)) {
    return false;
  }

  const path = url.slice(LOCAL_E2E_API_URL.length).split(/[?#]/, 1)[0];
  return path === `/reservations/${LOCAL_E2E_RESERVATION_ID}/group-order` ||
    path === `/reservations/${LOCAL_E2E_RESERVATION_ID}/guest-session-id` ||
    path === `/orders/${LOCAL_E2E_RESERVATION_ID}` ||
    path === `/guest/groups/${LOCAL_E2E_GROUP_ID}/sessions` ||
    path === `/guest/groups/${LOCAL_E2E_GROUP_ID}/status` ||
    path === `/group-reservations/${LOCAL_E2E_GROUP_ID}/submit`;
}
