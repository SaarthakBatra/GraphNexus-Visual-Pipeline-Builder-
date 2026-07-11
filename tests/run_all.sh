#!/bin/bash
set -e

echo "=========================================="
echo " Starting GraphNexus Test Orchestrator "
echo "=========================================="

# 1. Run Backend Tests
echo "[1/2] Running Backend Tests (pytest)..."
cd modules/backend
if command -v pytest &> /dev/null; then
    pytest ../../tests/backend/ -v
else
    echo "pytest command not found. Ensure requirements are installed."
    exit 1
fi
cd ../../

# 2. Run Frontend Tests
echo "[2/2] Running Frontend Tests (Jest)..."
cd modules/frontend
# Run Jest with CI mode to prevent it from entering watch mode
# Note: CRA requires matching test files to be inside src by default. 
# Since we enforce external tests, we tell jest to search the external directory.
CI=true npm test -- --roots "<rootDir>/../../tests/frontend"
cd ../../

echo "=========================================="
echo " All test suites passed successfully! "
echo "=========================================="
