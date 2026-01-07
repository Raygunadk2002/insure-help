# Peril Timeline POC

A proof-of-concept web application for claims analysis that helps handlers/adjusters analyze Flood and Subsidence claims using **confidence intervals** to represent epistemic uncertainty.

## 🎯 Core Innovation: Confidence Intervals Throughout

Every conclusion, hypothesis, and assessment includes:
- **Point estimate** (e.g., likelihood score 0-1)
- **Confidence interval** (lower/upper bounds)
- **Explanation** of what drives uncertainty
- **Guidance** on how new evidence could narrow the interval

This is NOT statistical probability—it's epistemic uncertainty suitable for claims decision support.

## ⚠️ Critical: Decision Support Only

This tool:
- ✅ Provides working theories and confidence intervals
- ✅ Suggests next actions to reduce uncertainty
- ✅ Tracks how new evidence changes assessments
- ❌ Does NOT approve or deny claims
- ❌ Requires human review and sign-off for all conclusions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
cd peril-timeline-poc
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
peril-timeline-poc/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── case/[id]/page.tsx       # Case detail page with 6 tabs
│   │   ├── page.tsx                  # Home page (cases list)
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── progress.tsx
│   │   ├── confidence-interval-bar.tsx   # CI visualization
│   │   ├── disclaimer.tsx                # Compliance disclaimers
│   │   └── evidence-citation.tsx         # Evidence linking
│   ├── lib/                          # Core logic
│   │   ├── inference/                # Peril-specific inference engines
│   │   │   ├── analyzer.ts          # Main orchestrator
│   │   │   ├── flood-engine.ts      # Flood logic
│   │   │   └── subsidence-engine.ts # Subsidence logic
│   │   ├── timeline/                 # Timeline extraction
│   │   │   └── timeline-builder.ts
│   │   ├── data/                     # Sample data
│   │   │   └── seed-data.ts
│   │   └── utils.ts                  # Utility functions
│   └── types/
│       └── index.ts                  # TypeScript type definitions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## 🎨 Features

### 1. Evidence Ingestion
- Manual entry with metadata (type, source, confidence, date)
- Support for multiple evidence types:
  - FNOL (First Notice of Loss)
  - Photos
  - Reports (engineer, contractor)
  - Sensor data / CSV
  - Weather data
  - Notes

### 2. Timeline Construction
- Automatic event extraction from evidence
- Date normalization and merging
- Contradiction detection
- Confidence scoring per event

### 3. Peril-Specific Inference

#### Flood Engine
Analyzes:
- Rainfall timing vs. damage timing
- Policy period alignment
- Ingress mechanism (flood vs. plumbing leak)
- Reporting delay

**CI Logic:**
- Widens interval when evidence is second-hand or delayed
- Narrows interval when objective data (weather) aligns temporally

#### Subsidence Engine
Analyzes:
- Movement patterns (progressive vs. seasonal)
- Monitoring duration
- Tree/vegetation influence
- Soil characteristics

**CI Logic:**
- Wide intervals when monitoring < 12 months
- Narrows with multi-season data showing clear progressive trend

### 4. Working Theory Output

Each theory includes:
- **Overall Assessment**: Label (likely/borderline/unlikely/unclear) with CI
- **Hypotheses**: Multiple competing theories with CIs
- **Coverage Signals**: Factors that support/weaken coverage, each with CI
- **Uncertainty Drivers**: Explicit list of what makes us uncertain

### 5. Next Actions

Prioritized (1-5) actions showing:
- Action description
- Rationale
- Linked uncertainty driver
- **Expected impact** on CI (narrow/shift/confirm)
- Estimated reduction (low/medium/high)

### 6. Living Timeline with Change Tracking

When new evidence arrives:
- Theory is recomputed
- CIs are recalculated
- Changes are logged:
  - CI narrowed/widened
  - Point estimate shifted
  - Uncertainty drivers resolved/added

### 7. Full Auditability

Every assertion links back to evidence:
- Hypotheses cite supporting/contradicting evidence
- Coverage signals show evidence basis
- Timeline events reference source evidence

## 🗂️ Case Workspace Tabs

1. **Overview**: Overall assessment, CI visualization, uncertainty drivers, case details
2. **Evidence**: All evidence items with metadata, confidence levels
3. **Timeline**: Chronological event visualization with citations
4. **Analysis**: Hypotheses and coverage signals with CIs
5. **Next Actions**: Prioritized actions with expected uncertainty reduction
6. **Change Log**: History of how CIs and estimates have changed

## 📊 Sample Data

Two seed cases are included:

### Flood Case (`case_flood_001`)
- Conflicting timeline (policyholder changed dates)
- Missing weather data
- Possible plumbing leak (alternative cause)
- **Result**: Wide CI (0.25–0.75), clear next actions

### Subsidence Case (`case_subs_001`)
- 6 months monitoring data (insufficient)
- Ambiguous pattern (seasonal + progressive)
- Tree influence noted
- **Result**: Wide CI pending 12-month monitoring

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + lucide-react icons
- **State**: React state (no external state management)
- **Inference**: Rules-based, deterministic (mock mode)
- **Data**: Local seed data (no database required)

## 🔧 Inference Mode

By default, the app runs in **mock inference mode**:
- Rules-based
- Deterministic
- No external API calls
- All logic in TypeScript

To enable real LLM integration (optional):
```bash
# In .env
INFERENCE_MODE=llm
ANTHROPIC_API_KEY=your_key_here
```

*(LLM integration not implemented in this POC—architecture supports it)*

## 🎓 Key Concepts

### Confidence Intervals (Not Bayesian Probabilities)

The CIs in this app are **epistemic uncertainty ranges**:
- Represent uncertainty based on available evidence
- NOT statistical probabilities of settlement
- NOT Bayesian credible intervals
- Suitable for decision support

### Uncertainty-Driven Workflow

The core workflow is:
1. Assess current evidence → Generate theory with CIs
2. Identify uncertainty drivers
3. Prioritize actions by expected CI narrowing
4. Gather new evidence
5. Reassess → Track changes
6. Repeat until CI narrow enough for decision

### Evidence-First Philosophy

Every generated assertion MUST:
- Link back to specific evidence items
- Show confidence level of source evidence
- Explain basis for uncertainty

## 🚧 Limitations (POC)

This is a proof-of-concept. Production readiness would require:
- Database for persistence
- User authentication
- Real file upload (PDF/image parsing)
- OCR for document extraction
- Integration with claims systems
- Audit trail with version control
- Multi-user collaboration
- Advanced visualizations
- Export functionality
- Configurable thresholds

## 📝 Compliance & Language Safety

The app uses:
- ✅ "Working theory", "current best estimate", "confidence interval"
- ✅ "Decision support tool"
- ✅ "Requires human review and sign-off"

The app avoids:
- ❌ "Approve", "reject", "deny"
- ❌ "Probability of settlement"
- ❌ Any language implying automated decisions

## 🧪 Testing the App

1. Run `npm run dev`
2. View the home page showing both sample cases
3. Click on "Flood Claim" case
4. Navigate through the 6 tabs:
   - See wide CI in Overview
   - Review conflicting evidence
   - Check timeline contradictions
   - View hypotheses with CIs
   - See prioritized next actions
5. Repeat for "Subsidence Claim" case
6. Note how each peril has different uncertainty drivers

## 📄 License

This is a proof-of-concept demonstration. Not licensed for production use without review.

## 🤝 Contributing

This is a POC—contributions should focus on:
- Improved CI calculation methods
- Additional peril types
- Better visualization of uncertainty
- Enhanced timeline extraction

---

**Remember**: This tool supports decisions—it does NOT make them. All conclusions require human judgment and sign-off.
