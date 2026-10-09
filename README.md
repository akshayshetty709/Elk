# ELK + Jenkins Real-World DevOps Practice Project

This lab simulates a small Node.js API deployed with Docker Compose by Jenkins. The API writes structured JSON logs. Filebeat ships the logs to Logstash, Elasticsearch indexes them, and Kibana lets you investigate a deliberately simulated outage.

## What you will practice
- Jenkins pipeline: checkout -> test -> build image -> deploy -> smoke test
- Docker Compose app deployment
- JSON application logging
- Filebeat -> Logstash -> Elasticsearch -> Kibana
- Finding an HTTP 500 failure in Kibana and verifying recovery
- Basic operational troubleshooting

## Architecture

Browser/curl -> Node.js API container -> JSON logs in `./logs`
                                      |
                               Filebeat container
                                      |
                                  Logstash
                                      |
                               Elasticsearch
                                      |
                                   Kibana

Jenkins runs the pipeline and deploys the app with Docker Compose.

## Prerequisites
- Linux VM or EC2 Ubuntu host with Docker Engine and Docker Compose plugin
- Jenkins with Pipeline, Git, and credentials configured
- Git installed
- At least 4 GB RAM available for this small lab; 6-8 GB is more comfortable
- Ports 3000, 5601, and 8080 accessible only from your trusted IP/network
- This lab is for practice only. Do not expose Elasticsearch or Kibana publicly.

> Compatibility note: the Compose file pins Elastic components to 8.15.3 for a reproducible lab. For production, select a currently supported version and follow the vendor's current documentation. Elastic security is disabled here only to simplify an isolated learning environment.

## Quick start (manual run first)
1. Unzip the project on your Docker host.
2. From the project root, run:
   ```bash
   mkdir -p logs
   chmod +x scripts/*.sh
   docker compose up -d --build
   ```
3. Wait for Elasticsearch and Kibana to become healthy/ready:
   ```bash
   docker compose ps
   docker compose logs -f elasticsearch kibana
   ```
4. Check the API:
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/
   ```
5. Open Kibana at `http://YOUR_HOST:5601`.
6. In Kibana, go to **Stack Management -> Data Views -> Create data view**:
   - Name: `practice-logs`
   - Index pattern: `practice-logs-*`
   - Timestamp field: `@timestamp`
7. Generate traffic:
   ```bash
   ./scripts/generate-traffic.sh
   ```
8. Trigger a simulated application failure:
   ```bash
   curl -i http://localhost:3000/fail
   ```
   Expected: HTTP 500 and a JSON error response.
9. In Kibana Discover, choose `practice-logs` and search:
   ```text
   log.level : "ERROR"
   ```
   Or search for:
   ```text
   message : "Simulated database connection failure"
   ```
10. Recover by disabling failure mode:
   ```bash
   curl -X POST http://localhost:3000/admin/failure-mode/off
   curl http://localhost:3000/health
   ```
   Then verify new successful requests in Kibana.

## Jenkins setup
### Option A: Jenkins on the same Docker host
- Put the repository in Git (GitHub/GitLab or your internal Git server).
- Create a Jenkins Pipeline job pointing to this repository and `Jenkinsfile`.
- Ensure the Jenkins agent can execute Docker commands and can access the Docker daemon.
- Ensure the workspace contains the project files before running the pipeline.
- Configure these Jenkins environment variables if needed:
  - `APP_PORT` (default `3000`)
  - `COMPOSE_PROJECT_NAME` (default `elk-practice`)
- Run **Build Now**.

### Option B: Jenkins on a separate VM
The Jenkins agent needs Docker access on the deployment host. Prefer a dedicated SSH deploy user and controlled remote deployment rather than granting broad privileges. This sample Jenkinsfile assumes the Jenkins agent is running on the same host as Docker Compose. Adapt the deploy stage for SSH/Ansible if your setup separates Jenkins and the target host.

## Pipeline behavior
1. Checkout source (Jenkins Pipeline SCM).
2. Run the Node.js unit test.
3. Build the Docker image.
4. Start/update app and logging services with Docker Compose.
5. Run a health-check smoke test.
6. Print URLs for the app and Kibana.

## Useful commands
```bash
docker compose ps
docker compose logs -f app
docker compose logs -f filebeat logstash
docker compose logs -f elasticsearch kibana
curl -s http://localhost:3000/health
curl -i http://localhost:3000/fail
docker compose down
```

## Troubleshooting
- **Kibana is not ready:** wait a few minutes and inspect `docker compose logs kibana`.
- **Elasticsearch exits/restarts:** check RAM and disk; inspect `docker compose logs elasticsearch`.
- **No logs in Kibana:** check `docker compose ps`, Filebeat and Logstash logs, then confirm the data view pattern is `practice-logs-*`.
- **Filebeat cannot read logs:** ensure `./logs` exists and is readable by the container.
- **Jenkins gets Docker permission denied:** configure the Jenkins agent's Docker access carefully; do not blindly make the Docker socket world-writable.
- **Port already in use:** change the host-side port mapping in `docker-compose.yml`.
- **Old log data:** remove the lab index/data volume only if you are okay losing stored practice data.

## Cleanup
```bash
docker compose down
```
To also remove Elasticsearch data (destructive):
```bash
docker compose down -v
```

## Suggested exercises
1. Find all 500 responses in Kibana.
2. Compare `log.level : "ERROR"` and `log.level : "INFO"`.
3. Add a `/slow` endpoint and identify its logs.
4. Add a `service.name` field to each log event.
5. Configure a Logstash filter to parse a new field.
6. Add a Jenkins stage that calls `/fail` and confirms the expected HTTP status.
7. Create a Kibana dashboard showing request count and error count over time.
8. Break the Logstash port configuration intentionally and diagnose why logs stop arriving.
