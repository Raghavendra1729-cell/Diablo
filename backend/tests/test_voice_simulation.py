"""Automated voice endpoint tests.
Run:  BACKEND_URL=http://localhost:8000 ./venv/bin/python -m pytest tests/test_voice_simulation.py -v -s
"""
import os, re, pytest, requests

VOICE_URL = f"{os.getenv('BACKEND_URL','http://localhost:8000')}/chat/completions"

def voice(messages):
    r = requests.post(VOICE_URL, json={"messages": messages, "stream": False}, timeout=45)
    assert r.status_code == 200, f"HTTP {r.status_code}: {r.text[:200]}"
    return r.json()["choices"][0]["message"]["content"]

def booking_ctx(email_str):
    """Build a context where user just gave their email."""
    return [
        {"role":"user","content":"Book tomorrow 2pm, I'm John Smith."},
        {"role":"assistant","content":'{"response":"And your email?","tool_call":null}'},
        {"role":"user","content": email_str},
    ]

EMAIL_CASES = [
    ("clean",         "john.smith@company.com",                    "company"),
    ("spoken",        "john dot smith at company dot com",          "company"),
    ("hyphen_word",   "john hyphen smith at company dot com",       "john-smith"),
    ("dash_word",     "john dash smith at company dot com",         "john-smith"),
    ("underscore",    "john underscore smith at company dot com",   "john_smith"),
    ("at_the_rate",   "john at the rate company dot com",           "company"),
    ("period_word",   "john period smith at company dot com",       "john.smith"),
    ("spaced_tld",    "john at company dot c o m",                  "company"),
    ("all_caps",      "JOHN DOT SMITH AT COMPANY DOT COM",         "company"),
    ("gmail_variant", "john at g mail dot com",                     "gmail"),
]

@pytest.mark.parametrize("label,utterance,must_have", EMAIL_CASES)
def test_email_readback(label, utterance, must_have):
    content = voice(booking_ctx(utterance)).lower()
    assert must_have.lower() in content, f"[{label}] '{must_have}' missing:\n{content}"
    confirm = any(w in content for w in ["correct","confirm","right","catch","is that"])
    assert confirm, f"[{label}] No confirmation asked:\n{content}"
    booked = any(w in content for w in ["booking confirmed","i have booked","all set"])
    assert not booked, f"[{label}] Booked without yes!\n{content}"

def test_no_markdown_in_voice():
    content = voice([{"role":"user","content":"What projects has he built?"}])
    assert not re.search(r'\*\*|#{1,6} |`{1,3}', content), f"Markdown found:\n{content}"

def test_no_json_leak():
    content = voice([{"role":"user","content":"What is his LeetCode rating?"}])
    assert "tool_call" not in content.lower(), f"JSON leaked:\n{content}"
    assert '"name":' not in content, f"JSON leaked:\n{content}"

def test_voice_under_80_words():
    content = voice([{"role":"user","content":"Who is Linga?"}])
    wc = len(content.split())
    assert wc <= 80, f"Too long ({wc} words):\n{content}"

def test_booking_state_memory():
    """Date given early — must NOT ask for it again later in the flow."""
    msgs = [
        {"role":"user","content":"June 15 at 11am."},
        {"role":"assistant","content":'{"response":"Your name?","tool_call":null}'},
        {"role":"user","content":"Priya Sharma"},
        {"role":"assistant","content":'{"response":"Your email?","tool_call":null}'},
        {"role":"user","content":"priya at infosys dot com"},
    ]
    content = voice(msgs).lower()
    date_q = any(q in content for q in ["what date","which date","when would","what day"])
    assert not date_q, f"Asked for date again (already given):\n{content}"
    assert any(x in content for x in ["june","15","11"]), f"Date forgotten:\n{content}"

def test_no_booking_without_yes():
    """All 4 fields given at once — must still confirm before booking."""
    msgs = [{"role":"user","content":"Book June 15 at 2pm for John Smith, john@company.com"}]
    content = voice(msgs).lower()
    booked_confirmed = any(w in content for w in ["booking confirmed","all set","i have booked"])
    if booked_confirmed:
        confirm = any(w in content for w in ["correct","is that","confirm"])
        assert confirm, f"Booked without any confirmation phrase:\n{content}"
