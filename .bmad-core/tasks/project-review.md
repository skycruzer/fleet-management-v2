<!-- Powered by BMAD™ Core -->

# Project Review Workflow

## ⚠️ CRITICAL EXECUTION NOTICE ⚠️

**THIS IS AN EXECUTABLE WORKFLOW - NOT REFERENCE MATERIAL**

This task conducts a comprehensive project review to assess completion status, quality, and readiness.

## Workflow Overview

This workflow performs a systematic review of the project across multiple dimensions:
1. **Feature Completeness**: Verify all planned features are implemented
2. **Code Quality**: Review code standards and best practices
3. **Testing Coverage**: Assess test coverage and quality
4. **Documentation**: Check documentation completeness
5. **Production Readiness**: Evaluate deployment readiness
6. **Performance**: Analyze system performance
7. **Security**: Review security posture

## Execution Steps

### Step 1: Load Project Context

Load the following files to understand project scope:
- `docs/prd/*.md` (if exists) - Product requirements
- `docs/architecture/*.md` (if exists) - Architecture docs
- `CLAUDE.md` - Project guidance
- `README.md` - Project overview
- `package.json` - Dependencies and scripts

### Step 2: Feature Completeness Review

**Review Checklist:**
- [ ] All features from PRD/spec are implemented
- [ ] Core functionality is working end-to-end
- [ ] Edge cases are handled
- [ ] Error handling is comprehensive
- [ ] User workflows are complete

**Output:**
- List of completed features (with file references)
- List of incomplete/missing features
- Completion percentage estimate

### Step 3: Code Quality Assessment

**Review Areas:**
- TypeScript usage (strict mode, proper typing)
- Component structure and organization
- Service layer architecture adherence
- Error handling patterns
- Code duplication (DRY principle)
- Naming conventions
- Comments and inline documentation

**Output:**
- Code quality score (1-10)
- List of quality issues found
- Recommendations for improvement

### Step 4: Testing Coverage Analysis

**Review:**
- Unit test coverage
- Integration test coverage
- E2E test coverage (Playwright)
- Test quality and assertions
- Edge case testing

**Commands to Run:**
```bash
npm test -- --coverage  # If coverage configured
npx playwright test     # Run E2E tests
```

**Output:**
- Test coverage metrics
- List of untested areas
- Test quality assessment

### Step 5: Documentation Review

**Check:**
- README completeness
- API documentation
- Architecture documentation
- Code comments
- Setup instructions
- Deployment guide
- User documentation

**Output:**
- Documentation completeness score (1-10)
- Missing documentation areas
- Documentation quality feedback

### Step 6: Production Readiness Check

**Verify:**
- Environment variables configured
- Error handling and logging
- Monitoring and alerting setup
- Backup and recovery procedures
- Security best practices
- Performance optimization
- Database migrations tested
- CI/CD pipeline functional

**Output:**
- Production readiness score (1-10)
- Blockers for production deployment
- Pre-launch checklist

### Step 7: Performance Analysis

**Review:**
- Page load times
- API response times
- Database query performance
- Bundle size optimization
- Caching strategies
- CDN configuration

**Commands to Run:**
```bash
npm run build           # Check build output
npm run analyze         # If bundle analyzer configured
```

**Output:**
- Performance metrics
- Performance bottlenecks identified
- Optimization recommendations

### Step 8: Security Review

**Check:**
- Authentication and authorization
- Input validation
- SQL injection protection
- XSS protection
- CSRF protection
- Sensitive data handling
- Dependency vulnerabilities
- API security

**Commands to Run:**
```bash
npm audit               # Check for vulnerabilities
```

**Output:**
- Security issues found (severity ratings)
- Remediation recommendations
- Security best practices compliance

### Step 9: Generate Review Report

**Create comprehensive report including:**

```markdown
# Project Review Report
**Date:** [Current Date]
**Project:** Fleet Management V2
**Reviewer:** [Agent Name]

## Executive Summary
[1-paragraph overview of project status]

## Review Scores
- Feature Completeness: X/10
- Code Quality: X/10
- Testing Coverage: X/10
- Documentation: X/10
- Production Readiness: X/10
- Performance: X/10
- Security: X/10

**Overall Score: X/70 (XX%)**

## Detailed Findings

### ✅ Strengths
[List what's working well]

### ⚠️ Issues Found
[List issues by severity: Critical, High, Medium, Low]

### 🎯 Recommendations
[Prioritized action items]

## Feature Status
[Detailed feature completion status]

## Code Quality Analysis
[Code quality findings]

## Testing Assessment
[Testing coverage and quality]

## Documentation Review
[Documentation completeness]

## Production Readiness
[Deployment readiness assessment]

## Performance Metrics
[Performance analysis results]

## Security Posture
[Security review findings]

## Next Steps
[Prioritized action items for team]

## Conclusion
[Final assessment and recommendation]
```

### Step 10: Save Report

Save the review report to:
- `docs/PROJECT-REVIEW-[DATE].md`

## Output Format

Present findings with:
- Clear severity ratings (🔴 Critical, 🟡 High, 🟢 Medium, ⚪ Low)
- File references (file:line for issues)
- Actionable recommendations
- Prioritized next steps

## YOLO Mode

If in YOLO mode, execute all steps rapidly without stopping for user input unless critical issues are found.
