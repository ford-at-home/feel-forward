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
| Agents           | Strands agents library                 |
| Orchestration    | AWS Lambda + Step Functions (optional) |
| Storage          | DynamoDB or S3                         |
| Auth             | Cognito (optional)                     |

### Deployment Steps (future)

1. `cdk deploy` to provision backend (API, agents, storage)
2. Deploy frontend to S3 + CloudFront
3. Add CI/CD via GitHub Actions
4. Enable Bedrock, Claude, or OpenAI for agent runtime

## AWS Deployment Quickstart

The backend can be deployed to AWS using Docker, Amazon ECR, and ECS Fargate. These steps assume the AWS CLI is installed and that your credentials are available in `~/.aws/credentials`.

1. **Build the Docker image**
   ```bash
   docker build -t feel-forward .
   ```
2. **Create an ECR repository** (skip if it already exists)
   ```bash
   aws ecr create-repository --repository-name feel-forward --region us-west-2
   ```
3. **Push the image to ECR**
   ```bash
   AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   aws ecr get-login-password --region us-west-2 | \
   docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com
   docker tag feel-forward:latest $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/feel-forward:latest
   docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/feel-forward:latest
   ```
4. **Register the ECS task definition** using a file like `ecs-task.json`:
   ```json
   {
     "family": "feel-forward-task",
     "networkMode": "awsvpc",
     "cpu": "256",
     "memory": "512",
     "requiresCompatibilities": ["FARGATE"],
     "containerDefinitions": [{
       "name": "feel-forward",
       "image": "<image-uri>",
       "portMappings": [{"containerPort": 8000}],
       "environment": [{"name": "OPENAI_API_KEY", "value": "<your-key>"}],
       "essential": true
     }]
   }
   ```
   ```bash
   aws ecs register-task-definition --cli-input-json file://ecs-task.json
   ```
5. **Create the ECS cluster and service** (replace subnet and security group IDs):
   ```bash
   aws ecs create-cluster --cluster-name feel-forward
   aws ecs create-service \
     --cluster feel-forward \
     --service-name feel-forward \
     --task-definition feel-forward-task \
     --launch-type FARGATE \
     --desired-count 1 \
     --network-configuration 'awsvpcConfiguration={subnets=[subnet-abc123],securityGroups=[sg-abc123],assignPublicIp=ENABLED}'
   ```
6. **Access the service** using the assigned load balancer URL or public IP.

---

## Local Dev Plan

- CLI version (`feel-forward-cli`) in Python to run phase-by-phase
- Store user state as local JSON
- Use `.prompt` files as templates

---

## Notes

- Manual mode works offline, privacy-friendly
- Can be integrated with journaling workflows, Notion, or Obsidian
