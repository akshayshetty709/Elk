pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        COMPOSE_PROJECT_NAME = 'elk-practice'
        APP_PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Unit test') {
            steps {
                dir('app') {
                    sh 'node --version'
                    sh 'npm test'
                }
            }
        }

        stage('Build application image') {
            steps {
                sh 'docker compose build app'
            }
        }

        stage('Deploy application and logging stack') {
            steps {
                sh '''
                    mkdir -p logs
                    docker compose up -d --build
                '''
            }
        }

        stage('Smoke test') {
            steps {
                sh '''
                    set -eu
                    for i in $(seq 1 30); do
                      if curl -fsS http://127.0.0.1:${APP_PORT}/health; then
                        echo "Application health check passed"
                        exit 0
                      fi
                      sleep 2
                    done
                    echo "Application did not become healthy"
                    docker compose ps
                    docker compose logs --tail=100 app
                    exit 1
                '''
            }
        }

        stage('Show endpoints') {
            steps {
                echo 'API: http://localhost:3000'
                echo 'Kibana: http://localhost:5601 (host-local binding; use SSH tunnel for remote access)'
                sh 'docker compose ps'
            }
        }
    }

    post {
        success {
            echo 'Deployment completed. Generate traffic and inspect logs in Kibana.'
        }
        failure {
            sh 'docker compose ps || true'
            sh 'docker compose logs --tail=100 app logstash filebeat elasticsearch kibana || true'
        }
    }
}
