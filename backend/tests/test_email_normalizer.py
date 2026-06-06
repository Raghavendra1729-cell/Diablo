"""Unit tests for email_normalizer.py — covers all STT noise patterns.
Run:  ./venv/bin/python -m pytest tests/test_email_normalizer.py -v
"""
import pytest
from src.utils.email_normalizer import fast_normalize, basic_cleanup

FAST_NORMALIZE_CASES = [
    # (raw_input, expected_output_or_None)
    # Currently working
    ("john at gmail dot com",                        "john@gmail.com"),
    ("john@gmail.com",                               None),   # already @ — returns None
    ("j o h n at gmail dot com",                     "john@gmail.com"),
    ("j-o-h-n at gmail dot com",                     "john@gmail.com"),
    ("s a r a h dot connor at skynet dot org",       "sarah.connor@skynet.org"),
    ("john at company dot c o m",                    "john@company.com"),
    ("24bcs10250 at sst dot scaler dot com",         "24bcs10250@sst.scaler.com"),
    ("john123 at company dot com",                   "john123@company.com"),
    ("JOHN AT GMAIL DOT COM",                        "john@gmail.com"),
    # FAILING today — need _WORD_SUBS fix
    ("john hyphen doe at company dot com",           "john-doe@company.com"),
    ("john dash doe at company dot com",             "john-doe@company.com"),
    ("j o h n hyphen d o e at company dot com",     "john-doe@company.com"),
    ("john underscore doe at company dot com",       "john_doe@company.com"),
    ("john underscore 99 at gmail dot com",          "john_99@gmail.com"),
    ("john at the rate gmail dot com",               "john@gmail.com"),
    ("john dot doe at the rate company dot com",     "john.doe@company.com"),
    ("john period smith at company dot com",         "john.smith@company.com"),
    ("john point smith at company dot com",          "john.smith@company.com"),
    ("recruiter at bigcompany dot co dot in",        "recruiter@bigcompany.co.in"),
    ("hr at company dot co dot uk",                  "hr@company.co.uk"),
    ("john dot 123 at company dot com",              "john.123@company.com"),
]

@pytest.mark.parametrize("raw,expected", FAST_NORMALIZE_CASES)
def test_fast_normalize(raw, expected):
    result = fast_normalize(raw)
    assert result == expected, (
        f"\nInput:    {raw!r}"
        f"\nExpected: {expected!r}"
        f"\nGot:      {result!r}"
    )

BASIC_CLEANUP_CASES = [
    ("john@gmail.com",    "john@gmail.com"),
    ("JOHN@GMAIL.COM",    "john@gmail.com"),
    ("john@gmail..com",   "john@gmail.com"),
    (" john@gmail.com ",  "john@gmail.com"),
]

@pytest.mark.parametrize("raw,expected", BASIC_CLEANUP_CASES)
def test_basic_cleanup(raw, expected):
    assert basic_cleanup(raw) == expected
