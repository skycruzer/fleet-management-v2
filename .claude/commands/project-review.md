# Project Review Command

Execute comprehensive project review using the BMad project-review task.

## What This Does

Runs a complete project assessment across:
- ✅ Feature completeness
- 🏗️ Code quality
- 🧪 Testing coverage
- 📚 Documentation
- 🚀 Production readiness
- ⚡ Performance
- 🔒 Security

## Usage

```bash
/BMad:project-review
```

## Workflow

The review will:
1. Load project context (CLAUDE.md, README, package.json)
2. Analyze feature completeness
3. Assess code quality
4. Review testing coverage
5. Check documentation
6. Evaluate production readiness
7. Analyze performance
8. Review security posture
9. Generate comprehensive report
10. Save to `docs/PROJECT-REVIEW-[DATE].md`

## Output

**Review Report includes:**
- Executive summary
- Scores for each dimension (X/10)
- Overall score (X/70)
- Detailed findings
- Prioritized recommendations
- Next steps

## Options

**Standard Mode:** Detailed analysis with user interaction
**YOLO Mode:** Rapid analysis, minimal interaction

To use YOLO mode:
```bash
/BMad:agents:analyst
*yolo
/BMad:project-review
```

## When to Use

- ✅ Before production deployment
- ✅ After completing major features
- ✅ Monthly/quarterly project health checks
- ✅ Before client demos or releases
- ✅ When preparing for code review
- ✅ To assess technical debt

## Tips

- Run after implementing significant features
- Use findings to prioritize technical debt
- Share report with stakeholders
- Track scores over time to measure improvement
- Use recommendations as sprint planning input
