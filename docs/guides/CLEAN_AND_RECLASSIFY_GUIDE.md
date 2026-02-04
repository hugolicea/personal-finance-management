# Clean and Reclassify Feature

## Overview

A dedicated page for bulk transaction management operations, allowing users to
set up multiple reclassification rules and category deletions to be executed in
a single batch operation.

## Features

### ✅ Implemented

1. **Dedicated Page** - New "Clean & Reclassify" menu option
2. **Reclassification Rules**
    - Add multiple rules (Category A → Category B)
    - Visual list of all pending rules
    - Remove rules before execution
    - Prevents circular reclassification (same category)
    - Prevents duplicate rules

3. **Bulk Deletion**
    - Multi-select categories for deletion
    - Visual checkbox list with counts
    - Shows number of selected categories

4. **Batch Execution**
    - Execute all operations with one click
    - Progress indicator during processing
    - Warning about operation duration
    - Detailed success message with counts
    - Automatic transaction refresh

5. **User Experience**
    - Two-panel layout (Reclassify | Delete)
    - Clear visual separation
    - Summary section before execution
    - Confirmation modal with full operation details
    - Processing state with spinner
    - Cannot undo warning

## Usage Guide

### Accessing the Feature

Navigate to: **Menu → 🧹 Clean & Reclassify**

### Reclassification Workflow

1. Select "From Category" (e.g., "Groceries")
2. Select "To Category" (e.g., "Food and Drink")
3. Click "➕ Add Rule"
4. Repeat for multiple categories
5. Review rules in the list below
6. Remove any rule by clicking 🗑️

### Deletion Workflow

1. Check categories to delete (e.g., "Payment", "LOAN_PMT")
2. See selection count update
3. Review selected categories

### Execution

1. Review the "Operations Summary" section
2. Read the warning about duration
3. Click "🧹 Execute Clean and Reclassify"
4. Confirm in the modal (shows all operations)
5. Wait for processing (may take minutes)
6. See success message with transaction counts

## Technical Details

### Frontend

- **Page**: `CleanAndReclassify.tsx`
- **Route**: `/clean-and-reclassify`
- **State Management**: Redux (transactionsSlice, categoriesSlice)
- **UI**: Tailwind CSS with gradient effects

### Backend Endpoints Used

- `POST /api/v1/bulk-reclassify-transactions/`
  - Request: `{ from_category_id, to_category_id }`
  - Response: `{ message, transactions_updated, from_category, to_category }`

- `POST /api/v1/bulk-delete-transactions/`
  - Request: `{ category_ids: [1, 2, 3] }`
  - Response: `{ message, transactions_deleted, categories_processed }`

### Key Features

- **Sequential Processing**: Reclassifications execute first, then deletions
- **Error Handling**: Individual operation failures don't stop the batch
- **State Updates**: Automatic refresh of transaction list after operations
- **User Feedback**: Progress spinner and detailed results

## Example Use Case

### Problem

- You imported bank statements that created unwanted categories:
  - "LOAN_PMT" (should be deleted)
  - "Payment" (should be deleted)
  - "Groceries" (should be "Food and Drink")

### Solution

1. Add reclassification rule: Groceries → Food and Drink
2. Check "LOAN_PMT" for deletion
3. Check "Payment" for deletion
4. Execute operations
5. Result: All transactions properly categorized and cleaned

## Safety Features

✅ **Confirmation Required** - Two-step process (button + modal) ✅ **Visual
Summary** - See exactly what will happen ✅ **Circular Prevention** - Cannot
reclassify A → A ✅ **Duplicate Prevention** - Cannot add same rule twice ✅
**Clear Warnings** - Duration and permanence warnings ✅ **Detailed Results** -
Shows counts of affected transactions

## Performance Notes

- **Duration**: Depends on transaction count (typically seconds to minutes)
- **Processing**: Sequential to ensure data consistency
- **UI Feedback**: Spinner indicates ongoing operation
- **Network**: Multiple API calls (one per reclassification rule + one for
  deletions)

## Future Enhancements (Optional)

- [ ] Save rule sets for reuse
- [ ] Schedule operations for off-peak hours
- [ ] Preview affected transaction counts before execution
- [ ] Export operation logs
- [ ] Undo last operation (within time window)
- [ ] Batch operation history

## Troubleshooting

**Issue**: Button doesn't appear **Solution**: Rebuild frontend:
`docker compose -f docker-compose.prod.yml --profile mysql build frontend --no-cache`

**Issue**: Operations fail **Solution**: Check browser console for errors,
verify categories exist, ensure user has permissions

**Issue**: Page loads but categories don't show **Solution**: Check Redux state,
verify `/api/v1/categories/` endpoint is working
