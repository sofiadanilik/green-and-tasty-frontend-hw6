import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { CustomButtonComponent } from '@app/shared/custom-components/custom-button/custom-button.component';
import { GuestCartItem } from '../../state/guest-preorder.store';

@Component({
    standalone: true,
    selector: 'app-guest-preorder-submitted',
    templateUrl: './guest-preorder-submitted.component.html',
    styleUrl: './guest-preorder-submitted.component.scss',
    imports: [CurrencyPipe, DatePipe, CustomButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestPreorderSubmittedComponent {
    private readonly reservationDateFormatter =
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'Europe/Kyiv',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        });

    private readonly reservationTimeFormatter =
        new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Kyiv',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        });

    formatReservationDate(value: string | Date): string {
        return this.reservationDateFormatter.format(new Date(value));
    }

    formatReservationTime(value: string | Date): string {
        return this.reservationTimeFormatter.format(new Date(value));
    }

    readonly invite = input<GuestInvite | null>(null);
    readonly guestName = input('');
    readonly items = input<GuestCartItem[]>([]);
    readonly total = input(0);

    readonly createNew = output<void>();
}