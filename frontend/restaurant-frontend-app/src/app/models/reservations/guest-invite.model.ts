export interface GroupReservationDetails {
  GroupReservationId: string;
  LocationId: string;
  RestaurantName: string;
  LocationAddress: string;
  StartTime: string;
  EndTime: string;
  MaxGuestCount: number;
  TableNumber: number;
  InviterName: string;
}

export type GuestInvite = GroupReservationDetails;

export interface GroupInviteToken {
  token: string;
}
