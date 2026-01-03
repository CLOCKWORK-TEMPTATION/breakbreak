#!/bin/bash
# Test script for Sprint 1 implementation

echo "🧪 Testing Break Break - Sprint 1 Implementation"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo "1. Testing Monorepo Structure"
echo "------------------------------"

if [ -f "turbo.json" ]; then
    test_pass "turbo.json exists"
else
    test_fail "turbo.json missing"
fi

if [ -f "pnpm-workspace.yaml" ]; then
    test_pass "pnpm-workspace.yaml exists"
else
    test_fail "pnpm-workspace.yaml missing"
fi

if [ -d "apps/backend" ]; then
    test_pass "Backend directory exists"
else
    test_fail "Backend directory missing"
fi

if [ -d "apps/frontend" ]; then
    test_pass "Frontend directory exists"
else
    test_fail "Frontend directory missing"
fi

echo ""
echo "2. Testing Backend Structure"
echo "----------------------------"

BACKEND_FILES=(
    "apps/backend/prisma/schema.prisma"
    "apps/backend/src/modules/auth/auth.service.ts"
    "apps/backend/src/modules/auth/auth.controller.ts"
    "apps/backend/src/modules/auth/jwt.strategy.ts"
    "apps/backend/src/modules/project/project.service.ts"
    "apps/backend/src/modules/project/project.controller.ts"
    "apps/backend/src/common/guards/jwt-auth.guard.ts"
    "apps/backend/src/common/guards/roles.guard.ts"
    "apps/backend/src/common/decorators/current-user.decorator.ts"
    "apps/backend/src/common/decorators/roles.decorator.ts"
    "apps/backend/src/database/prisma.service.ts"
)

for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_pass "$(basename $file) exists"
    else
        test_fail "$(basename $file) missing"
    fi
done

echo ""
echo "3. Testing Frontend Structure"
echo "-----------------------------"

FRONTEND_FILES=(
    "apps/frontend/lib/auth.ts"
    "apps/frontend/components/scanner/QRScanner.tsx"
    "apps/frontend/app/(auth)/login/qr/page.tsx"
    "apps/frontend/app/dashboard/page.tsx"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_pass "$(basename $file) exists"
    else
        test_fail "$(basename $file) missing"
    fi
done

echo ""
echo "4. Testing Dependencies"
echo "----------------------"

cd apps/backend
if grep -q "@nestjs/jwt" package.json; then
    test_pass "Backend has @nestjs/jwt"
else
    test_fail "Backend missing @nestjs/jwt"
fi

if grep -q "@prisma/client" package.json; then
    test_pass "Backend has @prisma/client"
else
    test_fail "Backend missing @prisma/client"
fi

if grep -q "qrcode" package.json; then
    test_pass "Backend has qrcode"
else
    test_fail "Backend missing qrcode"
fi

cd ../frontend
if grep -q "axios" package.json; then
    test_pass "Frontend has axios"
else
    test_fail "Frontend missing axios"
fi

if grep -q "html5-qrcode" package.json; then
    test_pass "Frontend has html5-qrcode"
else
    test_fail "Frontend missing html5-qrcode"
fi

cd ../..

echo ""
echo "5. Testing Build"
echo "---------------"

echo "Building backend..."
cd apps/backend
if pnpm build > /dev/null 2>&1; then
    test_pass "Backend builds successfully"
else
    test_fail "Backend build failed"
fi
cd ../..

echo "Building frontend..."
cd apps/frontend
if pnpm build > /dev/null 2>&1; then
    test_pass "Frontend builds successfully"
else
    test_fail "Frontend build failed"
fi
cd ../..

echo ""
echo "6. Testing Configuration Files"
echo "------------------------------"

if [ -f "apps/backend/.env.example" ]; then
    test_pass "Backend .env.example exists"
else
    test_fail "Backend .env.example missing"
fi

if [ -f "apps/frontend/.env.example" ]; then
    test_pass "Frontend .env.example exists"
else
    test_fail "Frontend .env.example missing"
fi

echo ""
echo "=================================================="
echo "Test Results"
echo "=================================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
