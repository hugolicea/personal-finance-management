# Budget Progress API

Developer reference for `GET /api/v1/spending-summary/` and
`GET /api/v1/category-spending/{period}/`.

---

## Authentication

Both endpoints require authentication. `@permission_classes([IsAuthenticated])`
is applied to both. Unauthenticated requests return HTTP 401. No other
authentication or authorization variants are supported.

---

## Shared Behavior

Both endpoints share the following constraints:

- **Category scope:** `classification = Category.SPEND` and
  `user = request.user`. Income categories are excluded.
- **Amount normalization:** Transaction amounts are passed through `abs()`. All
  `spending` / `total_spent` values are always non-negative.
- **Pagination:** None. All qualifying categories are returned in a single
  response.
- **Category ID filtering:** Not supported.

---

## `GET /api/v1/spending-summary/`

Returns budget vs. spending for the current calendar month. The date range is
computed server-side using `timezone.now()`. Clients cannot request a different
month.

**Date range computation:**

```python
start = timezone.now().date().replace(day=1)
end   = last day of current month
```

**Category ordering:** alphabetical by name.

### Response — HTTP 200

```json
{
    "month": "2026-03",
    "categories": [
        {
            "id": 1,
            "name": "Food",
            "total_spent": 150.0,
            "budget_limit": 300.0,
            "percentage_used": 50.0
        }
    ]
}
```

### Response Fields

| Field                          | Type               | Nullable | Notes                                                                                                                  |
| ------------------------------ | ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `month`                        | string (`YYYY-MM`) | No       | Current calendar month                                                                                                 |
| `categories[].id`              | integer            | No       | Category primary key                                                                                                   |
| `categories[].name`            | string             | No       | Category name                                                                                                          |
| `categories[].total_spent`     | decimal            | No       | Always ≥ 0; normalized via `abs()`                                                                                     |
| `categories[].budget_limit`    | decimal            | No       | Configured budget limit                                                                                                |
| `categories[].percentage_used` | decimal or `null`  | Yes      | `(total_spent / budget_limit * 100)` if `budget_limit > 0`; `null` if `budget_limit = 0`. Not capped — can exceed 100. |

### Errors

| Status | Condition               |
| ------ | ----------------------- |
| 401    | Unauthenticated request |

---

## `GET /api/v1/category-spending/{period}/`

Returns budget vs. spending for a specified period.

### Period Values

| `{period}` | Date range                                      |
| ---------- | ----------------------------------------------- |
| `week`     | Rolling 7 days: `[today − 6, today]`            |
| `month`    | Rolling 30 days: `[today − 29, today]`          |
| `quarter`  | Rolling 90 days: `[today − 89, today]`          |
| `year`     | Rolling 365 days: `[today − 364, today]`        |
| `YYYY-MM`  | Calendar-exact: first to last day of that month |

For named periods, `end = timezone.now().date()` (today). Named periods are
rolling, not calendar-aligned — `month` is not equivalent to the current
calendar month.

For `YYYY-MM`, the date range is computed from calendar boundaries of the given
month, not relative to today.

### `YYYY-MM` Validation

| Condition                                                                    | HTTP Status | Response body                             |
| ---------------------------------------------------------------------------- | ----------- | ----------------------------------------- |
| Year or month part is non-integer                                            | 400         | `{"error": "Invalid year-month format"}`  |
| Year < 2000 or year > current year + 1                                       | 400         | `{"error": "Period out of valid range."}` |
| Named value not in `{week, month, quarter, year}` and not matching `YYYY-MM` | 400         | `{"error": "Invalid period"}`             |

### Response — HTTP 200

```json
{
    "period": "2026-03",
    "start_date": "2026-03-01",
    "end_date": "2026-03-31",
    "categories": [
        {
            "id": 1,
            "name": "Food",
            "budget": 300.0,
            "spending": 150.0,
            "balance": 150.0,
            "percentage_used": 50.0
        }
    ]
}
```

### Response Fields

| Field                          | Type                  | Nullable | Notes                                                                                                       |
| ------------------------------ | --------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `period`                       | string                | No       | Echo of the `{period}` path parameter                                                                       |
| `start_date`                   | string (`YYYY-MM-DD`) | No       | Inclusive range start                                                                                       |
| `end_date`                     | string (`YYYY-MM-DD`) | No       | Inclusive range end                                                                                         |
| `categories[].id`              | integer               | No       | Category primary key                                                                                        |
| `categories[].name`            | string                | No       | Category name                                                                                               |
| `categories[].budget`          | decimal               | No       | Configured budget limit                                                                                     |
| `categories[].spending`        | decimal               | No       | Always ≥ 0; normalized via `abs()`                                                                          |
| `categories[].balance`         | decimal               | No       | `budget − spending`; can be negative                                                                        |
| `categories[].percentage_used` | decimal               | No       | `(spending / budget * 100)` if `budget > 0`; `0` (not `null`) if `budget = 0`. Not capped — can exceed 100. |

### Errors

| Status | Body                                      | Condition                              |
| ------ | ----------------------------------------- | -------------------------------------- |
| 400    | `{"error": "Invalid period"}`             | Unrecognized named period              |
| 400    | `{"error": "Invalid year-month format"}`  | Non-integer year or month in `YYYY-MM` |
| 400    | `{"error": "Period out of valid range."}` | Year < 2000 or year > current year + 1 |
| 401    | —                                         | Unauthenticated request                |

---

## Field Name Differences Between Endpoints

The two endpoints use different field names for equivalent concepts. There is no
common schema.

| Concept      | `spending_summary` | `category_spending_by_period` |
| ------------ | ------------------ | ----------------------------- |
| Budget limit | `budget_limit`     | `budget`                      |
| Amount spent | `total_spent`      | `spending`                    |
| Remaining    | not present        | `balance`                     |

---

## `percentage_used` Behavioral Difference

| Endpoint                      | `budget = 0`         | Type                 | Can exceed 100? |
| ----------------------------- | -------------------- | -------------------- | --------------- |
| `spending_summary`            | `null` (JSON `null`) | decimal or null      | Yes             |
| `category_spending_by_period` | `0` (numeric zero)   | decimal (never null) | Yes             |

Clients must handle both cases independently. Do not share a single
deserialization path for this field across endpoints.

---

## Frontend Redux Integration

> Informational — describes the existing frontend slice behavior, not a
> contract.

**Slice:** `budgetProgressSlice`

**Thunk:** `fetchSpendingSummary` — calls `GET /api/v1/spending-summary/`

**Cache behavior:** Re-fetches only if `categories.length === 0` OR if the
stored `month` value does not match the current month string. No time-based
invalidation.

**Store reset:** All slice state is cleared on logout. `logout.pending` triggers
a root reducer reset.

**Selector:** `selectSpendingSummary` — memoized via `createSelector`.

---

## Out of Scope

The following are not supported by either endpoint:

- Income categories
- Past months via `spending_summary` (always returns current month)
- Future months via `spending_summary`
- Pagination
- Filtering by category ID
