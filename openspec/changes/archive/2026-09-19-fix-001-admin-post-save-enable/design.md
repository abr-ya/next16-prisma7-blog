## Context

`PostForm` uses react-hook-form with `mode: "onBlur"` and disables its submit action from `formState.isValid`. This can leave a valid form disabled until a later interaction updates the validity state.

## Goals / Non-Goals

**Goals:**

- Update save availability as required post fields change.
- Preserve current validation messages and submission protection.

**Non-Goals:**

- Change post validation rules, server actions, route access, or post data.

## Decisions

### Validate while editing

Configure client form validation to update validity on value changes. This directly aligns the save button state with the current form values, rather than relying on focus changes. Retain the existing Zod resolver and `isSubmitting` guard.

### Keep the fix local to the post form

Apply the change only to `PostForm`; other forms may intentionally have different validation timing and are out of scope.

## Risks / Trade-offs

- [Earlier inline feedback may appear while typing] → keep the existing validation schema and error presentation; verify ordinary entry remains usable.
- [Rich text/image controls update asynchronously] → rely on their existing registered field updates and preserve server-side validation.

## Migration Plan

No migration, persisted-data change, dependency, or rollback procedure is required. Reverting the form validation-mode adjustment restores prior behavior.
