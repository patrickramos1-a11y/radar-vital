
# Fix: Lock button click being silently consumed

## Problem confirmed via browser testing
- Clicking the lock button with various selectors (xpath, CSS) reports "success" but state never changes
- Other buttons in the same FilterBar (like "Prioridade" sort) work perfectly
- No console errors appear
- The code logic is correct - the issue is at the event level

## Root Cause Analysis
The lock button sits adjacent to the `GridSizePicker` component, which nests `Popover > Tooltip > PopoverTrigger asChild > button`. The Radix `Popover` component tracks pointer events (pointerdown/pointerup) at the document level to manage open/close behavior. When the lock button receives a click, the Popover's document-level pointer handler may consume the event before the `click` event fires on the lock button.

The `click` event requires both `mousedown` and `mouseup` to complete on the same target. If Radix's pointer event system intercepts `pointerup`, the browser never synthesizes the `click`.

## Solution
Replace `onClick` with `onPointerDown` for the lock button. The `pointerdown` event fires before any Radix handler can intercept it, ensuring the state toggle always executes.

## Technical Details

### File: `src/components/dashboard/FilterBar.tsx` (line 208)

Change the lock button's event handler:

```text
Before:
  onClick={() => onFitAllLockedChange(!fitAllLocked)}

After:
  onPointerDown={(e) => {
    e.preventDefault();
    onFitAllLockedChange(!fitAllLocked);
  }}
```

The `e.preventDefault()` prevents the button from receiving focus-related side effects from the pointer event, keeping behavior clean.

### Summary

| File | Change |
|------|--------|
| `src/components/dashboard/FilterBar.tsx` | Replace `onClick` with `onPointerDown` on the lock button |
