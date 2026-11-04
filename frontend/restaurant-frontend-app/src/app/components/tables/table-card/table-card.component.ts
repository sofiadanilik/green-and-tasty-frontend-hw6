import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  computed,
  input,
} from '@angular/core';
import { TimeSlotComponent } from '../time-slot/time-slot.component';
import { Table } from '@app/models/tables/table.model';
import { TimeRange } from '@app/models/tables/time-range.model';
import { HourSlot } from './models';

// Demo opening hours for the Tbilisi restaurant: 08:00-22:00 local time.
// The server remains authoritative for availability; this only narrows the UI.
const OPEN_MINUTES = 8 * 60;
const CLOSE_MINUTES = 22 * 60;
const RESTAURANT_TIME_ZONE = 'Asia/Tbilisi';

function tbilisiClock(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: RESTAURANT_TIME_ZONE,
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(iso));
}

function minutesOf(clock: string): number {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
}

@Component({
  selector: 'app-table-card',
  imports: [TimeSlotComponent],
  templateUrl: './table-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './table-card.component.scss',
})
export class TableCardComponent {
  readonly location = input.required<string>();
  readonly date = input.required<string>();
  readonly table = input.required<Table>();
  // @Output() showAllClicked = new EventEmitter<Table>();
  @Output() timeSlotSelected = new EventEmitter<TimeRange>();

  protected readonly hourSlots = computed<HourSlot[]>(() => this.buildHourSlots());

  onTimeSlotSelected(slot: HourSlot): void {
    if (slot.timeRange) {
      this.timeSlotSelected.emit(slot.timeRange);
    }
  }

  // onShowAllClick(): void {
  //   this.showAllClicked.emit(this.table);
  // }

  private buildHourSlots(): HourSlot[] {
    return (this.table().timeRanges ?? [])
      .filter((range) => {
        const start = Date.parse(range.start);
        const end = Date.parse(range.end);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
          return false;
        }
        const from = minutesOf(tbilisiClock(range.start));
        const to = minutesOf(tbilisiClock(range.end));
        return from >= OPEN_MINUTES && to <= CLOSE_MINUTES && to > from;
      })
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
      .map((range) => ({
        label: tbilisiClock(range.start),
        timeRange: range,
      }));
  }
}
