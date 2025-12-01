pipeline {
  agent any
  
  environment {
    APP_IMAGE = 'web-app:ci'
    TEST_IMAGE = 'web-app-tests:ci'
    NETWORK_NAME = 'webapp_net'
    APP_CONTAINER = 'webapp_app'
  }
  
  stages {
    stage('Checkout') {
      steps {
        echo 'Checking out repository...'
        checkout scm
      }
    }
    
    stage('Check Docker') {
      steps {
        echo 'Verifying Docker is available...'
        sh '''
          if ! command -v docker > /dev/null 2>&1; then
            echo "ERROR: Docker is not installed or not in PATH"
            echo "Please install Docker on the Jenkins agent or use Jenkinsfile.no-docker"
            exit 1
          fi
          echo "Docker found at: $(which docker)"
          docker --version
          docker info > /dev/null 2>&1 || echo "Warning: Docker daemon may not be running properly"
        '''
      }
    }
    
    stage('Build') {
      steps {
        echo 'Build stage (placeholder for real build tasks)'
        // You could run: npm install, npm run build, etc.
      }
    }
    
    stage('Test') {
      steps {
        echo 'Unit test stage (placeholder for unit tests)'
        // You could run: npm run test:unit
      }
    }
    
    stage('Deploy') {
      steps {
        echo 'Packaging artifacts...'
        sh '''
          mkdir -p deploy
          tar -czf deploy/artifacts.tgz public views app.js db.js package.json
        '''
        archiveArtifacts artifacts: 'deploy/artifacts.tgz', fingerprint: true
      }
    }
    
    stage('Docker: Build App Image') {
      steps {
        echo "Building Docker image: ${APP_IMAGE}"
        sh "docker build -t ${APP_IMAGE} ."
      }
    }
    
    stage('Docker: Run App Container') {
      steps {
        echo "Starting app container on network ${NETWORK_NAME}"
        sh """
          # Ensure clean state: remove any existing container and network
          docker rm -f ${APP_CONTAINER} 2>/dev/null || true
          
          # Create Docker network (idempotent)
          docker network create ${NETWORK_NAME} 2>/dev/null || true
          
          # Run app container in background
          docker run -d --name ${APP_CONTAINER} \
            --network ${NETWORK_NAME} \
            -p 3000:3000 \
            ${APP_IMAGE}
          
          # Wait for app to be ready with retries (use Node inside the container for health check)
          echo "Waiting for app to start (host-side health check)..."
          READY=0
          for i in \$(seq 1 30); do
            if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
              echo "App is ready after \$i attempts"
              docker logs ${APP_CONTAINER}
              READY=1
              break
            fi
            echo "Attempt \$i: App not ready yet, waiting..."
            sleep 2
          done
          
          # Fail if app never became ready
          if [ \$READY -eq 0 ]; then
            echo "App failed to start after 60 seconds"
            docker logs ${APP_CONTAINER}
            exit 1
          fi
          
          echo "Health check passed, app is ready!"
          
          # If we get here, app failed to start
          echo "App failed to start after 60 seconds"
          docker logs ${APP_CONTAINER}
          exit 1
        """
      }
    }
    
    stage('Docker: Build Selenium Tests Image') {
      steps {
        echo "Building Selenium tests image: ${TEST_IMAGE}"
        sh "docker build -f Dockerfile.selenium -t ${TEST_IMAGE} ."
      }
    }
    
    stage('Docker: Run Selenium Tests') {
      steps {
        echo "Running Selenium tests against ${APP_CONTAINER} on ${NETWORK_NAME}"
        sh """
          docker run --rm \
            --network ${NETWORK_NAME} \
            -e BASE_URL=http://${APP_CONTAINER}:3000 \
            ${TEST_IMAGE}
        """
      }
    }
  }
  
  post {
    always {
      echo 'Cleaning up Docker resources...'
      sh """
        # Stop and remove app container
        docker stop ${APP_CONTAINER} || true
        docker rm ${APP_CONTAINER} || true
        
        # Remove network
        docker network rm ${NETWORK_NAME} || true
        
        # Optional: remove images to save space
        # docker rmi ${APP_IMAGE} ${TEST_IMAGE} || true
      """
    }
    
    success {
      echo 'Pipeline completed successfully!'
    }
    
    failure {
      echo 'Pipeline failed. Check logs above.'
    }
  }
}
