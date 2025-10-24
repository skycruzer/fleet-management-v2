# Execute Checklist Task

## Purpose
Systematically execute a checklist to ensure all requirements are met.

## Usage
This task is called with a checklist parameter:
```
execute-checklist <checklist-name>
```

## Steps

### 1. Load Checklist
- Read the specified checklist file from `.bmad-core/checklists/`
- Parse all checklist items
- Identify any dependencies or prerequisites

### 2. Execute Each Item
For each checklist item:
- [ ] Read and understand the requirement
- [ ] Verify if the requirement is met
- [ ] If not met, note what needs to be done
- [ ] If met, mark as complete
- [ ] Document any issues or blockers

### 3. Report Status
- [ ] List all completed items
- [ ] List any incomplete items
- [ ] Identify any blockers
- [ ] Provide summary of checklist status

### 4. Final Validation
- [ ] All items checked
- [ ] All items either complete or have action plan
- [ ] Checklist results documented
- [ ] Ready for review

## Output
- Checklist execution report
- List of completed items
- List of incomplete items with action plans
- Overall checklist status (pass/fail)

## Example
```
Checklist: story-dod-checklist.md
Status: 18/20 items complete

Completed:
✓ Code follows style guide
✓ Tests written and passing
✓ Documentation updated
...

Incomplete:
✗ E2E tests needed (in progress)
✗ Performance review pending

Overall: PASS (with minor items to complete)
```
