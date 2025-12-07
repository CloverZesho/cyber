# Overall Score Calculation - Debug Guide

## Problem Statement

**Overall score is not crossing 2 or equal to 2** - The maturity score is capped at a maximum of 2.0/5, even when users select higher values (3, 4, or 5) for maturity questions.

---

## Root Cause Analysis

The issue is likely one of the following:

### 1. **Maturity Questions Not Being Recognized**
- The `answerType` property might not be set to `'maturity'` on the question objects
- Questions might be defaulting to `'text'` type, which uses keyword analysis (returns 0-5 based on text content)
- This would explain why scores are low and capped at 2

### 2. **Answer Values Not Being Parsed Correctly**
- Maturity answers might be stored as strings ("0", "1", etc.) instead of numbers
- The `parseInt()` function might fail to convert them properly
- This would result in `NaN` or 0 scores

### 3. **Question Object Missing answerType**
- When answers are collected in `cyberwheelhouse.html`, the question object might not have the `answerType` property
- The fallback to `question.type || 'text'` might be triggering, defaulting to text analysis

---

## Debugging Steps

### Step 1: Check Browser Console Logs

When you submit an assessment, look for these log messages in the browser console:

```
📝 Processing answer 1:
   Question: [Question text]
   Type: [Should be 'maturity' for maturity questions]
   Answer: [The selected value]
   Domain: [Domain name]
   ✅ Converted Score: [Should be 0-5]
```

**What to look for:**
- If `Type:` shows `'text'` instead of `'maturity'`, that's the problem
- If `Converted Score:` shows 0 or NaN, the parsing is failing

### Step 2: Check Overall Score Summary

Look for this log at the end:

```
📊 OVERALL SCORE CALCULATION SUMMARY:
   Total Score: [Sum of all scores]
   Total Questions: [Number of questions]
   Overall Score: [Average]/5
   Maturity Level: [Level name]
   Identified Risks: [Number]
   Domain Scores: [Object with domain averages]
```

**What to look for:**
- If `Total Score` is low even though you selected high values, answers aren't being scored correctly
- If `Total Questions` is wrong, some questions might not be included

### Step 3: Verify Question Structure

In the browser console, run:

```javascript
// Check if questions have answerType
console.log(assessment.questionData[0]);
// Look for: answerType, type, answerType properties
```

---

## Solution Approach

### If answerType is Missing:

**File:** `cyberwheelhouse.html` (Line 9809)

The question object needs to have `answerType` set correctly when rendering:

```javascript
const answerType = question.answerType || question.type || 'text';
```

**Fix:** Ensure questions loaded from database have `answerType` property set to `'maturity'` for maturity questions.

### If Answer Parsing is Failing:

**File:** `cyberwheelhouse.js` (Line 1767)

The maturity answer conversion needs to handle both string and number inputs:

```javascript
case 'maturity':
case 'rating':
    const numericScore = parseInt(answer);
    console.log(`📊 Maturity/Rating score: ${numericScore} (from ${answer})`);
    return numericScore || 0;
```

**Fix:** Ensure `parseInt()` is working correctly and not returning `NaN`.

---

## Testing the Fix

1. **Submit an assessment** with maturity questions
2. **Select high values** (4 or 5) for all maturity questions
3. **Check browser console** for the debug logs
4. **Verify the score** is calculated correctly (should be close to 4-5)
5. **Check the Reports tab** to see if the score displays correctly

---

## Expected Behavior After Fix

- ✅ Maturity questions should be recognized as `type: 'maturity'`
- ✅ Answers should be converted to numeric scores (0-5)
- ✅ Overall score should reflect the average of all answers
- ✅ Scores should range from 0-5, not capped at 2
- ✅ Color coding should show appropriate colors for higher scores

---

## Key Files Involved

| File | Function | Purpose |
|---|---|---|
| **cyberwheelhouse.html** | `generateQuestionHTML()` | Renders maturity questions |
| **cyberwheelhouse.html** | `submitAssessment()` | Collects answers and sends to backend |
| **cyberwheelhouse.js** | `calculateAssessmentScores()` | Calculates overall score |
| **cyberwheelhouse.js** | `convertAnswerToScore()` | Converts individual answers to 0-5 scores |

---

## Debug Logs Added

The following logging has been added to help diagnose the issue:

1. **In `convertAnswerToScore()`** (Line 1761-1770):
   - Logs the answer type, answer value, and converted score
   - Helps identify if maturity answers are being recognized

2. **In `calculateAssessmentScores()`** (Line 1699-1710):
   - Logs each answer being processed
   - Shows question type, answer value, and converted score

3. **In `calculateAssessmentScores()`** (Line 1753-1762):
   - Logs the final overall score calculation
   - Shows total score, total questions, and overall score

---

## Next Steps

1. **Submit an assessment** and check the browser console
2. **Share the console logs** to identify the exact issue
3. **Apply the appropriate fix** based on the logs
4. **Test again** to verify the score is calculated correctly

