# BMad Method Setup Guide - Fleet Management V2

**Project**: Fleet Management V2 (B767 Pilot Management System)
**Installation Date**: October 21, 2025
**BMad Location**: `/Users/skycruzer/Desktop/Fleet Office Management/.bmad-core`

---

## ✅ Installation Complete

BMad Method has been installed in your workspace root directory with the following structure:

```
Fleet Office Management/
├── .bmad-core/                    # ← BMad Core System (INSTALLED)
│   ├── agents/                    # 10 specialized AI agents
│   ├── agent-teams/               # Team configurations
│   ├── workflows/                 # 6 workflow templates
│   ├── tasks/                     # Reusable task templates
│   ├── templates/                 # Document templates
│   ├── checklists/                # Quality checklists
│   ├── data/                      # Configuration data
│   ├── utils/                     # Utility scripts
│   ├── core-config.yaml           # Core configuration
│   ├── user-guide.md              # Complete user guide
│   ├── working-in-the-brownfield.md  # Brownfield workflow guide
│   └── enhanced-ide-development-workflow.md
│
├── .claude/                       # Claude Code configuration
├── fleet-management-v2/           # ← YOUR PROJECT (Current Directory)
└── air-niugini-pms/               # Other project
```

---

## 🤖 Available Agents

BMad provides 10 specialized AI agents in `.bmad-core/agents/`:

| Agent | Role | Primary Use |
|-------|------|-------------|
| **bmad-master** | Master Orchestrator | Coordinates all agents |
| **bmad-orchestrator** | Workflow Orchestration | Manages development cycles |
| **analyst** | Business Analyst | Market research, requirements gathering |
| **pm** | Project Manager | PRD creation, project planning |
| **po** | Product Owner | Epic/story management, backlog |
| **architect** | System Architect | Architecture docs, technical design |
| **dev** | Developer | Code implementation, service layer |
| **qa** | Quality Assurance | Testing strategy, test plans |
| **sm** | Scrum Master | Sprint planning, task management |
| **ux-expert** | UX Designer | UI/UX design, component specs |

---

## 🔄 Available Workflows

BMad provides 6 workflows in `.bmad-core/workflows/`:

### Brownfield Workflows (For Existing Projects) ← **USE THESE**

1. **brownfield-fullstack.yaml** - Full-stack development (Next.js + Backend)
2. **brownfield-service.yaml** - Backend/API development only
3. **brownfield-ui.yaml** - Frontend/UI development only

### Greenfield Workflows (For New Projects)

4. **greenfield-fullstack.yaml** - New full-stack projects
5. **greenfield-service.yaml** - New backend services
6. **greenfield-ui.yaml** - New frontend applications

**Recommended for Fleet Management V2**: `brownfield-fullstack.yaml`

---

## 📋 Core Configuration

Location: `.bmad-core/core-config.yaml`

```yaml
markdownExploder: true
qa:
  qaLocation: docs/qa
prd:
  prdFile: docs/prd.md
  prdVersion: v4
  prdSharded: true
  prdShardedLocation: docs/prd
  epicFilePattern: epic-{n}*.md
architecture:
  architectureFile: docs/architecture.md
  architectureVersion: v4
  architectureSharded: true
  architectureShardedLocation: docs/architecture
devLoadAlwaysFiles:
  - docs/architecture/coding-standards.md
  - docs/architecture/tech-stack.md
  - docs/architecture/source-tree.md
devDebugLog: .ai/debug-log.md
devStoryLocation: docs/stories
slashPrefix: BMad
```

---

## 🚀 Getting Started with BMad

### Step 1: Choose Your Approach

Since **Fleet Management V2** is an existing project (brownfield), you have two options:

#### Option A: Document-First (Recommended for Understanding)
1. Document the entire existing system
2. Create enhancement PRD
3. Update architecture docs
4. Implement changes

#### Option B: PRD-First (Recommended for Speed)
1. Create PRD for new feature/enhancement
2. Document only relevant areas
3. Update architecture
4. Implement changes

### Step 2: Initial Documentation

**Create the required directory structure**:

```bash
cd /Users/skycruzer/Desktop/Fleet\ Office\ Management/fleet-management-v2

# Create docs directories
mkdir -p docs/{prd,architecture,stories,epics,qa/assessments,qa/gates}

# Create initial files
touch docs/prd.md
touch docs/architecture.md
```

### Step 3: Use BMad Agents

Since you're in **Claude Code**, you can use agents by referencing them:

**Example: Document Your Project**
```
I need help documenting my existing Fleet Management V2 system.
Please use the architect agent approach from .bmad-core/agents/architect.md
to create comprehensive architecture documentation.
```

**Example: Create a PRD for New Feature**
```
I want to add a new feature: [describe feature].
Please use the PM agent approach from .bmad-core/agents/pm.md
to create a brownfield PRD for this enhancement.
```

---

## 📖 BMad Method Workflow for Fleet Management V2

### Recommended Brownfield Workflow

```
┌─────────────────────────────────────────────────────┐
│ 1. DOCUMENT EXISTING SYSTEM (Architect Agent)      │
│    - Create docs/architecture.md                    │
│    - Document service layer                         │
│    - Document database schema                       │
│    - Document API structure                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. CREATE ENHANCEMENT PRD (PM Agent)                │
│    - Define new feature requirements                │
│    - Create epics and stories                       │
│    - Identify affected areas                        │
│    - Save to docs/prd.md                            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. UPDATE ARCHITECTURE (Architect Agent)            │
│    - Add new components                             │
│    - Update service layer design                    │
│    - Database schema changes                        │
│    - API endpoint additions                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. SHARD DOCUMENTS (PO Agent)                       │
│    - Split PRD into epics (docs/epics/)             │
│    - Split epics into stories (docs/stories/)       │
│    - Create backlog                                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. DEVELOPMENT CYCLE (SM + Dev Agents)              │
│    - Pick story from backlog                        │
│    - Implement using service layer pattern          │
│    - Follow coding standards                        │
│    - Create tests                                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 6. QUALITY ASSURANCE (QA Agent)                     │
│    - Run test suite                                 │
│    - Code review                                    │
│    - Security audit                                 │
│    - Performance validation                         │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Start Example

### Example: Add New Feature "Flight Requests System"

**Step 1: Create PRD with PM Agent**
```bash
# In Claude Code, create a new conversation
# Reference: .bmad-core/agents/pm.md

"I want to add a Flight Requests System that allows pilots to submit
requests for additional flights or route changes. The system should
include pilot-side submission form, request list, admin review dashboard,
approval/denial workflow, and status tracking.

Please act as the PM agent and create a brownfield PRD for this feature."
```

**Step 2: Update Architecture with Architect Agent**
```bash
# Reference: .bmad-core/agents/architect.md

"Based on the PRD, please act as the architect agent and:
1. Design the new flight_requests table schema
2. Create new services in lib/services/flight-request-service.ts
3. Design API endpoints in app/api/flight-requests/
4. Design UI components in components/flight-requests/
5. Update docs/architecture.md"
```

**Step 3: Implement with Dev Agent**
```bash
# Reference: .bmad-core/agents/dev.md

"Please act as the dev agent and implement the first story:
'Create flight_requests database table and migration'

Follow the service layer pattern and coding standards in CLAUDE.md"
```

---

## 📚 Key Documentation References

### BMad Documentation
- **User Guide**: `.bmad-core/user-guide.md` (24KB)
- **Brownfield Guide**: `.bmad-core/working-in-the-brownfield.md` (22KB)
- **IDE Workflow**: `.bmad-core/enhanced-ide-development-workflow.md` (10KB)

### Project Documentation
- **CLAUDE.md**: Project-specific development guide (17.6KB)
- **BMAD-PROJECT-SUMMARY.md**: BMad integration summary (25.7KB)
- **README.md**: Project overview and setup

### Agent Files
All agents in `.bmad-core/agents/`:
- `bmad-master.md` - Master orchestrator
- `architect.md` - System architecture
- `dev.md` - Development implementation
- `pm.md` - Project management
- `po.md` - Product ownership
- `qa.md` - Quality assurance
- `sm.md` - Scrum master
- `analyst.md` - Business analysis
- `ux-expert.md` - UX/UI design

---

## 🛠️ BMad Method Slash Commands

BMad agents support slash commands with the prefix defined in `core-config.yaml`:

**Prefix**: `BMad`

Common commands:
- `@architect *document-project` - Document existing project
- `@pm *create-brownfield-prd` - Create PRD for enhancement
- `@po *shard-prd` - Split PRD into epics/stories
- `@dev *implement-story` - Implement a user story
- `@qa *create-test-plan` - Create testing strategy

---

## ✅ Next Steps

1. **Read the Guides**:
   ```bash
   # User guide
   cat "/Users/skycruzer/Desktop/Fleet Office Management/.bmad-core/user-guide.md"

   # Brownfield workflow guide
   cat "/Users/skycruzer/Desktop/Fleet Office Management/.bmad-core/working-in-the-brownfield.md"
   ```

2. **Create Docs Structure**:
   ```bash
   cd fleet-management-v2
   mkdir -p docs/{prd,architecture,stories,epics,qa/assessments,qa/gates}
   ```

3. **Document Current System** (using Architect agent approach):
   - Create `docs/architecture.md`
   - Document service layer
   - Document database schema
   - Document API structure

4. **Plan Next Enhancement** (using PM agent approach):
   - Create `docs/prd.md`
   - Define new features
   - Create epic/story structure

5. **Start Development** (using Dev agent approach):
   - Follow service layer pattern
   - Maintain type safety
   - Write tests
   - Follow CLAUDE.md standards

---

## 🎓 Best Practices for BMad + Fleet Management V2

### 1. Always Follow Service Layer Pattern
BMad agents should NEVER create direct Supabase calls. Always use service functions from `lib/services/`.

### 2. Maintain Type Safety
All code must use TypeScript strict mode and generated Supabase types from `types/supabase.ts`.

### 3. Document Before Implementing
Create PRD and architecture docs before writing code. BMad agents rely on good documentation.

### 4. Use Agent Specialization
- **Planning** → PM, PO, Analyst
- **Architecture** → Architect
- **Implementation** → Dev
- **Testing** → QA
- **Coordination** → SM, BMad Master

### 5. Follow Quality Gates
- Code review after implementation
- Tests before commits
- Security audit before deployment

---

## 🔗 Integration with Existing Tools

BMad works alongside your existing development tools:

- ✅ **Supabase MCP** - Database operations
- ✅ **Playwright MCP** - E2E testing
- ✅ **Exa MCP** - Web research
- ✅ **GitHub Actions** - CI/CD
- ✅ **Storybook** - Component development

---

## 📞 Getting Help

1. **Read User Guide**: `.bmad-core/user-guide.md`
2. **Check Brownfield Guide**: `.bmad-core/working-in-the-brownfield.md`
3. **Review Project Standards**: `CLAUDE.md`
4. **Check Agent Documentation**: `.bmad-core/agents/*.md`

---

**Setup Complete! BMad Method is ready to use.**

**Next Command**: Create your documentation structure and start with the architect agent to document your existing system.

```bash
mkdir -p docs/{prd,architecture,stories,epics,qa/assessments,qa/gates}
```
