import { AnyAction, combineReducers, configureStore } from '@reduxjs/toolkit';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import apiClient from '../../utils/apiClient';
import { logout } from './authSlice';
import budgetProgressReducer, {
    fetchSpendingSummary,
    selectBudgetProgressError,
    selectBudgetProgressLoading,
    selectSpendingSummary,
} from './budgetProgressSlice';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore() {
    return configureStore({
        reducer: { budgetProgress: budgetProgressReducer },
    });
}

type TestStore = ReturnType<typeof makeStore>;

const mockResponse = {
    month: '2026-03',
    categories: [
        {
            id: 1,
            name: 'Groceries',
            total_spent: 250.0,
            budget_limit: 400.0,
            percentage_used: 62.5,
        },
        {
            id: 2,
            name: 'Transport',
            total_spent: 80.0,
            budget_limit: 150.0,
            percentage_used: 53.33,
        },
    ],
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let store: TestStore;
let mock: MockAdapter;

beforeEach(() => {
    store = makeStore();
    mock = new MockAdapter(apiClient);
});

afterEach(() => {
    mock.restore();
});

// ---------------------------------------------------------------------------
// fetchSpendingSummary thunk
// ---------------------------------------------------------------------------

describe('fetchSpendingSummary thunk', () => {
    describe('pending', () => {
        it('sets loading to true', async () => {
            mock.onGet('/api/v1/spending-summary/').reply(
                () => new Promise(() => {})
            ); // never resolves

            store.dispatch(fetchSpendingSummary('2026-04'));

            const state = store.getState().budgetProgress;
            expect(state.loading).toBe(true);
        });

        it('clears error when a new request starts', async () => {
            // Seed an error from a prior rejection
            mock.onGet('/api/v1/spending-summary/').replyOnce(500, {
                detail: 'Server error',
            });
            await store.dispatch(fetchSpendingSummary('2026-04'));
            expect(store.getState().budgetProgress.error).not.toBeNull();

            // Second request starts — error should clear immediately
            mock.onGet('/api/v1/spending-summary/').reply(
                () => new Promise(() => {})
            );
            store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.error).toBeNull();
        });
    });

    describe('fulfilled', () => {
        it('sets month from the response', async () => {
            mock.onGet('/api/v1/spending-summary/').reply(200, mockResponse);

            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.month).toBe('2026-03');
        });

        it('sets categories from the response', async () => {
            mock.onGet('/api/v1/spending-summary/').reply(200, mockResponse);

            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.categories).toEqual(
                mockResponse.categories
            );
        });

        it('sets loading to false', async () => {
            mock.onGet('/api/v1/spending-summary/').reply(200, mockResponse);

            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.loading).toBe(false);
        });

        it('clears error on success', async () => {
            // Seed an error
            mock.onGet('/api/v1/spending-summary/').replyOnce(500, {
                detail: 'oops',
            });
            await store.dispatch(fetchSpendingSummary('2026-04'));

            // Now succeed — rejected case sets error but fulfilled case does NOT clear it
            // explicitly in the slice; however, the pending case does. This test verifies
            // that the fulfilled handler leaves error in the state it was set to (null after
            // pending), i.e. the pending→fulfilled path yields null.
            mock.onGet('/api/v1/spending-summary/').reply(200, mockResponse);
            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.error).toBeNull();
        });

        it('replaces categories on subsequent successful fetches', async () => {
            const firstResponse = {
                month: '2026-02',
                categories: [
                    {
                        id: 5,
                        name: 'Entertainment',
                        total_spent: 50.0,
                        budget_limit: 100.0,
                        percentage_used: 50.0,
                    },
                ],
            };

            mock.onGet('/api/v1/spending-summary/').replyOnce(
                200,
                firstResponse
            );
            await store.dispatch(fetchSpendingSummary('2026-04'));

            mock.onGet('/api/v1/spending-summary/').replyOnce(
                200,
                mockResponse
            );
            await store.dispatch(fetchSpendingSummary('2026-04'));

            const state = store.getState().budgetProgress;
            expect(state.month).toBe('2026-03');
            expect(state.categories).toHaveLength(2);
            expect(state.categories[0]!.name).toBe('Groceries');
        });

        it('handles an empty categories array', async () => {
            mock.onGet('/api/v1/spending-summary/').reply(200, {
                month: '2026-03',
                categories: [],
            });

            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.categories).toEqual([]);
        });

        it('handles a category with null percentage_used', async () => {
            const responseWithNull = {
                month: '2026-03',
                categories: [
                    {
                        id: 3,
                        name: 'New Category',
                        total_spent: 0,
                        budget_limit: 200.0,
                        percentage_used: null,
                    },
                ],
            };
            mock.onGet('/api/v1/spending-summary/').reply(
                200,
                responseWithNull
            );

            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(
                store.getState().budgetProgress.categories[0]!.percentage_used
            ).toBeNull();
        });
    });

    describe('rejected', () => {
        it('sets loading to false', async () => {
            mock.onGet('/api/v1/spending-summary/').reply(500, {
                detail: 'Internal Server Error',
            });

            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.loading).toBe(false);
        });

        it('sets error from the API detail field', async () => {
            mock.onGet('/api/v1/spending-summary/').reply(400, {
                detail: 'Bad request',
            });

            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.error).toBe('Bad request');
        });

        it('falls back to default message when detail is missing', async () => {
            mock.onGet('/api/v1/spending-summary/').reply(500, {});

            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.error).toBe(
                'Failed to fetch spending summary'
            );
        });

        it('falls back to default message on network error', async () => {
            mock.onGet('/api/v1/spending-summary/').networkError();

            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.error).toBe(
                'Failed to fetch spending summary'
            );
        });

        it('does not mutate categories on failure', async () => {
            // Load some data first
            mock.onGet('/api/v1/spending-summary/').replyOnce(
                200,
                mockResponse
            );
            await store.dispatch(fetchSpendingSummary('2026-04'));

            // Then fail
            mock.onGet('/api/v1/spending-summary/').reply(500, {
                detail: 'oops',
            });
            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.categories).toEqual(
                mockResponse.categories
            );
        });

        it('does not mutate month on failure', async () => {
            mock.onGet('/api/v1/spending-summary/').replyOnce(
                200,
                mockResponse
            );
            await store.dispatch(fetchSpendingSummary('2026-04'));

            mock.onGet('/api/v1/spending-summary/').reply(500, {
                detail: 'oops',
            });
            await store.dispatch(fetchSpendingSummary('2026-04'));

            expect(store.getState().budgetProgress.month).toBe('2026-03');
        });
    });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
    it('has empty month', () => {
        expect(store.getState().budgetProgress.month).toBe('');
    });

    it('has empty categories array', () => {
        expect(store.getState().budgetProgress.categories).toEqual([]);
    });

    it('has loading set to false', () => {
        expect(store.getState().budgetProgress.loading).toBe(false);
    });

    it('has null error', () => {
        expect(store.getState().budgetProgress.error).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('selectSpendingSummary', () => {
    it('returns month and categories from state', async () => {
        mock.onGet('/api/v1/spending-summary/').reply(200, mockResponse);
        await store.dispatch(fetchSpendingSummary('2026-04'));

        const result = selectSpendingSummary(
            store.getState() as Parameters<typeof selectSpendingSummary>[0]
        );

        expect(result).toEqual({
            month: '2026-03',
            categories: mockResponse.categories,
        });
    });

    it('returns initial values before any fetch', () => {
        const result = selectSpendingSummary(
            store.getState() as Parameters<typeof selectSpendingSummary>[0]
        );

        expect(result).toEqual({ month: '', categories: [] });
    });
});

describe('selectBudgetProgressLoading', () => {
    it('returns false on initial state', () => {
        expect(
            selectBudgetProgressLoading(
                store.getState() as Parameters<
                    typeof selectBudgetProgressLoading
                >[0]
            )
        ).toBe(false);
    });

    it('returns true while fetch is in flight', () => {
        mock.onGet('/api/v1/spending-summary/').reply(
            () => new Promise(() => {})
        );

        store.dispatch(fetchSpendingSummary('2026-04'));

        expect(
            selectBudgetProgressLoading(
                store.getState() as Parameters<
                    typeof selectBudgetProgressLoading
                >[0]
            )
        ).toBe(true);
    });

    it('returns false after a successful fetch', async () => {
        mock.onGet('/api/v1/spending-summary/').reply(200, mockResponse);
        await store.dispatch(fetchSpendingSummary('2026-04'));

        expect(
            selectBudgetProgressLoading(
                store.getState() as Parameters<
                    typeof selectBudgetProgressLoading
                >[0]
            )
        ).toBe(false);
    });

    it('returns false after a failed fetch', async () => {
        mock.onGet('/api/v1/spending-summary/').reply(500, {});
        await store.dispatch(fetchSpendingSummary('2026-04'));

        expect(
            selectBudgetProgressLoading(
                store.getState() as Parameters<
                    typeof selectBudgetProgressLoading
                >[0]
            )
        ).toBe(false);
    });
});

describe('selectBudgetProgressError', () => {
    it('returns null on initial state', () => {
        expect(
            selectBudgetProgressError(
                store.getState() as Parameters<
                    typeof selectBudgetProgressError
                >[0]
            )
        ).toBeNull();
    });

    it('returns null after a successful fetch', async () => {
        mock.onGet('/api/v1/spending-summary/').reply(200, mockResponse);
        await store.dispatch(fetchSpendingSummary('2026-04'));

        expect(
            selectBudgetProgressError(
                store.getState() as Parameters<
                    typeof selectBudgetProgressError
                >[0]
            )
        ).toBeNull();
    });

    it('returns the error string after a failed fetch', async () => {
        mock.onGet('/api/v1/spending-summary/').reply(422, {
            detail: 'Unprocessable',
        });
        await store.dispatch(fetchSpendingSummary('2026-04'));

        expect(
            selectBudgetProgressError(
                store.getState() as Parameters<
                    typeof selectBudgetProgressError
                >[0]
            )
        ).toBe('Unprocessable');
    });

    it('returns the fallback message when no detail is provided', async () => {
        mock.onGet('/api/v1/spending-summary/').networkError();
        await store.dispatch(fetchSpendingSummary('2026-04'));

        expect(
            selectBudgetProgressError(
                store.getState() as Parameters<
                    typeof selectBudgetProgressError
                >[0]
            )
        ).toBe('Failed to fetch spending summary');
    });
});

// ---------------------------------------------------------------------------
// Store reset on logout
// ---------------------------------------------------------------------------

// Mirrors the root reducer pattern from store/index.ts in an isolated,
// test-scoped store so the singleton production store is not mutated.
function makeRootStore() {
    const combined = combineReducers({
        budgetProgress: budgetProgressReducer,
    });

    const rootReducer = (
        state: ReturnType<typeof combined> | undefined,
        action: AnyAction
    ) => {
        if (action.type === logout.pending.type) {
            return combined(undefined, action);
        }
        return combined(state, action);
    };

    return configureStore({ reducer: rootReducer });
}

type RootTestStore = ReturnType<typeof makeRootStore>;

describe('store reset on logout', () => {
    let rootStore: RootTestStore;
    let rootMock: MockAdapter;

    beforeEach(() => {
        rootStore = makeRootStore();
        rootMock = new MockAdapter(apiClient);
    });

    afterEach(() => {
        rootMock.restore();
    });

    it('clears budgetProgress state when logout is dispatched', async () => {
        // 1. Pre-populate budgetProgress with User A's financial data
        rootMock.onGet('/api/v1/spending-summary/').replyOnce(200, {
            month: '2026-03',
            categories: [
                {
                    id: 1,
                    name: 'Groceries',
                    total_spent: 850.25,
                    budget_limit: 1000.0,
                    percentage_used: 85.03,
                },
                {
                    id: 2,
                    name: 'Mortgage',
                    total_spent: 2400.0,
                    budget_limit: 2400.0,
                    percentage_used: 100.0,
                },
            ],
        });

        await rootStore.dispatch(fetchSpendingSummary('2026-04'));

        // Confirm User A's data is present before logout
        const loadedState = rootStore.getState().budgetProgress;
        expect(loadedState.month).toBe('2026-03');
        expect(loadedState.categories).toHaveLength(2);

        // 2. Fire logout.pending — the root reducer passes undefined to appReducer,
        //    resetting all slices to their initial state
        rootStore.dispatch({ type: logout.pending.type });

        // 3. Assert budgetProgress is fully reset to initial state
        const state = rootStore.getState();

        expect(
            selectSpendingSummary(
                state as Parameters<typeof selectSpendingSummary>[0]
            )
        ).toEqual({ month: '', categories: [] });

        expect(
            selectBudgetProgressLoading(
                state as Parameters<typeof selectBudgetProgressLoading>[0]
            )
        ).toBe(false);

        expect(
            selectBudgetProgressError(
                state as Parameters<typeof selectBudgetProgressError>[0]
            )
        ).toBeNull();
    });
});
