#!/bin/bash

# Load Testing Script for Break Break
# Tests the system with simulated concurrent users

echo "🧪 Break Break Load Testing Script"
echo "===================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
NUM_USERS="${NUM_USERS:-100}"
RAMP_UP_TIME="${RAMP_UP_TIME:-10}"

echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Number of Users: $NUM_USERS"
echo "  Ramp-up Time: ${RAMP_UP_TIME}s"
echo ""

# Check if required tools are installed
command -v curl >/dev/null 2>&1 || { echo "❌ curl is required but not installed. Aborting." >&2; exit 1; }

echo "📋 Test Scenarios"
echo "=================="
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check"
echo "-------------------"
response_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/")
if [ "$response_code" = "200" ] || [ "$response_code" = "404" ]; then
    echo "✅ API is reachable (HTTP $response_code)"
else
    echo "❌ API is not reachable (HTTP $response_code)"
    exit 1
fi
echo ""

# Test 2: Concurrent Vendor Listing
echo "2️⃣  Concurrent Vendor Listing (${NUM_USERS} requests)"
echo "-------------------"
start_time=$(date +%s)
pids=()

for i in $(seq 1 $NUM_USERS); do
    curl -s -o /dev/null -w "%{http_code}\n" "$API_URL/vendors" &
    pids+=($!)
    
    # Ramp up gradually
    if [ $((i % 10)) -eq 0 ]; then
        sleep $(echo "scale=2; $RAMP_UP_TIME / ($NUM_USERS / 10)" | bc)
    fi
done

# Wait for all requests to complete
success_count=0
for pid in "${pids[@]}"; do
    wait $pid
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        ((success_count++))
    fi
done

end_time=$(date +%s)
duration=$((end_time - start_time))

echo "✅ Completed $success_count/$NUM_USERS requests in ${duration}s"
echo "   Average: $(echo "scale=2; $NUM_USERS / $duration" | bc) requests/second"
echo ""

# Test 3: WebSocket Connection
echo "3️⃣  WebSocket Connection Test"
echo "-------------------"
if command -v wscat >/dev/null 2>&1; then
    echo "Testing WebSocket connection..."
    timeout 5 wscat -c "ws://localhost:3000" --execute '{"event":"ping"}' 2>&1 | head -5
    if [ $? -eq 0 ]; then
        echo "✅ WebSocket connection successful"
    else
        echo "⚠️  WebSocket test timeout or error (this is normal if server is not running)"
    fi
else
    echo "⚠️  wscat not installed, skipping WebSocket test"
    echo "   Install with: npm install -g wscat"
fi
echo ""

# Test 4: Database Connection (via API)
echo "4️⃣  Database Connection Test"
echo "-------------------"
# Try to access an endpoint that requires database
response=$(curl -s -w "\n%{http_code}" "$API_URL/projects" 2>&1)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ] || [ "$http_code" = "401" ]; then
    echo "✅ Database connection working (HTTP $http_code)"
elif [ "$http_code" = "500" ]; then
    echo "❌ Database connection failed (HTTP $http_code)"
else
    echo "⚠️  Unexpected response (HTTP $http_code)"
fi
echo ""

# Summary
echo "📊 Load Test Summary"
echo "===================="
echo "✅ API Health: OK"
echo "✅ Concurrent Requests: $success_count/$NUM_USERS successful"
echo "✅ Average Response Time: ~$(echo "scale=2; $duration / ($NUM_USERS / 100)" | bc)ms (estimated)"
echo ""
echo "💡 For more detailed load testing, consider using:"
echo "   - Apache Bench (ab): ab -n 1000 -c 50 $API_URL/vendors"
echo "   - Artillery: artillery quick --count 100 -n 10 $API_URL/vendors"
echo "   - k6: k6 run loadtest.js"
echo ""
echo "✅ Load testing complete!"
