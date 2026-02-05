#!/bin/bash
# Test with corrected chain ID (same as app ID)

CHAIN_ID="22ae5c2532bdc6a28b740c82b9f81b25ae1ea6cdb2b7f592258b61b5f5b96dbf"
APP_ID="22ae5c2532bdc6a28b740c82b9f81b25ae1ea6cdb2b7f592258b61b5f5b96dbf"
APP_URL="http://localhost:8081/chains/$CHAIN_ID/applications/$APP_ID"

echo "=== Testing Linera App Endpoint with Corrected IDs ==="
echo "Chain ID = App ID = $CHAIN_ID"
echo "URL: $APP_URL"
echo ""

# Test 1: Simple query to check if endpoint responds
echo "=== Test 1: __typename ==="
result=$(curl -s --max-time 10 -X POST -H 'Content-Type: application/json' "$APP_URL" \
  -d '{"query":"{ __typename }"}')
echo "$result"
echo ""

# Test 2: Schema introspection - get query fields
echo "=== Test 2: Query fields ==="
curl -s --max-time 10 -X POST -H 'Content-Type: application/json' "$APP_URL" \
  -d '{"query":"{ __schema { queryType { fields { name args { name type { name } } } } } }"}' | head -c 2000
echo ""
echo ""

# Test 3: Try MutationRoot fields
echo "=== Test 3: Mutation fields ==="
curl -s --max-time 10 -X POST -H 'Content-Type: application/json' "$APP_URL" \
  -d '{"query":"{ __schema { mutationType { fields { name } } } }"}' | head -c 1000
echo ""

echo ""
echo "=== Done ==="
