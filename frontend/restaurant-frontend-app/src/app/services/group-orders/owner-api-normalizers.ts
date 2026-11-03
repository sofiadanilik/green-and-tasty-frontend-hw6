/**
 * The published Lambda DTOs and the local ASP.NET host can use different JSON
 * naming policies. Normalize at the HTTP boundary, not inside Owner templates.
 */
import type { Participant, ParticipantItem, DishShort } from '@app/models/group-orders/participant.model';
import type { Order } from '@app/models/orders/order.model';
import type { GroupReservationDetails } from '@app/models/reservations/guest-invite.model';
import type { GroupSessions, GroupStatus, ConsolidatedDish } from './group-orders.service';

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function field(value: unknown, name: string): unknown {
  const data = object(value);
  return data[name] ?? data[name.charAt(0).toLowerCase() + name.slice(1)];
}

function string(value: unknown, defaultValue = ''): string {
  return typeof value === 'string' ? value : defaultValue;
}

function number(value: unknown): number {
  const converted = Number(value ?? 0);
  return Number.isFinite(converted) ? converted : 0;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function dish(value: unknown): DishShort {
  const imageUrl = string(field(value, 'ImageUrl')) || undefined;
  const weight = string(field(value, 'Weight')) || undefined;
  return {
    id: string(field(value, 'Id')),
    name: string(field(value, 'Name')),
    price: number(field(value, 'Price')),
    ...(imageUrl ? { imageUrl } : {}),
    ...(weight ? { weight } : {}),
  };
}

function item(value: unknown): ParticipantItem {
  return { dish: dish(field(value, 'Dish')), quantity: number(field(value, 'Quantity')) };
}

export function normalizeOwnerGroup(value: unknown): GroupReservationDetails {
  const id = string(field(value, 'GroupReservationId'));
  if (!id) throw new Error('Owner API response is missing GroupReservationId');
  return {
    GroupReservationId: id,
    LocationId: string(field(value, 'LocationId')),
    RestaurantName: string(field(value, 'RestaurantName')),
    LocationAddress: string(field(value, 'LocationAddress')),
    StartTime: string(field(value, 'StartTime')),
    EndTime: string(field(value, 'EndTime')),
    MaxGuestCount: number(field(value, 'MaxGuestCount')),
    TableNumber: number(field(value, 'TableNumber')),
    InviterName: string(field(value, 'InviterName')),
  };
}

export function normalizeSessions(value: unknown): GroupSessions {
  const participants = array(field(value, 'Participants')).map((raw): Participant => {
    const rawType = string(field(raw, 'Type'));
    return {
      id: string(field(raw, 'Id')),
      type: rawType.toLowerCase() === 'owner' ? 'Owner' : 'Guest',
      name: string(field(raw, 'Name')),
      items: array(field(raw, 'Items')).map(item),
      total: number(field(raw, 'Total')),
      isSubmitted: field(raw, 'IsSubmitted') === true,
    };
  });
  return { participants, total: number(field(value, 'Total')) };
}

export function normalizeOwnerOrder(value: unknown): Order {
  return {
    orderId: string(field(value, 'OrderId')),
    reservationId: string(field(value, 'ReservationId')),
    reservationAddress: string(field(value, 'ReservationAddress')),
    reservationTime: string(field(value, 'ReservationTime')),
    status: number(field(value, 'Status')),
    orderItems: array(field(value, 'OrderItems')).map((raw) => {
      const rawDish = field(raw, 'Dish');
      const basic = dish(rawDish);
      return {
        dish: {
          id: basic.id,
          name: basic.name,
          price: basic.price,
          imageUrl: basic.imageUrl ?? '',
          weight: basic.weight ?? '',
          state: string(field(rawDish, 'State'), 'Available'),
          dishType: string(field(rawDish, 'DishType')),
          description: string(field(rawDish, 'Description')),
          calories: string(field(rawDish, 'Calories')),
          proteins: string(field(rawDish, 'Proteins')),
          carbohydrates: string(field(rawDish, 'Carbohydrates')),
          fats: string(field(rawDish, 'Fats')),
          vitamins: string(field(rawDish, 'Vitamins')),
        },
        quantity: number(field(raw, 'Quantity')),
        state: number(field(raw, 'State')),
      };
    }),
  };
}

export function normalizeOwnerSessionId(value: unknown): string {
  const id = typeof value === 'string' ? value : string(field(value, 'GuestSessionId'));
  if (!id) throw new Error('Owner API response is missing guestSessionId');
  return id;
}

export function normalizeGroupStatus(value: unknown): GroupStatus {
  const raw = field(value, 'Status');
  const status = string(raw);
  if (!status) throw new Error('Group API response is missing status');
  return {
    currentParticipants: number(field(value, 'CurrentParticipants')),
    maxCapacity: number(field(value, 'MaxCapacity')),
    status,
  };
}

export function normalizeSubmission(value: unknown): ConsolidatedDish[] {
  const list = Array.isArray(value) ? value : array(field(value, 'Items'));
  return list.map((entry) => ({
    dishId: string(field(entry, 'DishId')),
    quantity: number(field(entry, 'Quantity')),
  }));
}
