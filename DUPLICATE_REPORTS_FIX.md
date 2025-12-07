# Fix for Duplicate Assessment Reports

## Problem

When submitting an assessment, sometimes **duplicate reports** were being created in the `AssessmentReports` database collection. This happened because:

1. **Multiple report generation functions** were being called during submission
2. **No duplicate check** existed before inserting new reports
3. Both `generateAssessmentReport()` and `generateAssessmentReportForSubmission()` were creating reports independently

---

## Root Cause

In `cyberwheelhouse.js`, when an assessment was submitted:

```javascript
// Line 787: First report created
generateAssessmentReportForSubmission(submissionResult._id, detailedSubmissionRecord);

// Line 824/865: Second report created (in progress update logic)
generateAssessmentReport(completedProgress, userId);
```

Both functions were calling `wixData.insert()` without checking if a report already existed for that user+assessment combination.

---

## Solution: Upsert Logic

Created a new `upsertAssessmentReport()` function that:

1. **Checks if a report exists** for the user + assessment combination
2. **Updates the existing report** if found
3. **Inserts a new report** if not found

### New Function (Line 2203-2253)

```javascript
function upsertAssessmentReport(reportRecord) {
    // Query for existing report by userId + assessmentId
    return wixData.query('AssessmentReports')
        .eq('userId', reportRecord.userId)
        .eq('assessmentId', reportRecord.assessmentId)
        .find()
        .then(results => {
            if (results.items.length > 0) {
                // Report exists → UPDATE it
                const existingReport = results.items[0];
                const updatedReport = {
                    ...existingReport,
                    ...reportRecord,
                    _id: existingReport._id
                };
                return wixData.update('AssessmentReports', updatedReport);
            } else {
                // Report doesn't exist → INSERT new one
                return wixData.insert('AssessmentReports', reportRecord);
            }
        });
}
```

---

## Changes Made

### 1. Added Upsert Function
- **File**: `cyberwheelhouse.js`
- **Lines**: 2203-2253
- **Purpose**: Centralized logic to prevent duplicates

### 2. Updated `generateAssessmentReportForSubmission()`
- **File**: `cyberwheelhouse.js`
- **Lines**: 2385-2394
- **Change**: Replaced `wixData.insert()` with `upsertAssessmentReport()`

### 3. Updated `generateAssessmentReport()`
- **File**: `cyberwheelhouse.js`
- **Lines**: 1904-1922
- **Change**: Replaced `wixData.insert()` with `upsertAssessmentReport()`

---

## How It Works

### Before (Duplicate Creation)
```
Submit Assessment
    ↓
Save to AssessmentSubmissions
    ↓
Call generateAssessmentReportForSubmission() → INSERT Report #1
    ↓
Update Progress
    ↓
Call generateAssessmentReport() → INSERT Report #2 (DUPLICATE!)
```

### After (No Duplicates)
```
Submit Assessment
    ↓
Save to AssessmentSubmissions
    ↓
Call generateAssessmentReportForSubmission()
    ↓
upsertAssessmentReport() checks if report exists
    ├─ If YES → UPDATE existing report
    └─ If NO → INSERT new report
    ↓
Update Progress
    ↓
Call generateAssessmentReport()
    ↓
upsertAssessmentReport() checks if report exists
    ├─ If YES → UPDATE existing report (with latest data)
    └─ If NO → INSERT new report
```

---

## Benefits

✅ **No More Duplicates** - Only one report per user+assessment combination

✅ **Always Latest Data** - If report exists, it gets updated with newest information

✅ **Consistent Database** - Clean, deduplicated AssessmentReports collection

✅ **Better Performance** - No duplicate records to process in Reports tab

---

## Testing

To verify the fix works:

1. **Submit an assessment** → Check AssessmentReports collection
2. **Submit the same assessment again** → Should UPDATE, not create duplicate
3. **Check Reports tab** → Should show only one report per assessment per user
4. **Verify data is latest** → Updated report should have newest scores/risks

---

## Database Query

To find and verify no duplicates exist:

```javascript
// Query for duplicate reports (should return 0)
wixData.query('AssessmentReports')
    .find()
    .then(results => {
        const grouped = {};
        results.items.forEach(report => {
            const key = `${report.userId}_${report.assessmentId}`;
            grouped[key] = (grouped[key] || 0) + 1;
        });
        
        const duplicates = Object.entries(grouped)
            .filter(([key, count]) => count > 1);
        
        console.log('Duplicates found:', duplicates.length);
    });
```

---

## Summary

The duplicate reports issue has been **FIXED** by implementing upsert logic that:
- Checks for existing reports before inserting
- Updates existing reports instead of creating duplicates
- Ensures only one report per user+assessment combination
- Maintains data consistency in the database

