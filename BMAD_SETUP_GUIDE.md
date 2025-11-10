# BMad Framework Installation Guide

## ✅ Installation Complete!

BMad CORE v6.0.0-alpha.7 has been successfully installed to your project.

## What Was Installed

### 1. BMad Framework Directory (`bmad/`)

```
bmad/
├── core/          # BMad CORE framework + BMad Master orchestrator
├── bmm/           # BMad Method (AI-driven agile development)
│   ├── agents/   # 12 specialized agents
│   ├── workflows/ # 34 workflows across 4 phases
│   ├── tasks/    # Reusable tasks
│   └── docs/     # Documentation
├── bmb/           # BMad Builder (create custom solutions)
├── cis/           # Creative Intelligence Suite (innovation)
├── _cfg/          # Your customizations (survives updates)
│   └── agents/   # Agent customization files
└── docs/          # General documentation
```

### 2. Claude Code Skill (`.claude/skills/bmad-core/`)

A Claude Code skill has been created to integrate BMad into your development workflow. The skill provides:
- Access to all BMad agents and workflows
- Guided workflow execution
- Context-aware assistance
- Scale-adaptive planning (3 tracks)

### 3. Package Dependencies

BMad Method package installed to `node_modules/bmad-method/` (dev dependency).

---

## How to Use BMad

### Method 1: Natural Language (Recommended)

Just talk to Claude normally:

```
"Help me start a new project with BMad"
"I need to fix a bug using BMad Method"
"Run the PRD workflow"
"Load the Product Manager agent"
"Brainstorm ideas for my app"
```

Claude will automatically use the BMad skill to assist you.

### Method 2: Skill Activation

If the skill doesn't activate automatically:

1. In Claude Code, use the command palette
2. Select "Skills"
3. Activate "BMad CORE + BMad Method"

---

## Getting Started Workflows

### For New Projects (Full Product/Platform)

**Use: BMad Method Track**

1. **Start**: "Initialize BMad for a new product"
2. **Phase 2 - Planning**:
   - Load PM agent
   - Run PRD workflow (`bmad/bmm/workflows/2-plan-workflows/prd/`)
   - Creates comprehensive Product Requirements Document
3. **Phase 3 - Solutioning**:
   - Load Architect agent
   - Run architecture workflow (`bmad/bmm/workflows/3-solutioning/architecture/`)
   - Design system architecture
4. **Phase 4 - Implementation**:
   - Load Scrum Master agent
   - Run create-stories workflow
   - Load Developer agent
   - Run dev-story workflow (iterative)

**Timeline**: Hours to days for planning, iterative implementation

### For Bug Fixes / Small Features

**Use: Quick Flow Track**

1. **Start**: "I need to fix a bug" or "Add a small feature"
2. **Quick Spec**:
   - Load Developer agent
   - Run quick-spec workflow (`bmad/bmm/workflows/2-plan-workflows/quick-spec/`)
   - Creates fast technical specification
3. **Implementation**:
   - Run dev-story workflow
   - Implement changes

**Timeline**: Minutes to hours

### For Brainstorming / Innovation

**Use: Creative Intelligence Suite**

1. **Start**: "Help me brainstorm ideas"
2. **Select Method**:
   - Brainstorming (30+ techniques)
   - Design Thinking (human-centered)
   - Problem Solving (breakthrough solutions)
   - Innovation Strategy (business models)
   - Storytelling (narratives)
3. **Execute**:
   - Load appropriate CIS agent
   - Run workflow with guided facilitation

**Timeline**: 30 minutes to 2 hours per session

---

## BMad Method Planning Tracks

BMad automatically adapts to your project scale:

### 1. Quick Flow Track ⚡
- **For**: Bug fixes, 2-3 related changes, rapid prototyping
- **Planning**: Tech spec only (quick-spec workflow)
- **Time**: Minutes to hours
- **Output**: Technical specification → Implementation

### 2. BMad Method Track 📋
- **For**: New products, platforms, complex features
- **Planning**: PRD + Architecture + UX (optional)
- **Time**: Hours to days for planning
- **Output**: PRD → Architecture → Stories → Implementation

### 3. Enterprise Method Track 🏢
- **For**: Enterprise requirements, compliance, high security
- **Planning**: BMad Method + Security/DevOps/Test strategy
- **Time**: Days to weeks for planning
- **Output**: Full planning suite + enterprise workflows

**Not sure which track?** Run `workflow-init` and BMad will analyze your goal and recommend the right track.

---

## BMad Method Agents

### Development Team (BMM)

1. **Product Manager (PM)**
   - File: `bmad/bmm/agents/pm.agent.yaml`
   - Role: Product vision, PRDs, roadmaps, stakeholder management

2. **Analyst**
   - File: `bmad/bmm/agents/analyst.agent.yaml`
   - Role: Requirements analysis, brainstorming, research

3. **Architect**
   - File: `bmad/bmm/agents/architect.agent.yaml`
   - Role: System design, technical architecture, patterns

4. **Scrum Master (SM)**
   - File: `bmad/bmm/agents/sm.agent.yaml`
   - Role: Story breakdown, sprint planning, agile facilitation

5. **Developer (Dev)**
   - File: `bmad/bmm/agents/dev.agent.yaml`
   - Role: Code implementation, refactoring, debugging

6. **Test Architect (TEA)**
   - File: `bmad/bmm/agents/tea.agent.yaml`
   - Role: Test strategy, quality assurance, test planning

7. **UX Designer**
   - File: `bmad/bmm/agents/ux-designer.agent.yaml`
   - Role: User experience, UI design, prototyping

8. **Technical Writer**
   - File: `bmad/bmm/agents/tech-writer.agent.yaml`
   - Role: Documentation, guides, API docs

### Creative Team (CIS)

1. **Brainstorming Coach** - Facilitated idea generation
2. **Design Thinking Coach** - Human-centered problem solving
3. **Creative Problem Solver** - Breakthrough techniques
4. **Innovation Strategist** - Disruptive business models
5. **Storyteller** - Compelling narratives

### Builder (BMB)

1. **BMad Builder** - Create custom agents, workflows, modules

---

## Common Use Cases

### Use Case 1: Starting a New SaaS Product

```
You: "I want to build a SaaS product using BMad Method"

Claude (with BMad skill):
1. Loads BMad Master to orchestrate
2. Suggests BMad Method Track
3. Starts with PRD workflow
4. Guides through product planning
5. Creates architecture design
6. Breaks down into stories
7. Implements iteratively
```

### Use Case 2: Fixing a Critical Bug

```
You: "I have a critical bug in the authentication system"

Claude (with BMad skill):
1. Recognizes Quick Flow track is appropriate
2. Loads Developer agent
3. Runs quick-spec to analyze and plan fix
4. Runs dev-story to implement fix
5. Suggests testing approach
```

### Use Case 3: Innovation Workshop

```
You: "I need to brainstorm new features for my app"

Claude (with BMad skill):
1. Loads Brainstorming Coach from CIS
2. Runs brainstorming workflow
3. Offers 30+ brainstorming techniques
4. Facilitates structured ideation
5. Helps prioritize and refine ideas
```

---

## Workflow Structure

Every BMad workflow includes:

```
bmad/bmm/workflows/[phase]/[workflow-name]/
├── workflow.yaml       # Workflow metadata and configuration
├── instructions.md     # Step-by-step execution guide
├── checklist.md        # Progress tracking checklist
├── template.md         # Output template (if applicable)
├── *.csv              # Reference data
└── *.md               # Supporting documentation
```

### How to Execute a Workflow

1. **Identify Workflow**: Choose appropriate workflow for your goal
2. **Read Metadata**: Check `workflow.yaml` for requirements
3. **Follow Instructions**: Read `instructions.md` step-by-step
4. **Track Progress**: Use `checklist.md` to mark completion
5. **Use Templates**: Reference `template.md` for output format
6. **Reference Data**: Check CSV files for examples and guidance

---

## Customization

### Customize Agents

Create or edit files in `bmad/_cfg/agents/`:

```yaml
# bmad/_cfg/agents/pm.customize.yaml
name: "Senior PM Alex"
role: "Principal Product Manager"
personality: "Strategic, data-driven, customer-focused"
communication_style: "Clear, structured, executive-level"
expertise:
  - "SaaS products"
  - "B2B enterprise"
  - "API platforms"
language:
  communication: "en"  # Language for talking to you
  output: "en"         # Language for documentation
```

### Customize Per Module

- Global config: `bmad/_cfg/`
- Module-specific: Each module has its own configuration

Your customizations persist through BMad updates!

---

## Documentation

### Quick Links

1. **BMad Method Quick Start**: `bmad/bmm/docs/quick-start.md`
2. **Complete Documentation Hub**: `bmad/bmm/docs/`
3. **Agents Guide**: `bmad/bmm/docs/agents/` (45 min read)
4. **34 Workflow Guides**: `bmad/bmm/docs/workflows/`
5. **Module Overview**: `bmad/bmm/README.md`

### External Resources

- GitHub: https://github.com/bmad-code-org/BMAD-METHOD
- YouTube: https://youtube.com/@bmadcode (videos coming soon!)
- Documentation: Check `bmad/docs/` directories

---

## Troubleshooting

### BMad skill not activating?

1. Verify `.claude/skills/bmad-core/` exists
2. Check `skill.md` file is present
3. Restart Claude Code
4. Manually activate skill via command palette

### Agent files not loading?

1. Verify `bmad/bmm/agents/*.agent.yaml` files exist
2. Check file permissions
3. Verify YAML syntax if edited

### Workflow not found?

1. Check workflow path: `bmad/bmm/workflows/[phase]/[name]/`
2. Verify `instructions.md` exists
3. Consult `bmad/bmm/docs/workflows/` for workflow list

---

## Advanced Features

### Party Mode (Multi-Agent Collaboration)

Run workflows with the entire team collaborating:

```
You: "Run party mode for this architecture decision"

Claude:
1. Activates party mode
2. Loads all relevant agents
3. Each agent provides their perspective
4. Synthesizes diverse viewpoints
5. Helps you make informed decisions
```

### Document Sharding (Large Projects)

For massive projects, BMad supports document sharding:

- Splits large documents by headings
- Loads only needed sections (90%+ token savings)
- Automatic in Phase 4 workflows
- See `bmad/docs/document-sharding.md` for setup

---

## Philosophy: C.O.R.E.

BMad CORE stands for:

- **C**ollaboration: Human-AI partnership leveraging complementary strengths
- **O**ptimized: Battle-tested processes for maximum effectiveness
- **R**eflection: Strategic questioning that unlocks breakthrough solutions
- **E**ngine: Framework orchestrating 19+ specialized agents and 50+ workflows

**Remember**: BMad doesn't give you answers—it helps you discover better solutions through guided reflection.

---

## Next Steps

1. **Explore Documentation**: Start with `bmad/bmm/docs/quick-start.md`
2. **Try a Workflow**: Pick a simple workflow to get familiar
3. **Customize Agents**: Personalize agents in `bmad/_cfg/agents/`
4. **Start Building**: Use BMad for your next project!

---

## Version Information

- **BMad Method**: v6.0.0-alpha.7 (Alpha Release)
- **Installation Date**: November 10, 2024
- **Installation Method**: Manual setup with skill integration
- **Modules Installed**: CORE, BMM, BMB, CIS

---

## Support & Feedback

- **Issues**: https://github.com/bmad-code-org/BMAD-METHOD/issues
- **Discussions**: GitHub Discussions
- **Updates**: Subscribe to BMadCode YouTube channel

---

## What Makes BMad Special?

1. **Scale-Adaptive**: Automatically adjusts from bug fixes to enterprise systems
2. **Reflection-Driven**: Doesn't just execute—helps you think better
3. **Battle-Tested**: Proven methodologies from real-world projects
4. **Update-Safe**: Your customizations survive all updates
5. **Domain Agnostic**: Works for any field (software, business, creative, etc.)

---

## Ready to Start?

Just say:

```
"Initialize BMad for my project"
"Help me understand BMad Method"
"Show me available workflows"
"Load the Product Manager agent"
"Run a brainstorming session"
```

Claude will guide you through the BMad framework!

---

**Happy Building!** 🚀

*Build More, Architect Dreams™*
