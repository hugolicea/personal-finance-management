import {
    differenceInDays,
    format,
    isValid,
    parseISO,
    startOfMonth,
    startOfWeek,
} from 'date-fns';

export type AggregationLevel = 'daily' | 'weekly' | 'monthly';

type AggregatedPoint = {
    date: string;
    value: number;
    count: number;
};

export const getAggregationLevel = (
    startDate: Date,
    endDate: Date
): AggregationLevel => {
    const [minDate, maxDate] =
        startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const daysDiff = differenceInDays(maxDate, minDate);

    if (daysDiff <= 90) return 'daily';
    if (daysDiff <= 365) return 'weekly';
    return 'monthly';
};

const getPeriodStart = (date: Date, level: AggregationLevel): Date => {
    switch (level) {
        case 'daily':
            return date;
        case 'weekly':
            return startOfWeek(date, { weekStartsOn: 1 });
        case 'monthly':
            return startOfMonth(date);
    }
};

export const aggregateData = <T extends { date: string; value: number }>(
    data: T[],
    level: AggregationLevel
): AggregatedPoint[] => {
    const grouped = new Map<string, AggregatedPoint>();

    for (const point of data) {
        const parsedDate = parseISO(point.date);
        if (!isValid(parsedDate) || Number.isNaN(point.value)) {
            continue;
        }

        const periodStart = getPeriodStart(parsedDate, level);
        const key = format(periodStart, 'yyyy-MM-dd');
        const existing = grouped.get(key);

        if (existing) {
            existing.value += point.value;
            existing.count += 1;
            continue;
        }

        grouped.set(key, {
            date: key,
            value: point.value,
            count: 1,
        });
    }

    return Array.from(grouped.values()).sort(
        (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );
};

export const formatDateLabel = (
    date: string,
    level: AggregationLevel
): string => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
        return date;
    }

    switch (level) {
        case 'daily':
            return format(parsedDate, 'MMM d');
        case 'weekly':
            return format(parsedDate, 'MMM d, yyyy');
        case 'monthly':
            return format(parsedDate, 'MMM yyyy');
    }
};
