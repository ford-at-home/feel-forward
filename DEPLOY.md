# Feel Forward — Deployment Guide

This version of Feel Forward is **manual and prompt-based**. You can use it locally or in your favorite note-taking app.

Future versions will deploy as a full-stack app using AWS.

---

## Manual Mode (Now)

1. Open `PROMPTS.md`
2. Follow each phase using Claude or ChatGPT
3. Save output between phases in local files (e.g., `preferences.json`, `scenarios.md`, `reactions.txt`)
4. Use the final summary to guide real-world decisions

---

## Future Deployment (Planned)

### App Components

| Component        | Stack                                  |
|------------------|----------------------------------------|
| Frontend         | React + Vite                           |
| Backend API      | FastAPI (Python)                       |
| Agents           | LangChain or Semantic Kernel           |
| Orchestration    | AWS Lambda + Step Functions (optional) |
| Storage          | DynamoDB or S3                         |
| Auth             | Cognito (optional)                     |

### Deployment Steps (future)

1. `cdk deploy` to provision backend (API, agents, storage)
2. Deploy frontend to S3 + CloudFront
3. Add CI/CD via GitHub Actions
4. Enable Bedrock, Claude, or OpenAI for agent runtime

---

## Local Dev Plan

- CLI version (`feel-forward-cli`) in Python to run phase-by-phase
- Store user state as local JSON
- Use `.prompt` files as templates

---

## Notes

- Manual mode works offline, privacy-friendly
- Can be integrated with journaling workflows, Notion, or Obsidian
