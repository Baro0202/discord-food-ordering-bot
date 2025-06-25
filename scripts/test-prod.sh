#!/bin/bash

# Production Testing Script for Discord Food Ordering Bot with Kafka Integration
# Usage: ./scripts/test-prod.sh [scenario]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to cleanup existing containers
cleanup() {
    print_status "Cleaning up existing containers..."
    docker-compose -f docker-compose.prod.yml --profile kafka down -v --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
    docker system prune -f >/dev/null 2>&1 || true
    print_success "Cleanup completed"
}

# Function to wait for service health
wait_for_health() {
    local service=$1
    local max_attempts=${2:-30}
    local attempt=1

    print_status "Waiting for $service to be healthy..."

    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.prod.yml ps $service | grep -q "healthy"; then
            print_success "$service is healthy"
            return 0
        fi

        if [ $((attempt % 5)) -eq 0 ]; then
            print_status "Still waiting for $service... (attempt $attempt/$max_attempts)"
        fi

        sleep 2
        attempt=$((attempt + 1))
    done

    print_error "$service failed to become healthy within $((max_attempts * 2)) seconds"
    return 1
}

# Function to test health endpoint
test_health_endpoint() {
    local port=${1:-8386}
    local max_attempts=15
    local attempt=1

    print_status "Testing health endpoint on port $port..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:$port/health" >/dev/null 2>&1; then
            local response=$(curl -s "http://localhost:$port/health" | jq .)
            print_success "Health endpoint is responding"
            echo -e "${GREEN}Response:${NC}"
            echo "$response" | jq .
            return 0
        fi

        sleep 2
        attempt=$((attempt + 1))
    done

    print_error "Health endpoint is not responding"
    return 1
}

# Function to show logs
show_logs() {
    local service=${1:-discord-bot}
    local lines=${2:-50}

    print_status "Showing last $lines lines of $service logs:"
    echo -e "${YELLOW}==================== LOGS ====================${NC}"
    docker-compose -f docker-compose.prod.yml logs --tail=$lines $service
    echo -e "${YELLOW}===============================================${NC}"
}

# Test Scenario 1: Bot without Kafka (Safe Mode)
test_safe_mode() {
    print_status "🛡️  Testing SAFE MODE (Kafka Disabled)"

    print_status "Building and starting bot without Kafka..."
    KAFKA_ENABLED=false docker-compose -f docker-compose.prod.yml up -d discord-bot

    print_status "Waiting for bot to start..."
    sleep 10

    if test_health_endpoint 8386; then
        print_success "✅ Safe mode test PASSED"

        # Check that Kafka is disabled in response
        local kafka_status=$(curl -s "http://localhost:8386/health" | jq -r '.kafka.enabled')
        if [ "$kafka_status" = "false" ]; then
            print_success "✅ Kafka correctly disabled"
        else
            print_warning "⚠️  Kafka status unexpected: $kafka_status"
        fi
    else
        print_error "❌ Safe mode test FAILED"
        show_logs discord-bot
        return 1
    fi
}

# Test Scenario 2: Bot with Kafka (Full Stack)
test_with_kafka() {
    print_status "🚀 Testing WITH KAFKA (Full Stack)"

    print_status "Starting Kafka infrastructure..."
    KAFKA_ENABLED=true docker-compose -f docker-compose.prod.yml --profile kafka up -d zookeeper kafka

    print_status "Waiting for Kafka to be ready..."
    if wait_for_health kafka 60; then
        print_success "Kafka is ready"
    else
        print_error "Kafka failed to start"
        show_logs kafka
        return 1
    fi

    print_status "Starting bot with Kafka enabled..."
    KAFKA_ENABLED=true docker-compose -f docker-compose.prod.yml --profile kafka up -d discord-bot

    print_status "Waiting for bot to start..."
    sleep 15

    if test_health_endpoint 8386; then
        print_success "✅ Kafka integration test PASSED"

        # Check Kafka status in health response
        local kafka_enabled=$(curl -s "http://localhost:8386/health" | jq -r '.kafka.enabled')
        local kafka_healthy=$(curl -s "http://localhost:8386/health" | jq -r '.kafka.healthy')

        if [ "$kafka_enabled" = "true" ]; then
            print_success "✅ Kafka correctly enabled"
            if [ "$kafka_healthy" = "true" ]; then
                print_success "✅ Kafka connection healthy"
            else
                print_warning "⚠️  Kafka connection not healthy: $kafka_healthy"
            fi
        else
            print_error "❌ Kafka not enabled in bot"
        fi

        # Test Kafka UI
        print_status "Testing Kafka UI..."
        if curl -s -f "http://localhost:8080" >/dev/null 2>&1; then
            print_success "✅ Kafka UI is accessible at http://localhost:8080"
        else
            print_warning "⚠️  Kafka UI not accessible"
        fi
    else
        print_error "❌ Kafka integration test FAILED"
        show_logs discord-bot
        return 1
    fi
}

# Test Scenario 3: Kafka Recovery (Start without, then add Kafka)
test_kafka_recovery() {
    print_status "🔄 Testing KAFKA RECOVERY (Hot-add Kafka)"

    # Start without Kafka
    print_status "Starting bot without Kafka..."
    KAFKA_ENABLED=false docker-compose -f docker-compose.prod.yml up -d discord-bot
    sleep 10

    print_status "Bot started without Kafka, now adding Kafka..."

    # Start Kafka
    KAFKA_ENABLED=false docker-compose -f docker-compose.prod.yml --profile kafka up -d zookeeper kafka
    wait_for_health kafka 60

    # Update bot to use Kafka
    print_status "Restarting bot with Kafka enabled..."
    KAFKA_ENABLED=true docker-compose -f docker-compose.prod.yml --profile kafka up -d discord-bot
    sleep 15

    if test_health_endpoint 8386; then
        print_success "✅ Kafka recovery test PASSED"
    else
        print_error "❌ Kafka recovery test FAILED"
        return 1
    fi
}

# Performance test
test_performance() {
    print_status "⚡ Running PERFORMANCE TEST"

    print_status "Bot memory usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep -E "(food-ordering-bot|kafka|zookeeper)"

    print_status "Testing health endpoint response time..."
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null "http://localhost:8386/health")
    print_success "Health endpoint response time: ${response_time}s"

    if (( $(echo "$response_time < 1.0" | bc -l) )); then
        print_success "✅ Response time acceptable"
    else
        print_warning "⚠️  Response time high: ${response_time}s"
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [scenario]"
    echo ""
    echo "Available scenarios:"
    echo "  safe          - Test bot without Kafka (default)"
    echo "  kafka         - Test bot with full Kafka stack"
    echo "  recovery      - Test adding Kafka to running bot"
    echo "  performance   - Run performance tests"
    echo "  all           - Run all tests sequentially"
    echo "  cleanup       - Cleanup containers and volumes"
    echo ""
    echo "Examples:"
    echo "  $0 safe       # Test safe mode"
    echo "  $0 kafka      # Test with Kafka"
    echo "  $0 all        # Run all tests"
    echo "  $0 cleanup    # Clean up"
}

# Main execution
main() {
    local scenario=${1:-safe}

    print_status "🐳 Docker Production Testing for Discord Food Bot"
    print_status "Scenario: $scenario"
    print_status "Time: $(date)"

    check_docker

    case $scenario in
        "safe")
            cleanup
            test_safe_mode
            ;;
        "kafka")
            cleanup
            test_with_kafka
            ;;
        "recovery")
            cleanup
            test_kafka_recovery
            ;;
        "performance")
            test_performance
            ;;
        "all")
            cleanup
            print_status "🧪 Running ALL test scenarios..."
            test_safe_mode && sleep 5
            cleanup && sleep 2
            test_with_kafka && sleep 5
            test_performance
            ;;
        "cleanup")
            cleanup
            print_success "Cleanup completed"
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            print_error "Unknown scenario: $scenario"
            show_usage
            exit 1
            ;;
    esac

    print_status "Test completed at $(date)"
}

# Run main function
main "$@"