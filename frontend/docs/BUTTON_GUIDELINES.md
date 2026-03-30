# Button Usage Guidelines

These guidelines define the standardized button classes and their usage patterns
across the application. Consistent button styles improve user experience by
setting clear expectations for interactions.

## Button Variants

### \`btn-primary-action\`

**Usage:** Main Call-to-Action (CTA) buttons. Used for primary workflows (e.g.,
submitting forms, adding items, creating entities). **CSS:** \`@apply btn
btn-primary shadow-lg hover:shadow-xl transition-shadow rounded-lg;\`
**Examples:**

- Add Transaction
- Save Category
- Create Account
- Submit

### \`btn-secondary-action\`

**Usage:** Alternative actions, secondary steps, or safe cancel operations. Used
for actions that aren't the primary goal but necessary for the workflow.
**CSS:** \`@apply btn btn-outline btn-primary rounded-lg;\` **Examples:**

- Cancel
- Filter
- View Details
- Secondary Navigation

### \`btn-destructive\`

**Usage:** Destructive or irreversible actions. Use sparingly to indicate
consequences. **CSS:** \`@apply btn btn-error shadow-lg hover:shadow-xl
transition-shadow rounded-lg;\` **Examples:**

- Delete Transaction
- Remove Item
- Discard Changes

### \`btn-subtle\`

**Usage:** Minor interactions, temporary elements, or unobtrusive actions that
shouldn't draw main focus. **CSS:** \`@apply btn btn-ghost rounded-lg;\`
**Examples:**

- Close Modal
- Minimize Panel
- Collapse Section

### \`btn-icon\`

**Usage:** Buttons that display only an icon without text. Useful in compact UI
areas like tables, cards, and toolbars. **CSS:** \`@apply btn btn-ghost btn-sm
btn-circle;\` **Examples:**

- Edit (Pencil Icon)
- Delete (Trash Icon - inside a row)
- Info (Information Icon)

## Rules for Consistency

- **Border Radius:** Always enforce \`rounded-lg\`. Do not use \`rounded-md\` or
  \`rounded-sm\` on standard buttons to maintain visual consistency.
- **Save buttons:** Always use \`btn-primary-action\`.
- **Cancel buttons:** Always use \`btn-secondary-action\`.
- **Delete buttons:** Always use \`btn-destructive\`.
- **Logic:** Do NOT alter button logic—only update class names.
