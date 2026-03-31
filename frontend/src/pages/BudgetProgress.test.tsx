import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import type { SpendingSummaryItem } from '../types/categories';
import BudgetProgress from './BudgetProgress';

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock('../hooks/redux', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

// fetchSpendingSummary returns a thunk; since dispatch is mocked as vi.fn()
// the thunk is captured but never executed, so no real API calls fire.
vi.mock('../store/slices/budgetProgressSlice', async (importOriginal) => {
    const actual =
        await importOriginal<
            typeof import('../store/slices/budgetProgressSlice')
        >();
    return {
        ...actual,
        fetchSpendingSummary: vi.fn(() => ({ type: 'budgetProgress/noop' })),
    };
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** 60 % used — green indicator */
const GREEN_CATEGORY: SpendingSummaryItem = {
    id: 1,
    name: 'Groceries',
    total_spent: 300,
    budget_limit: 500,
    percentage_used: 60,
};

/** 95 % used — yellow indicator */
const YELLOW_CATEGORY: SpendingSummaryItem = {
    id: 2,
    name: 'Dining Out',
    total_spent: 380,
    budget_limit: 400,
    percentage_used: 95,
};

/** 125 % used — red / over-budget */
const RED_CATEGORY: SpendingSummaryItem = {
    id: 3,
    name: 'Entertainment',
    total_spent: 250,
    budget_limit: 200,
    percentage_used: 125,
};

/** budget_limit === 0 — no budget set */
const NO_BUDGET_CATEGORY: SpendingSummaryItem = {
    id: 4,
    name: 'Miscellaneous',
    total_spent: 50,
    budget_limit: 0,
    percentage_used: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface MockBudgetProgressState {
    month: string;
    categories: SpendingSummaryItem[];
    loading: boolean;
    error: string | null;
}

const DEFAULT_STATE: MockBudgetProgressState = {
    month: '2026-03',
    categories: [],
    loading: false,
    error: null,
};

/**
 * Wire up useAppSelector so that each real selector function receives a mock
 * state object. Real selector implementations are preserved — only the Redux
 * store is replaced.
 */
function setupSelectorMock(
    overrides: Partial<MockBudgetProgressState> = {}
): void {
    const state = {
        budgetProgress: { ...DEFAULT_STATE, ...overrides },
    };
    (useAppSelector as Mock).mockImplementation(
        (selector: (s: typeof state) => unknown) => selector(state)
    );
}

function renderBudgetProgress() {
    return render(
        <MemoryRouter>
            <BudgetProgress />
        </MemoryRouter>
    );
}

// ─── Suite ───────────────────────────────────────────────────────────────────

const mockDispatch = vi.fn();

beforeEach(() => {
    (useAppDispatch as Mock).mockReturnValue(mockDispatch);
    mockDispatch.mockClear();
});

describe('BudgetProgress', () => {
    // ── Loading state ─────────────────────────────────────────────────────────

    describe('Loading state', () => {
        it('renders skeleton cards when loading is true', () => {
            setupSelectorMock({ loading: true });
            const { container } = renderBudgetProgress();

            // Each of the 8 skeleton cards contains 5 animate-pulse divs
            const pulseElements = container.querySelectorAll(
                '[class*="animate-pulse"]'
            );
            expect(pulseElements.length).toBeGreaterThanOrEqual(8);
        });

        it('does not render category card articles while loading', () => {
            setupSelectorMock({ loading: true, categories: [GREEN_CATEGORY] });
            renderBudgetProgress();

            // BudgetCard renders <article>; skeleton renders <div>
            expect(screen.queryAllByRole('article')).toHaveLength(0);
        });
    });

    // ── Error state ───────────────────────────────────────────────────────────

    describe('Error state', () => {
        it('renders an error alert when error is set', () => {
            setupSelectorMock({ error: 'Failed to fetch spending summary' });
            renderBudgetProgress();

            expect(screen.getByRole('alert')).toBeInTheDocument();
        });

        it('displays the error message text in the alert', () => {
            setupSelectorMock({ error: 'Something went wrong' });
            renderBudgetProgress();

            expect(
                screen.getByText('Something went wrong')
            ).toBeInTheDocument();
        });
    });

    // ── Empty state ───────────────────────────────────────────────────────────

    describe('Empty state', () => {
        it('renders the empty-state card when categories is empty', () => {
            setupSelectorMock({ categories: [] });
            renderBudgetProgress();

            expect(
                screen.getByText('No spend categories with a budget')
            ).toBeInTheDocument();
        });

        it('empty state includes a link to the categories page', () => {
            setupSelectorMock({ categories: [] });
            renderBudgetProgress();

            const link = screen.getByRole('link', {
                name: /go to categories/i,
            });
            expect(link).toBeInTheDocument();
        });
    });

    // ── Category display ──────────────────────────────────────────────────────

    describe('Category display', () => {
        it('renders the correct number of category cards from mock data', () => {
            setupSelectorMock({
                categories: [GREEN_CATEGORY, YELLOW_CATEGORY, RED_CATEGORY],
            });
            renderBudgetProgress();

            expect(screen.getAllByRole('article')).toHaveLength(3);
        });

        it('displays each category name', () => {
            setupSelectorMock({
                categories: [GREEN_CATEGORY, YELLOW_CATEGORY],
            });
            renderBudgetProgress();

            expect(screen.getByText('Groceries')).toBeInTheDocument();
            expect(screen.getByText('Dining Out')).toBeInTheDocument();
        });

        it('formats amounts correctly using formatCurrency', () => {
            // total_spent: 300 → "$300.00", budget_limit: 500 → "of $500.00"
            setupSelectorMock({ categories: [GREEN_CATEGORY] });
            renderBudgetProgress();

            expect(screen.getByText('$300.00')).toBeInTheDocument();
            expect(screen.getByText(/\$500\.00/)).toBeInTheDocument();
        });
    });

    // ── Progress bar colours ──────────────────────────────────────────────────

    describe('Progress bar colors', () => {
        it('applies green fill (bg-success) for categories at 0–74% usage', () => {
            setupSelectorMock({ categories: [GREEN_CATEGORY] }); // 60 %
            const { container } = renderBudgetProgress();

            expect(container.querySelector('.bg-success')).toBeInTheDocument();
        });

        it('applies yellow fill (bg-warning) for categories at 75–99% usage', () => {
            setupSelectorMock({ categories: [YELLOW_CATEGORY] }); // 95 %
            const { container } = renderBudgetProgress();

            expect(container.querySelector('.bg-warning')).toBeInTheDocument();
        });

        it('applies red fill (bg-error) for categories at 100%+ usage', () => {
            setupSelectorMock({ categories: [RED_CATEGORY] }); // 125 %
            const { container } = renderBudgetProgress();

            // The progress fill div carries bg-error (distinct from badge-error on the badge)
            const fill = container.querySelector(
                '[role="progressbar"] .bg-error'
            );
            expect(fill).toBeInTheDocument();
        });
    });

    // ── Over-budget treatment ─────────────────────────────────────────────────

    describe('Over-budget treatment', () => {
        it('shows an "Over Budget" badge for over-budget categories', () => {
            setupSelectorMock({ categories: [RED_CATEGORY] });
            renderBudgetProgress();

            expect(screen.getByText('Over Budget')).toBeInTheDocument();
        });

        it('applies red left border (border-l-error) to over-budget cards', () => {
            setupSelectorMock({ categories: [RED_CATEGORY] });
            const { container } = renderBudgetProgress();

            const article = container.querySelector('article');
            expect(article?.className).toMatch(/border-l-error/);
        });

        it('shows "$X.XX over budget" text in the card footer', () => {
            // spent: 250, budget: 200 → $50.00 over budget
            setupSelectorMock({ categories: [RED_CATEGORY] });
            renderBudgetProgress();

            expect(
                screen.getByText(/\$50\.00 over budget/i)
            ).toBeInTheDocument();
        });
    });

    // ── No budget set ─────────────────────────────────────────────────────────

    describe('No budget set', () => {
        it('shows "No budget set" text when budget_limit is 0', () => {
            setupSelectorMock({ categories: [NO_BUDGET_CATEGORY] });
            renderBudgetProgress();

            expect(screen.getByText(/no budget set/i)).toBeInTheDocument();
        });

        it('progress bar has no fill element when budget_limit is 0', () => {
            setupSelectorMock({ categories: [NO_BUDGET_CATEGORY] });
            const { container } = renderBudgetProgress();

            const progressbar = container.querySelector('[role="progressbar"]');
            // The fill <div> is only rendered when hasBudget is true
            expect(progressbar?.children).toHaveLength(0);
        });
    });

    // ── Accessibility ─────────────────────────────────────────────────────────

    describe('Accessibility', () => {
        it('progress bars have role="progressbar"', () => {
            setupSelectorMock({ categories: [GREEN_CATEGORY] });
            renderBudgetProgress();

            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('progress bar aria-valuenow is capped at 100 for over-budget categories', () => {
            setupSelectorMock({ categories: [RED_CATEGORY] }); // 125 %
            renderBudgetProgress();

            const bar = screen.getByRole('progressbar');
            expect(
                Number(bar.getAttribute('aria-valuenow'))
            ).toBeLessThanOrEqual(100);
        });

        it('progress bars have aria-valuemin of 0', () => {
            setupSelectorMock({ categories: [GREEN_CATEGORY] });
            renderBudgetProgress();

            expect(screen.getByRole('progressbar')).toHaveAttribute(
                'aria-valuemin',
                '0'
            );
        });

        it('progress bars have aria-valuemax of 100', () => {
            setupSelectorMock({ categories: [GREEN_CATEGORY] });
            renderBudgetProgress();

            expect(screen.getByRole('progressbar')).toHaveAttribute(
                'aria-valuemax',
                '100'
            );
        });

        it('progress bars have a descriptive aria-label containing the category name', () => {
            setupSelectorMock({ categories: [GREEN_CATEGORY] });
            renderBudgetProgress();

            const bar = screen.getByRole('progressbar');
            expect(bar.getAttribute('aria-label')).toMatch(/groceries/i);
        });
    });
});
