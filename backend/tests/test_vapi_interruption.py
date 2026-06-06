"""Vapi barge-in simulation via threading.
Sends two overlapping requests — both must return 200 (in-flight lock is OFF).
Also sends 25 rapid requests — some must return 429 (rate limiter is ON).

Run:  BACKEND_URL=http://localhost:8000 ./venv/bin/python -m pytest tests/test_vapi_interruption.py -v -s
"""
import os, time, threading, requests, pytest

VOICE_URL = f"{os.getenv('BACKEND_URL','http://localhost:8000')}/chat/completions"
_r: dict = {}

def send(label, messages, delay=0.0):
    time.sleep(delay)
    t0 = time.time()
    try:
        resp = requests.post(VOICE_URL, json={"messages":messages,"stream":False}, timeout=60)
        _r[label] = {
            "status": resp.status_code,
            "ms": int((time.time()-t0)*1000),
            "text": resp.json()["choices"][0]["message"]["content"][:80] if resp.ok else resp.text[:80]
        }
    except Exception as e:
        _r[label] = {"status":-1,"ms":0,"text":str(e)}

def test_barge_in_both_succeed():
    """Two overlapping requests (barge-in) must BOTH return 200.
    If either returns 429, the in-flight lock is ON — that will break Vapi."""
    _r.clear()
    t1 = threading.Thread(target=send, args=("old_turn",
        [{"role":"user","content":"Tell me about all of his projects in detail"}], 0.0))
    t2 = threading.Thread(target=send, args=("interrupt",
        [{"role":"user","content":"Actually just the RAG one"}], 0.5))
    t1.start(); t2.start()
    t1.join();  t2.join()

    print(f"\nold_turn  ({_r['old_turn']['ms']}ms):  {_r['old_turn']['text']}")
    print(f"interrupt ({_r['interrupt']['ms']}ms): {_r['interrupt']['text']}")

    assert _r["old_turn"]["status"] != 429, (
        "old_turn got 429! In-flight lock is active — it will block Vapi barge-in. "
        "Check main.py: _ip_in_flight block must stay commented out."
    )
    assert _r["interrupt"]["status"] != 429, (
        "interrupt got 429! Same issue — in-flight lock is blocking Vapi."
    )
    assert _r["old_turn"]["status"] == 200
    assert _r["interrupt"]["status"] == 200

def test_rate_limiter_fires_on_abuse():
    """25 rapid requests in ~2.5s — rate limiter should block the excess."""
    _r.clear()
    threads = [
        threading.Thread(target=send,args=(f"r{i}",
            [{"role":"user","content":f"ping {i}"}],i*0.05))
        for i in range(25)
    ]
    for t in threads: t.start()
    for t in threads: t.join()

    statuses = [_r[f"r{i}"]["status"] for i in range(25)]
    ok = statuses.count(200)
    blocked = statuses.count(429)
    print(f"\n25 rapid requests: {ok} OK, {blocked} blocked by rate limiter")
    print(f"Sequence: {statuses}")

    assert ok >= 1, f"ALL requests failed — is server running? {statuses}"
    assert blocked >= 1, (
        "NO requests were rate-limited! Rate limiter may be disabled. "
        "Check main.py sliding-window middleware. "
        f"Statuses: {statuses}"
    )

def test_response_within_25_seconds():
    """Voice must respond within 25s — Vapi drops connection after 30s."""
    t0 = time.time()
    resp = requests.post(VOICE_URL,
        json={"messages":[{"role":"user","content":"What are his top skills?"}],"stream":False},
        timeout=30)
    elapsed = time.time()-t0
    print(f"\nResponse time: {elapsed:.2f}s")
    assert resp.status_code == 200
    assert elapsed < 25, (
        f"Too slow: {elapsed:.1f}s — Vapi will time out at 30s. "
        "Consider reducing LLM_TIMEOUT_VOICE to 10s in llm_client.py."
    )
