# Web App — Simple Node/Express + SQLite app for CI/CD assignment

A small example Node.js web application used for teaching/assignment CI/CD concepts. It includes a simple user list (SQLite DB), EJS views, basic styling, Dockerfiles to containerize the app and Selenium tests, and a Jenkinsfile that demonstrates a Docker-based pipeline (build, run, run UI tests).

## Key capabilities

**Web app (Express) serving:**
- Home  page (`/`)
- Users listing (`/users`)
- New user form (`/users/new`)
- Create user (`POST /users`)

**SQLite database** with automatic schema creation and seed data

**EJS templates** for server-side rendered views

**Static assets** (CSS) under `public`

**Containerized app** via `Dockerfile`

**Containerized Selenium test runner** via `Dockerfile.selenium`

**CI pipeline** in `Jenkinsfile` that:
- Checks out the repo
- Builds the app image
- Runs the app container on a temporary Docker network
- Builds the Selenium tests image and runs tests against the app container on the same network
- Cleans up containers and network after run

## Repository layout (important files)

- `app.js` — Express server and route definitions (GET `/`, GET `/users`, GET `/users/new`, POST `/users`). Listens on port 3000.
- `db.js` — SQLite connection, creates `users` table if missing, seeds sample users if table empty.
- `views/` — EJS templates:
  - `index.ejs` — homepage
  - `users.ejs` — list users page
  - `new_user.ejs` — new user form
- `public/` — static assets (e.g., `styles.css`)
- `package.json` — npm scripts and dependencies
- `Dockerfile` — containerizes the app (based on node:18-alpine)
- `Dockerfile.selenium` — builds a test image with Chromium + chromedriver + dev dependencies to run Selenium tests in CI
- `selenium/` — Selenium + Mocha tests:
  - `home_and_users.test.js` — navigation + users list
  - `create_user.test.js` — create-user flow
- `Jenkinsfile` — Declarative Jenkins pipeline demonstrating Docker-based stages
- `README.md` — (this file) documentation and run instructions

## Requirements (developer machine / CI)

- **Node.js** (v18 recommended)
- **npm**
- **Docker** (for Docker-based runs)
- For running Selenium tests locally: **Google Chrome** + matching **chromedriver** OR use the `Dockerfile.selenium` container (recommended)
- **Jenkins** with Docker installed on Jenkins agent (for the Jenkinsfile pipeline)

## Run locally (development)

### Install dependencies

```powershell
npm install
```

### Start the app

```powershell
npm start
```

Open http://localhost:3000 in your browser.

### Quick DB check

```powershell
npm start
# In another terminal:
node -e "const db = require('./db'); db.all('SELECT * FROM users', [], (e, r) => console.log(r));"
```

## Run inside Docker (recommended for CI parity)

### Build and run the app image:

```powershell
docker build -t web-app:local .
docker run -p 3000:3000 web-app:local
```

### Confirm app is reachable from host:

Open http://localhost:3000 in your browser or:

```powershell
curl http://localhost:3000
```

## Run Selenium tests in Docker (recommended)

The tests are designed to run inside a container so they have a browser available and the CI job is reproducible.

### Build the Selenium tests image:

```powershell
docker build -f Dockerfile.selenium -t web-app-tests:local .
```

### Run tests container on the same network as the app and point tests to the app container name using BASE_URL:

```powershell
# Create network
docker network create webapp_net

# Run app container
docker run -d --name webapp_app --network webapp_net web-app:local

# Run tests (pointing to app container)
docker run --rm --network webapp_net -e BASE_URL=http://webapp_app:3000 web-app-tests:local

# Cleanup
docker stop webapp_app
docker rm webapp_app
docker network rm webapp_net
```

**Notes:**
- Tests default to `BASE_URL=http://127.0.0.1:3000` if the environment variable is not provided. In CI the Jenkins pipeline passes `BASE_URL=http://webapp_app:3000`.
- The Selenium Docker image installs Debian Chromium + chromium-driver so versions match and avoid chromedriver mismatch issues.

## Run Selenium tests locally (without Docker)

You may run tests locally if:
1. You have Chrome installed, and
2. You have `chromedriver` matching your Chrome version available on PATH.

Install dev dependencies and run mocha:

```powershell
npm install
npm test
```

If you see WebDriver or chromedriver errors, prefer the Docker method above.

## Jenkins CI (what Jenkinsfile does)

The included `Jenkinsfile` demonstrates a simple Docker-based pipeline:

1. **Checkout** repository
2. **Build** step (placeholder for real build)
3. **Test** step (placeholder)
4. **Deploy** step (packages public into `deploy/artifacts.tgz`)
5. **Docker: Build App Image** — builds `web-app:ci`
6. **Docker: Run App Container** — creates a network `webapp_net`, runs `webapp_app` in background and waits for readiness
7. **Docker: Build Selenium Tests Image** — builds `web-app-tests:ci` from `Dockerfile.selenium`
8. **Docker: Run Selenium Tests** — runs the tests container on the same `webapp_net`, passing `BASE_URL=http://webapp_app:3000`
9. **Post** — cleans up containers and network

This pipeline requires the Jenkins agent to have Docker and permission to run Docker CLI.

## Common troubleshooting

**Tests failing with `net::ERR_CONNECTION_REFUSED`:**
- In containers, `127.0.0.1` resolves to the local container. Ensure tests use `BASE_URL=http://<app-container-name>:3000` and run on same Docker network.
- Jenkinsfile has been updated to run the test container with `-e BASE_URL=http://webapp_app:3000` and `--network webapp_net`.

**Chromium/Chromedriver mismatch or LATEST_RELEASE 404:**
- The Selenium Dockerfile uses Debian packages `chromium` + `chromium-driver` to avoid mismatch. If you manually install Chrome and chromedriver, ensure major versions match.

**Docker image build is large for Selenium tests (~1.6GB in previous runs):**
- This is expected because Chromium and many libraries are installed. CI nodes need enough disk space.

**apt prompts during docker build (debconf/TERM warnings):**
- These are usually harmless during non-interactive builds. The Dockerfile uses non-interactive install and cleans `/var/lib/apt/lists/*`.

**Jenkins: "Selected Git installation does not exist" / "The recommended git tool is: NONE":**
- Ensure Git is installed on the Jenkins agent and configured as a tool or that the default PATH includes `git`.

**Tests timeouts:**
- Increase mocha timeouts if necessary (tests use `--timeout 15000`). You can raise it in `package.json` test script or test files.

## Developer notes & extensions

**Linting & unit tests:**
- The project currently lacks an ESLint configuration and unit tests with supertest. Add ESLint (`npm i -D eslint`) and a lint script, plus mocha/supertest unit tests for API routes, and wire them into Jenkins as "Lint" and "Unit Test" stages.

**Environment & configuration:**
- The app listens on port 3000 by default. For production, consider reading `PORT` from environment variables and using a proper DB (Postgres/MySQL) instead of file-based SQLite.

**Database:**
- `db.js` creates `database.sqlite3` in repo root. For CI, you may want to mount a Docker volume or use an in-memory DB during tests.

**Security:**
- This sample stores emails and names without validation or sanitization — fine for learning and demo but not for production. Add server-side validation, sanitization, and CSRF protection for any real deployment.

## Contact & next steps

If you want:
- I can add ESLint + a lint stage to the Jenkinsfile.
- Add supertest unit tests and a Unit Testing stage (I can implement two quick unit tests).
- Convert the Jenkins pipeline to use Docker-in-Docker or a Kubernetes runner depending on your CI infra.

---

**Made for DevOps CI/CD learning and assignments.**
