🛠️ Contributing to Stark Insured Backend
Welcome to the Stark Insured Backend – the decentralized backend service powering Stark Insured, a tamper-proof, transparent, and automated insurance platform built on the StarkNet blockchain.

We appreciate your interest in contributing to our open-source mission. Whether you're building a feature, fixing a bug, or writing documentation, you're helping build the future of decentralized insurance!

⚙️ Setup Instructions
1. Clone the Repository
git clone https://github.com/Stark-Insured/Stark-Insured-Backend.git

2. cd Stark-Insured-Backend
  
3. Install Dependencies
npm install

4. Configure Environment Variables
Create a .env file in the root directory based on .env.example:

5. Start the Development Server
npm run start:dev
The application runs at:
📍 http://localhost:3000

🛰️ Running Services
🛢️ PostgreSQL Database (local or Docker)

📄 Swagger UI for API docs at http://localhost:3000/api

🌐 StarkNet node for blockchain connectivity

💅 Code Style Guidelines
Write idiomatic TypeScript.

Follow NestJS's modular, service-controller architecture.

Use Prettier and ESLint for linting and formatting.

Maintain consistent naming conventions and folder structures.

🌳 Git Workflow
Branching Strategy
main: Production-ready code

develop: Latest tested features

feature/*: Feature development branches

bugfix/*: Fixes for issues or regressions

Commit Messages (Use Conventional Commits)
feat: New features (feat: add DAO voting API)

fix: Bug fixes (fix: oracle timeout handler)

chore: Routine maintenance (chore: update dependencies)

Pull Requests
Ensure the code compiles and passes all checks

Include relevant unit or integration tests

Link related issues in the PR description

Keep PRs focused and well-scoped

✅ Testing Guidelines
Framework: Jest

Test Types:

Unit Tests: Individual service, logic, or controller testing

Integration Tests: Module-level and service interaction testing

Run Tests
npm run test

📚 Documentation
Auto-generated API docs via Swagger

Add module-specific docs in src/modules/{module}/README.md

Keep the main README.md up-to-date with usage and architecture

🔒 Security Guidelines
Use environment variables for all sensitive data

Implement JWT-based authentication

Validate input with class-validator

🤝 Contribute to Decentralized Insurance
Stark Insured is more than code — it's a community. Join us in building a trustless insurance ecosystem where users govern, oracles verify, and smart contracts protect.

