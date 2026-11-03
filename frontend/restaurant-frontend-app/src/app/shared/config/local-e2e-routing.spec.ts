import { environment } from '../../../environments/environment';
import {
  apiUrlForGuestSession,
  apiUrlForGroup,
  apiUrlForInvite,
  apiUrlForReservation,
  LOCAL_E2E_API_URL,
  rememberLocalE2ESession,
} from './local-e2e-routing';

const AWS = 'https://aws.example.test/develop';

describe('isolated development API routing', () => {
  const original = environment.localE2E;
  beforeEach(() => {
    environment.localE2E = true;
    sessionStorage.removeItem('local-e2e-guest-session-ids');
  });
  afterEach(() => {
    environment.localE2E = original;
    sessionStorage.removeItem('local-e2e-guest-session-ids');
  });

  it('routes ONLY the reserved reservation, group and invite to localhost', () => {
    expect(apiUrlForReservation(AWS, 'local-reservation')).toBe(LOCAL_E2E_API_URL);
    expect(apiUrlForGroup(AWS, 'local-group')).toBe(LOCAL_E2E_API_URL);
    expect(apiUrlForInvite(AWS, 'local-invite')).toBe(LOCAL_E2E_API_URL);
    expect(apiUrlForReservation(AWS, 'real-reservation')).toBe(AWS);
    expect(apiUrlForGroup(AWS, 'real-group')).toBe(AWS);
    expect(apiUrlForInvite(AWS, 'real-invite')).toBe(AWS);
    expect(apiUrlForReservation(AWS, 'demo-reservation')).toBe(AWS);
  });

  it('remembers ONLY expressly registered local guest session IDs', () => {
    rememberLocalE2ESession('session-local-1');
    expect(apiUrlForGuestSession(AWS, 'session-local-1')).toBe(LOCAL_E2E_API_URL);
    expect(apiUrlForGuestSession(AWS, 'session-aws-2')).toBe(AWS);
  });

  it('sends everything to AWS when local E2E is disabled (production)', () => {
    rememberLocalE2ESession('session-local-1');
    environment.localE2E = false;
    expect(apiUrlForReservation(AWS, 'local-reservation')).toBe(AWS);
    expect(apiUrlForGroup(AWS, 'local-group')).toBe(AWS);
    expect(apiUrlForInvite(AWS, 'local-invite')).toBe(AWS);
    expect(apiUrlForGuestSession(AWS, 'session-local-1')).toBe(AWS);
  });
});
