#!/bin/bash

# Script to help replace console.* calls with structured logger
# Usage: ./scripts/replace-console-with-logger.sh

echo "🔍 Finding console.* usage in source files..."

# Count total console calls
TOTAL=$(grep -r "console\.\(log\|warn\|error\|info\|debug\)" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)
echo "📊 Found $TOTAL console.* calls to replace"

# Show breakdown by type
echo ""
echo "Breakdown by type:"
echo "  console.log:   $(grep -r "console\.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)"
echo "  console.warn:  $(grep -r "console\.warn" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)"
echo "  console.error: $(grep -r "console\.error" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)"
echo "  console.info:  $(grep -r "console\.info" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)"
echo "  console.debug: $(grep -r "console\.debug" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)"

echo ""
echo "📁 Files with most console usage:"
grep -r "console\.\(log\|warn\|error\|info\|debug\)" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | \
  cut -d: -f1 | sort | uniq -c | sort -rn | head -10

echo ""
echo "💡 Replacement guide:"
echo "  console.log()   → log.debug() or log.info()"
echo "  console.info()  → log.info()"
echo "  console.warn()  → log.warn()"
echo "  console.error() → log.error()"
echo "  console.debug() → log.debug()"
echo ""
echo "Example:"
echo "  Before: console.error('Login failed:', error)"
echo "  After:  log.error('Login failed', { event: 'login_failed', component: 'AuthService' }, error)"
echo ""
echo "Make sure to import: import { log } from '@/utils/logger';"
