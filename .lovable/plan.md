

# Fix: Lock button (Fit-All Locked) not responding to clicks

## Problem

The lock/unlock button in the filter bar does not respond when clicked - clicking it produces no visual change and the fit-all-locked mode is not activated.

## Root Cause

The button is wrapped in a Radix UI `Tooltip` > `TooltipTrigger asChild` pattern. The `asChild` prop merges Radix's internal event handlers onto the button element. In some scenarios, this can interfere with the button's own `onClick` handler due to event propagation or handler ordering issues.

## Solution

Add explicit `e.stopPropagation()` to the lock button's click handler to ensure the event is not consumed by parent elements or Radix internals. This is a minimal, targeted fix that follows the same pattern used in other interactive elements.

## Technical Details

### File: `src/components/dashboard/FilterBar.tsx`

Update the lock button's onClick handler to explicitly stop propagation:

```typescript
// Before
onClick={() => onFitAllLockedChange(!fitAllLocked)}

// After
onClick={(e) => {
  e.stopPropagation();
  onFitAllLockedChange(!fitAllLocked);
}}
```

If `stopPropagation` alone doesn't resolve it, the fallback approach is to also add `e.preventDefault()` and move the button outside the `TooltipTrigger asChild` wrapper (using a manual ref-based tooltip trigger instead), or restructure to avoid nested Radix components interfering.

### Summary

| File | Change |
|------|--------|
| `src/components/dashboard/FilterBar.tsx` | Add `e.stopPropagation()` to lock button onClick handler |

