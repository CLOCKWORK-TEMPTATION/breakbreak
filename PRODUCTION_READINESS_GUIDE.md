# Production Readiness Report Generator

## Overview

The Production Readiness Report Generator is an automated tool that analyzes your repository and generates a comprehensive assessment of your application's readiness for production deployment. It evaluates 10 critical engineering domains and provides actionable recommendations in Arabic.

## Features

- **Automated Repository Analysis**: Scans your codebase for key files, configurations, and patterns
- **10-Domain Evaluation Framework**: Comprehensive assessment across:
  1. الوظائف الأساسية (Core Functionality)
  2. الأداء (Performance)
  3. الأمان (Security)
  4. البنية التحتية (Infrastructure)
  5. المراقبة والسجلات (Monitoring & Logging)
  6. النسخ الاحتياطي والاستعادة (Backup & Recovery)
  7. التوثيق (Documentation)
  8. الاختبار (Testing)
  9. التوافق (Compatibility)
  10. الامتثال (Compliance)
- **AI-Ready Prompt Generation**: Creates a detailed prompt for AI services to generate comprehensive reports
- **Arabic Language Support**: All reports and recommendations are provided in professional Arabic
- **Prioritized Recommendations**: P0 (Critical) to P3 (Low) priority classification

## Architecture

### Backend Module Structure

```
apps/backend/src/modules/readiness/
├── dto/
│   └── generate-report.dto.ts       # Data Transfer Objects
├── readiness.controller.ts          # API endpoints
├── readiness.service.ts             # Main service orchestration
├── readiness.module.ts              # NestJS module definition
├── repository-analysis.service.ts   # Repository scanning & analysis
└── prompt-generator.service.ts      # AI prompt generation
```

### API Endpoints

#### Generate Production Readiness Report

**POST** `/readiness/generate`

**Request Body:**
```json
{
  "owner": "CLOCKWORK-TEMPTATION",      // Optional: Repository owner
  "repo": "breakbreak",                  // Optional: Repository name
  "repositoryPath": "/path/to/repo"     // Optional: Path to repository
}
```

**Response:**
```json
{
  "metadata": {
    "reportDate": "2026-01-05",
    "repository": "CLOCKWORK-TEMPTATION/breakbreak",
    "primaryLanguages": ["TypeScript", "JavaScript"]
  },
  "summary": "...",
  "overallStatus": "conditional",
  "overallScore": "0",
  "readinessLevel": "...",
  "domains": [],
  "criticalIssues": [],
  "recommendations": {
    "immediate": [],
    "shortTerm": [],
    "mediumTerm": [],
    "longTerm": []
  },
  "conclusion": "...",
  "prompt": "...",           // AI prompt for full report generation
  "analysisData": {...}     // Repository analysis data
}
```

#### Health Check

**GET** `/readiness/health`

**Response:**
```json
{
  "status": "ok",
  "message": "Production Readiness Service is running"
}
```

## Usage

### Method 1: Using the CLI Script

1. Start the backend server:
```bash
cd apps/backend
pnpm run dev
```

2. In a new terminal, run the generator:
```bash
node generate-readiness-report.js
```

**CLI Options:**
```bash
node generate-readiness-report.js \
  --owner CLOCKWORK-TEMPTATION \
  --repo breakbreak \
  --path /path/to/repo \
  --output report.json
```

### Method 2: Direct API Call

Using curl:
```bash
curl -X POST http://localhost:3000/readiness/generate \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "CLOCKWORK-TEMPTATION",
    "repo": "breakbreak",
    "repositoryPath": "/home/runner/work/breakbreak/breakbreak"
  }'
```

Using JavaScript/TypeScript:
```typescript
const response = await fetch('http://localhost:3000/readiness/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    owner: 'CLOCKWORK-TEMPTATION',
    repo: 'breakbreak',
    repositoryPath: process.cwd()
  })
});

const report = await response.json();
console.log(report);
```

### Method 3: Using the Service Directly

```typescript
import { ReadinessService } from './modules/readiness/readiness.service';
import { RepositoryAnalysisService } from './modules/readiness/repository-analysis.service';
import { PromptGeneratorService } from './modules/readiness/prompt-generator.service';

const repositoryAnalysisService = new RepositoryAnalysisService();
const promptGeneratorService = new PromptGeneratorService();
const readinessService = new ReadinessService(
  repositoryAnalysisService,
  promptGeneratorService
);

const report = await readinessService.generateReport(
  'CLOCKWORK-TEMPTATION',
  'breakbreak',
  '/path/to/repo'
);
```

## Repository Analysis

The system automatically detects and analyzes:

### Configuration Files
- `package.json` - Node.js dependencies and scripts
- `requirements.txt` - Python dependencies
- `pyproject.toml` - Python project configuration
- `Dockerfile` - Container configuration
- `.gitignore` - Version control exclusions

### Quality Assurance
- Test files (`.spec.ts`, `.test.js`, `test_*.py`, etc.)
- CI/CD pipelines (GitHub Actions, GitLab CI, CircleCI, Azure Pipelines)

### Documentation
- `README.md` - Project documentation
- API documentation
- Architecture documentation

### File Structure
- Directory organization
- Source code structure
- Primary programming languages

## AI Prompt Generation

The generated prompt is designed for use with AI services like:
- OpenAI GPT-4
- Google Gemini
- Anthropic Claude
- Other LLMs with Arabic language support

The prompt includes:
- Repository structure and metrics
- File content analysis
- Comprehensive evaluation criteria for all 10 domains
- Detailed instructions for report generation in Arabic
- JSON schema for standardized output

## Evaluation Framework

### Assessment Levels

Each domain is evaluated as:
- **ready** (جاهز): Meets all basic criteria, production-ready
- **conditional** (جاهز بشروط): Needs minor to moderate improvements
- **not-ready** (غير جاهز): Critical gaps preventing deployment
- **unknown** (غير محدد): Insufficient information

### Priority System

Recommendations are prioritized as:
- **P0 (Critical)**: Must be addressed before deployment
- **P1 (High)**: Should be addressed soon - affects stability/security
- **P2 (Medium)**: Recommended for near-term - improves quality
- **P3 (Low)**: Optional improvements for future consideration

## Testing

Run the test suite:
```bash
cd apps/backend
pnpm run test -- readiness
```

Test coverage includes:
- Repository analysis functionality
- Prompt generation accuracy
- API endpoint responses
- Service integration

## Example Output

The generator produces:

1. **Analysis Data**: Raw metrics about the repository
2. **AI Prompt**: Comprehensive prompt in Arabic for full report generation
3. **Metadata**: Repository info, languages, date
4. **Summary Information**: Quick overview of findings

To get a complete production readiness report, use the generated prompt with an AI service that supports Arabic language.

## Integration with AI Services

### Using with OpenAI

```javascript
const report = await fetch('http://localhost:3000/readiness/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ repositoryPath: process.cwd() })
}).then(r => r.json());

// Use the prompt with OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "user", content: report.prompt }
  ],
  temperature: 0.3,
});

const fullReport = JSON.parse(completion.choices[0].message.content);
```

### Using with Google Gemini

```javascript
const report = // ... get report as above

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const result = await model.generateContent(report.prompt);
const fullReport = JSON.parse(result.response.text());
```

## Development

### Adding New Analysis Criteria

1. Update `repository-analysis.service.ts` to detect new patterns
2. Modify `prompt-generator.service.ts` to include new criteria
3. Add corresponding tests
4. Update documentation

### Extending Evaluation Domains

The 10-domain framework can be customized by modifying the prompt template in `prompt-generator.service.ts`.

## Best Practices

1. **Run before major deployments**: Generate reports before production releases
2. **Track over time**: Compare reports to measure improvement
3. **Address P0 issues immediately**: Never deploy with critical issues
4. **Regular assessments**: Run monthly or quarterly reviews
5. **Share with team**: Use reports for engineering discussions

## Troubleshooting

### Backend Server Not Running
```bash
# Start the backend
cd apps/backend
pnpm run dev
```

### Missing Dependencies
```bash
# Install all dependencies
pnpm install

# Generate Prisma client
cd apps/backend
npx prisma generate
```

### Port Already in Use
Update the port in the CLI script or change the backend port in `apps/backend/src/main.ts`.

## License

This feature is part of the Break Break project and follows the same license terms.
