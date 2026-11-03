import {
  normalizeOwnerGroup,
  normalizeSessions,
  normalizeOwnerOrder,
  normalizeOwnerSessionId,
  normalizeGroupStatus,
  normalizeSubmission,
} from './owner-api-normalizers';

describe('LocalE2E Owner DTO compatibility', () => {
  it('accepts ASP.NET camelCase group details', () => {
    const data = normalizeOwnerGroup({
      groupReservationId: 'local-group', locationAddress: '48 Rustaveli',
      maxGuestCount: 5, startTime: '2026-11-04T14:00:00Z',
    });
    expect(data.GroupReservationId).toBe('local-group');
    expect(data.LocationAddress).toBe('48 Rustaveli');
    expect(data.MaxGuestCount).toBe(5);
  });

  it('normalizes PascalCase .NET participant names, items, amounts and submitted state', () => {
    const data = normalizeSessions({ Participants: [{
      Id: 'g-1', Type: 'Guest', Name: 'Nania', IsSubmitted: true,
      Items: [{ Dish: { Id: 'local-bowl', Name: 'Green Bowl', Price: 18 }, Quantity: 2 }],
      Total: 36,
    }], Total: 36 });
    expect(data.participants[0].name).toBe('Nania');
    expect(data.participants[0].items[0].dish.id).toBe('local-bowl');
    expect(data.participants[0].items[0].quantity).toBe(2);
    expect(data.participants[0].isSubmitted).toBeTrue();
    expect(data.participants[0].total).toBe(36);
  });

  it('reads owner ID, empty cart and status in either naming style', () => {
    expect(normalizeOwnerSessionId({ GuestSessionId: 'owner-1' })).toBe('owner-1');
    expect(normalizeOwnerSessionId({ guestSessionId: 'owner-2' })).toBe('owner-2');
    expect(normalizeOwnerOrder({ OrderItems: [], Status: 0 }).orderItems).toEqual([]);
    expect(normalizeGroupStatus({ Status: 'Open' }).status).toBe('Open');
  });

  it('accepts either casing for consolidated submit items', () => {
    expect(normalizeSubmission([{ DishId: 'local-salad', Quantity: 2 }]))
      .toEqual([{ dishId: 'local-salad', quantity: 2 }]);
  });
});
