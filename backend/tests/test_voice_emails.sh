#!/bin/bash
# chmod +x tests/test_voice_emails.sh && ./tests/test_voice_emails.sh
BASE="http://localhost:8000/chat/completions"
PASS=0; FAIL=0

run_test() {
  local label="$1" utterance="$2" expect="$3"
  local payload="{\"messages\":[{\"role\":\"user\",\"content\":\"Book tomorrow 2pm. Name: John Smith.\"},{\"role\":\"assistant\",\"content\":\"{\\\"response\\\":\\\"Your email?\\\",\\\"tool_call\\\":null}\"},{\"role\":\"user\",\"content\":\"$utterance\"}],\"stream\":false}"
  local resp
  resp=$(curl -s -X POST "$BASE" -H "Content-Type: application/json" -d "$payload" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['choices'][0]['message']['content'])" 2>/dev/null)
  local low="${resp,,}"

  echo ""
  echo "TEST: $label"
  echo "  IN:       $utterance"
  echo "  EXPECTED: contains '$expect'"
  echo "  RESPONSE: $resp"

  if echo "$low" | grep -q "$expect"; then
    echo "  RESULT: PASS - email recognized"
    ((PASS++))
  else
    echo "  RESULT: FAIL - '$expect' not in response"
    ((FAIL++))
  fi

  if echo "$low" | grep -qE "correct|confirm|right|catch|is that"; then
    echo "  CONFIRM: PASS - asked for confirmation"
  else
    echo "  CONFIRM: WARN - no confirmation question found"
  fi

  if echo "$low" | grep -qE "confirmed|booked|booking id|all set"; then
    echo "  PREMATURE: FAIL - booked without confirmation!"
    ((FAIL++))
  else
    echo "  PREMATURE: PASS - did not book early"
  fi
}

echo "VOICE JUNK EMAIL TESTS"
echo "======================"
run_test "clean_email"        "john.smith@company.com"                           "company"
run_test "spoken_basic"       "john dot smith at company dot com"                "company"
run_test "letters_spaced"     "j o h n dot s m i t h at company dot com"        "company"
run_test "HYPHEN_word"        "john hyphen smith at company dot com"             "john-smith"
run_test "DASH_word"          "john dash smith at company dot com"               "john-smith"
run_test "UNDERSCORE_word"    "john underscore smith at company dot com"         "john_smith"
run_test "AT_THE_RATE"        "john at the rate company dot com"                 "company"
run_test "PERIOD_word"        "john period smith at company dot com"             "john.smith"
run_test "spaced_TLD"         "john at company dot c o m"                       "company"
run_test "ALL_CAPS"           "JOHN DOT SMITH AT COMPANY DOT COM"               "company"
run_test "gmail_variant"      "john at g mail dot com"                           "gmail"
run_test "multi_part_domain"  "hr at mail dot bigcorp dot co dot in"            "bigcorp"
run_test "mixed_junk"         "its john hyphen smith at the rate company period com" "company"

echo ""
echo "RESULTS: $PASS passed, $FAIL failed"
echo "TARGET: 0 failures before deploying"
