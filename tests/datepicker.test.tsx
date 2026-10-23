import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  DatePicker,
  DateRangePicker,
  DateField,
  RangeCalendar,
  Label,
  formatDisplayDate,
  formatISODate,
  parseISODate,
} from '@/components/ui/DatePicker';

describe('DatePicker Utilities', () => {
  it('parses and formats ISO dates accurately', () => {
    const parsed = parseISODate('2026-10-23');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(9); // 0-indexed: October is 9
    expect(parsed?.getDate()).toBe(23);

    expect(formatISODate(parsed)).toBe('2026-10-23');
    expect(formatDisplayDate('2026-10-23')).toBe('Oct 23, 2026');
  });
});

describe('DatePicker Component', () => {
  it('renders single date picker with label and formatted value', () => {
    const handleChange = vi.fn();
    render(
      <DatePicker
        label="Activity Date"
        value="2026-10-23"
        onChange={handleChange}
      />
    );

    expect(screen.getByText('Activity Date')).toBeInTheDocument();
    expect(screen.getByText('Oct 23, 2026')).toBeInTheDocument();
  });
});

describe('DateRangePicker Component', () => {
  it('renders date range picker with start and end dates', () => {
    const handleRangeChange = vi.fn();
    render(
      <DateRangePicker
        label="Project Duration"
        startDate="2026-01-01"
        endDate="2026-12-31"
        onRangeChange={handleRangeChange}
      />
    );

    expect(screen.getByText('Project Duration')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('Dec 31, 2026')).toBeInTheDocument();
  });
});

describe('HeroUI Composable Style API', () => {
  it('renders composable DateRangePicker without errors', () => {
    render(
      <DateRangePicker className="w-80" endName="checkout" startName="checkin">
        <Label>Stay dates</Label>
        <DateField.Group fullWidth variant="secondary">
          <DateField.Input slot="start">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateRangePicker.RangeSeparator />
          <DateField.Input slot="end">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateField.Suffix>
            <DateRangePicker.Trigger>
              <DateRangePicker.TriggerIndicator />
            </DateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DateRangePicker.Popover>
          <RangeCalendar aria-label="Stay dates">
            <RangeCalendar.Header>
              <RangeCalendar.Heading />
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </RangeCalendar>
        </DateRangePicker.Popover>
      </DateRangePicker>
    );

    expect(screen.getByText('Stay dates')).toBeInTheDocument();
  });
});
