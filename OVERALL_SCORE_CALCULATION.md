# Overall Score Calculation - Brief Explanation

## What is the Overall Score?

The **Overall Score** displayed in the Reports tab is the **average maturity score** of all answers submitted in an assessment, on a scale of **0-5**.

---

## Calculation Formula

```
Overall Score = Sum of All Question Scores / Total Number of Questions
```

### Example:
```
Question 1: Score 2
Question 2: Score 3
Question 3: Score 1
Question 4: Score 2

Overall Score = (2 + 3 + 1 + 2) / 4 = 8 / 4 = 2.0/5
```

---

## How Answers Are Converted to Scores (0-5)

Different question types are converted differently:

| Question Type | Conversion |
|---|---|
| **Maturity/Rating** | Direct numeric score (0-5) |
| **Yes/No** | Yes = 5, No = 0 |
| **Single Choice** | Mapped to predefined scores (0-5) |
| **Multiple Choice** | Based on number of selections |
| **Text** | Keyword analysis (0-5) |

### Single Choice Mapping Example:
```
'Not in place' → 0
'Informal' → 1
'Partially in place' → 2
'Fully in place' → 3
'Measured and monitored' → 4
'Best practice' → 5
```

---

## Data Flow

1. **User submits assessment** → Answers saved to `AssessmentSubmissions` collection
2. **calculateAssessmentScores()** function processes all answers
3. **Each answer converted** to 0-5 score based on question type
4. **Average calculated** → `maturityScore = Total / Count`
5. **Report created** with `overallScore = maturityScore`
6. **Report displayed** in Reports tab with color coding

---

## Color Coding

The score is displayed with a color-coded badge and progress bar:

| Score Range | Color | Meaning |
|---|---|---|
| 0.0 - 1.0 | 🔴 Red | Not in place / High Risk |
| 1.1 - 2.0 | 🟠 Orange | Informal / Medium Risk |
| 2.1 - 3.0 | 🟡 Yellow | Partially in place |
| 3.1 - 4.0 | 🔵 Blue | Fully in place / Measured |
| 4.1 - 5.0 | 🟢 Green | Best practice |

---

## Progress Bar Calculation

```javascript
Progress Bar Width = (Overall Score / 5) * 100%

Example: Score 1.92/5
Progress Bar Width = (1.92 / 5) * 100% = 38.4%
```

---

## Key Files Involved

| File | Function | Purpose |
|---|---|---|
| **cyberwheelhouse.js** | `calculateAssessmentScores()` | Calculates maturity score from answers |
| **cyberwheelhouse.js** | `convertAnswerToScore()` | Converts each answer to 0-5 score |
| **admin.js** | `loadReports()` | Loads reports from database |
| **admin.html** | `createReportCard()` | Displays report card with score |

---

## Summary

✅ **Overall Score = Average of all question scores (0-5)**

- Calculated when user submits assessment
- Stored in `AssessmentSubmissions.maturityScore`
- Copied to `AssessmentReports.overallScore` when report is created
- Displayed in Reports tab with color coding and progress bar
- Used to identify high-risk assessments (low scores)

---

## Example from Your Screenshot

**Score: 1.92/5**
- Average of all answers was 1.92 out of 5
- Displayed in gray badge
- Progress bar shows ~38% filled
- Indicates "Informal" maturity level (between 1-2 range)
- Suggests need for improvement in assessed areas

