import os
import json
from collections import Counter

STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

POSITIVE_FILE = os.path.join(STATIC_DIR, "keywords_positive.txt")
NEUTRAL_FILE = os.path.join(STATIC_DIR, "keywords_neutral.txt")
NEGATIVE_FILE = os.path.join(STATIC_DIR, "keywords_negative.txt")

def load_keywords():
    keywords = set()
    for file in [POSITIVE_FILE, NEUTRAL_FILE, NEGATIVE_FILE]:
        if os.path.exists(file):
            with open(file, "r", encoding="utf-8") as f:
                for line in f:
                    keywords.add(line.strip().lower())
    return keywords

KNOWN_KEYWORDS = load_keywords()
WORD_COUNTER = Counter()

def clean_word(word):
    return ''.join(char for char in word.lower() if char.isalpha())

def add_words_from_comment(comment_text):
    words = comment_text.split()
    for word in words:
        clean = clean_word(word)
        if clean and len(clean) > 2 and clean not in KNOWN_KEYWORDS:
            WORD_COUNTER[clean] += 1

def simple_sentiment_analysis(word):
    positive_signs = ["love", "like", "great", "good", "super", "best", "улыб", "отлично", "радость", "счастье"]
    negative_signs = ["hate", "suck", "shit", "fuck", "bad", "ху", "ло", "бляд", "ненавиж", "убей"]
    for sign in positive_signs:
        if sign in word:
            return "Positive"
    for sign in negative_signs:
        if sign in word:
            return "Negative"
    return "Neutral"

def update_keywords(threshold=5):
    for word, count in WORD_COUNTER.items():
        if count >= threshold:
            sentiment = simple_sentiment_analysis(word)
            if sentiment == "Positive":
                append_to_file(POSITIVE_FILE, word)
            elif sentiment == "Negative":
                append_to_file(NEGATIVE_FILE, word)
            else:
                append_to_file(NEUTRAL_FILE, word)
            KNOWN_KEYWORDS.add(word)

def append_to_file(filepath, word):
    with open(filepath, "a", encoding="utf-8") as f:
        f.write(f"\n{word}")