# BMad Quick Reference Card

## 🚀 Getting Started

```bash
# Installation location
bmad/                    # All BMad files here
.claude/skills/bmad-core/  # Claude Code skill

# Start using BMad
"Initialize BMad for my project"
"Help me understand BMad Method"
```

---

## 📋 Three Planning Tracks

| Track | Use For | Time | Workflows |
|-------|---------|------|-----------|
| **⚡ Quick Flow** | Bug fixes, small features | Minutes-Hours | quick-spec → dev-story |
| **📋 BMad Method** | Products, platforms | Hours-Days | PRD → architecture → stories → dev-story |
| **🏢 Enterprise** | Compliance, security | Days-Weeks | BMad Method + enterprise workflows |

**Not sure?** Say: "Run workflow-init to determine my planning track"

---

## 🤖 BMad Method Agents (BMM)

| Agent | File | Role |
|-------|------|------|
| PM | `bmad/bmm/agents/pm.agent.yaml` | Product vision, PRDs |
| Analyst | `bmad/bmm/agents/analyst.agent.yaml` | Requirements, research |
| Architect | `bmad/bmm/agents/architect.agent.yaml` | System design |
| Scrum Master | `bmad/bmm/agents/sm.agent.yaml` | Story breakdown |
| Developer | `bmad/bmm/agents/dev.agent.yaml` | Implementation |
| Test Architect | `bmad/bmm/agents/tea.agent.yaml` | Test strategy |
| UX Designer | `bmad/bmm/agents/ux-designer.agent.yaml` | User experience |
| Tech Writer | `bmad/bmm/agents/tech-writer.agent.yaml` | Documentation |

**Load Agent**: "Load the [Agent Name] agent"

---

## 🎨 Creative Intelligence Suite (CIS)

| Agent | Focus |
|-------|-------|
| Brainstorming Coach | Idea generation (30+ techniques) |
| Design Thinking Coach | Human-centered problem solving |
| Creative Problem Solver | Breakthrough solutions |
| Innovation Strategist | Business model innovation |
| Storyteller | Narrative frameworks |

**Start Session**: "Run [workflow name] with CIS"

---

## 📁 Key Workflow Paths

### Phase 1: Analysis (Optional)
```
bmad/bmm/workflows/1-analysis/
├── brainstorm-project/     # Project ideation
├── research/               # Market research
└── product-brief/          # Product brief
```

### Phase 2: Planning (Required)
```
bmad/bmm/workflows/2-plan-workflows/
├── quick-spec/            # Quick Flow track (tech spec)
├── prd/                   # BMad Method track (PRD)
└── gdd/                   # Game Design Document
```

### Phase 3: Solutioning
```
bmad/bmm/workflows/3-solutioning/
├── architecture/          # System architecture
└── ux-design/            # UX design
```

### Phase 4: Implementation (Iterative)
```
bmad/bmm/workflows/4-implementation/
├── create-stories/        # Story creation
├── dev-story/            # Story implementation
└── update-docs/          # Documentation
```

### CIS Workflows
```
bmad/cis/workflows/
├── brainstorming/        # 30+ brainstorming techniques
├── design-thinking/      # Design thinking process
├── problem-solving/      # Problem solving methods
├── innovation-strategy/  # Innovation frameworks
└── storytelling/         # Story structures
```

---

## 💬 Common Commands

### Start New Project
```
"Initialize BMad for a new [type] project"
"Run the PRD workflow"
"Load the PM agent and create a product plan"
```

### Fix Bug / Small Feature
```
"I need to fix a bug in [component]"
"Add a small feature for [functionality]"
"Run quick-spec for [task]"
```

### Design & Architecture
```
"Design the architecture for [system]"
"Load the Architect agent"
"Create a technical design for [feature]"
```

### Create Stories
```
"Break this feature into stories"
"Load the Scrum Master and create user stories"
"Run create-stories workflow"
```

### Implement Story
```
"Implement story: [story title]"
"Run dev-story for [story]"
"Load Developer agent and code [feature]"
```

### Brainstorm / Innovation
```
"Help me brainstorm ideas for [topic]"
"Run a design thinking session"
"Use CIS to solve [problem]"
```

### Documentation
```
"Document this feature"
"Create API documentation"
"Load Tech Writer and update docs"
```

---

## 🎯 Quick Workflow Guide

### New Product (BMad Method Track)

1. **Planning Phase**
   ```
   "Load PM agent"
   "Run PRD workflow"
   → Creates Product Requirements Document
   ```

2. **Solutioning Phase**
   ```
   "Load Architect agent"
   "Run architecture workflow"
   → Designs system architecture
   ```

3. **Story Creation**
   ```
   "Load Scrum Master"
   "Run create-stories workflow"
   → Breaks PRD into user stories
   ```

4. **Implementation (Iterative)**
   ```
   "Load Developer agent"
   "Run dev-story for [story #1]"
   → Implements first story

   "Run dev-story for [story #2]"
   → Implements next story (repeat)
   ```

### Bug Fix (Quick Flow Track)

1. **Quick Spec**
   ```
   "Load Developer agent"
   "Run quick-spec for bug fix"
   → Creates fast technical spec
   ```

2. **Implementation**
   ```
   "Run dev-story to fix the bug"
   → Implements the fix
   ```

### Brainstorming Session

1. **Start Session**
   ```
   "Load Brainstorming Coach"
   "Run brainstorming workflow for [topic]"
   ```

2. **Choose Technique**
   - SCAMPER, Mind Mapping, 6 Thinking Hats, etc.

3. **Generate Ideas**
   - Follow guided facilitation

4. **Refine & Prioritize**
   - Evaluate and select best ideas

---

## ⚙️ Customization

### Customize Agent
Create: `bmad/_cfg/agents/[agent-name].customize.yaml`

```yaml
name: "My Custom PM"
role: "Senior Product Manager"
personality: "Strategic and data-driven"
communication_style: "Formal and structured"
language:
  communication: "en"
  output: "en"
```

**Customizations persist through updates!**

---

## 📖 Documentation

| Resource | Location |
|----------|----------|
| Setup Guide | `BMAD_SETUP_GUIDE.md` |
| Quick Start | `bmad/bmm/docs/quick-start.md` |
| All Docs | `bmad/bmm/docs/` |
| Agents Guide | `bmad/bmm/docs/agents/` |
| Workflows | `bmad/bmm/docs/workflows/` |
| Module README | `bmad/bmm/README.md` |

---

## 🔧 Workflow Execution Pattern

For any workflow:

1. **Read Metadata**: Check `workflow.yaml` for requirements
2. **Follow Steps**: Read `instructions.md` step-by-step
3. **Track Progress**: Use `checklist.md`
4. **Use Template**: Reference `template.md` (if exists)
5. **Check Data**: Review `.csv` files for examples

**Example**:
```
bmad/bmm/workflows/2-plan-workflows/prd/
├── workflow.yaml      # Check this first
├── instructions.md    # Follow these steps
├── checklist.md       # Track progress here
├── template.md        # Use this template
└── *.csv             # Reference data
```

---

## 🎭 Advanced: Party Mode

Run workflows with multi-agent collaboration:

```
"Run party mode for this decision"
"Start party mode and design architecture"
```

**Result**: All relevant agents collaborate, providing diverse perspectives.

---

## 💡 BMad Philosophy

**C.O.R.E.**:
- **C**ollaboration: Human-AI partnership
- **O**ptimized: Battle-tested processes
- **R**eflection: Strategic questioning
- **E**ngine: 19+ agents, 50+ workflows

**Remember**: BMad helps you think better, not just execute faster.

---

## 🚨 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Skill not working | Restart Claude Code, check `.claude/skills/bmad-core/` |
| Agent not loading | Verify `bmad/bmm/agents/*.agent.yaml` exists |
| Workflow not found | Check path: `bmad/bmm/workflows/[phase]/[name]/` |
| Need help | Say "Help me understand BMad Method" |

---

## 📊 Project Types & Recommended Tracks

| Project Type | Recommended Track | Starting Workflow |
|--------------|-------------------|-------------------|
| Bug fix | ⚡ Quick Flow | quick-spec |
| Small feature (2-3 changes) | ⚡ Quick Flow | quick-spec |
| New product/app | 📋 BMad Method | PRD |
| Platform/service | 📋 BMad Method | PRD |
| Enterprise system | 🏢 Enterprise | PRD + enterprise workflows |
| Mobile app | 📋 BMad Method | PRD + UX design |
| API/SDK | 📋 BMad Method | PRD + architecture |
| Game | 📋 BMad Method | GDD (game design doc) |
| Innovation project | 🎨 CIS | brainstorming |

---

## 🎯 Success Formula

1. **Start Right**: Choose appropriate planning track
2. **Plan Well**: Use Planning phase workflows
3. **Design Smart**: Create solid architecture
4. **Build Iteratively**: Implement story by story
5. **Reflect Often**: Use BMad's guided questioning

---

## 🔗 Quick Links

- **GitHub**: https://github.com/bmad-code-org/BMAD-METHOD
- **YouTube**: https://youtube.com/@bmadcode
- **Version**: v6.0.0-alpha.7

---

## 🎬 Get Started Now!

```
"Initialize BMad"
"Show me BMad capabilities"
"Help me plan my project with BMad"
```

**Happy Building!** 🚀

*Build More, Architect Dreams™*
