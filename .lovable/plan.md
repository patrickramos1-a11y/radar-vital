

## Plan: Add Due Date to Tasks + Overdue Indicator

### What will change

**1. Database: Add `due_date` column to `tasks` table**
- New nullable `date` column `due_date` on the `tasks` table via migration.

**2. Type update: `src/types/task.ts`**
- Add `due_date: string | null` to the `Task` interface.
- Add `due_date?: string` to `TaskFormData`.

**3. Hook update: `src/hooks/useTasks.ts`**
- Map `due_date` in `dbRowToTask`.
- Pass `due_date` when inserting tasks.
- Add helper `getOverdueTasks()` that returns pending tasks where `due_date < today`, sorted by most overdue first.

**4. Task creation forms — add date picker**
- **`src/components/checklist/TaskModal.tsx`**: Add a date input field below the assignees row for setting a due date when creating a new task.
- **`src/pages/JackboxUnified.tsx`** (JackboxCardEnhanced add form): Add the same date input field.
- **`src/components/comments/CreateTaskFromComment.tsx`**: Add optional date input.

**5. Display due date alongside task title**
- In **TaskModal** and **JackboxCardEnhanced** task items: show the due date next to the days-open indicator. If overdue, show in red with a warning style.

**6. Overdue indicator in the Tasks tab (`JackboxUnified.tsx`)**
- Add a new section/card in the `TaskAnalytics` or directly below the KPIs showing a ranked list of the most overdue tasks (title, client, assignee, days overdue), styled with red/warning colors.
- This will be a collapsible panel listing tasks sorted by how many days past their due date, showing task title, client name, assignee badge, and days overdue.

### Technical details

- Migration SQL: `ALTER TABLE public.tasks ADD COLUMN due_date date;`
- Overdue calculation: `Math.floor((today - due_date) / 86400000)` days
- Date input will use a simple `<input type="date">` for simplicity, matching the existing minimal UI style
- The overdue panel will reuse existing task data from `useTasks` — no extra queries needed

