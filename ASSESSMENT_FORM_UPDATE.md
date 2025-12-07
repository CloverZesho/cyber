# Assessment Form Update - Day of Completion & End Date

## Overview

Updated the assessment creation/editing form in admin.html to replace the single "Date" field with two separate date fields:
- **Day of Completion** - When the assessment should be completed
- **End Date** - Final deadline for the assessment

The Description field now appears below these date fields for better organization.

---

## Changes Made

### 1. **admin.html** - Form Layout Update

**Location:** Lines 1008-1026

**Before:**
```html
<div class="col-12 col-md-6">
    <label for="assessmentDate">Date</label>
    <input type="date" id="assessmentDate" required>
</div>
<div class="col-12 col-md-6">
    <label for="assessmentDescription">Description</label>
    <input type="text" id="assessmentDescription" required>
</div>
```

**After:**
```html
<div class="col-12 col-md-6">
    <label for="assessmentDayOfCompletion">Day of Completion</label>
    <input type="date" id="assessmentDayOfCompletion" required>
</div>
<div class="col-12 col-md-6">
    <label for="assessmentEndDate">End Date</label>
    <input type="date" id="assessmentEndDate" required>
</div>
<div class="col-12">
    <label for="assessmentDescription">Description</label>
    <input type="text" id="assessmentDescription" required>
</div>
```

### 2. **admin.html** - Form Clearing & Population

Updated all locations where form fields are cleared or populated:

- **Line 1498-1505:** `showAssessments()` - Clear form when switching tabs
- **Line 3940-3944:** `editAssessment()` - Populate form when editing
- **Line 4650-4653:** `collectAssessmentData()` - Collect new date fields
- **Line 4681:** Return statement - Include new fields in data object
- **Line 4883-4890:** `resetFormAndShowAssessments()` - Clear form after save

### 3. **admin.js** - Validation & Data Handling

**Location:** Lines 1331-1368

**Updated `validateAssessmentData()` function:**
- Validates `dayOfCompletion` is provided
- Validates `endDate` is provided
- **NEW:** Validates that `endDate` is after `dayOfCompletion`
- Returns appropriate error messages

**Location:** Lines 1075-1085

**Updated `saveAssessment()` function:**
- Changed from `date: data.date` to:
  - `dayOfCompletion: data.dayOfCompletion`
  - `endDate: data.endDate`

**Location:** Lines 1132-1143

**Updated `updateAssessment()` function:**
- Changed from `date: data.date` to:
  - `dayOfCompletion: data.dayOfCompletion`
  - `endDate: data.endDate`

---

## Database Schema Changes

The Assessments collection now stores:

```javascript
{
    _id: "...",
    title: "Assessment Name",
    description: "Description",
    dayOfCompletion: "2024-12-31",  // NEW
    endDate: "2025-01-15",           // NEW
    status: "published|draft|assigned",
    questions: [...],
    // ... other fields
}
```

---

## Validation Rules

1. ✅ **Day of Completion** - Required field
2. ✅ **End Date** - Required field
3. ✅ **End Date > Day of Completion** - End date must be after day of completion
4. ✅ **Description** - Required field
5. ✅ **At least one question** - Required before publishing/assigning

---

## Form Layout

```
┌─────────────────────────────────────────┐
│ Assessment Name                         │
│ [Enter assessment name]                 │
├─────────────────────────────────────────┤
│ Day of Completion    │ End Date         │
│ [Date picker]        │ [Date picker]    │
├─────────────────────────────────────────┤
│ Description                             │
│ [Brief description]                     │
└─────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Create new assessment with both dates
- [ ] Verify End Date must be after Day of Completion
- [ ] Edit existing assessment and verify dates populate correctly
- [ ] Save as Draft with new date fields
- [ ] Publish assessment with new date fields
- [ ] Assign assessment with new date fields
- [ ] Check database to verify dates are stored correctly
- [ ] Verify validation error if End Date < Day of Completion

---

## Backward Compatibility

**Note:** Existing assessments in the database that have a `date` field will need to be migrated:
- Map `date` → `dayOfCompletion`
- Set `endDate` to a date after `dayOfCompletion` (e.g., 30 days later)

---

## Files Modified

1. **admin.html** - Form layout and data collection
2. **admin.js** - Validation and database operations

---

## Next Steps

1. Test the form with various date combinations
2. Verify database stores dates correctly
3. Update any reports/displays that reference the old `date` field
4. Consider migrating existing assessment records if needed

