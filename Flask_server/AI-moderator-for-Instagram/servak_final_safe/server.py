from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from autolearner import add_words_from_comment, update_keywords

app = Flask(__name__)
CORS(app)

STATIC_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(STATIC_DIR, "comments.json")

KEYWORD_CATEGORIES = {
    "Positive": "keywords_positive.txt",
    "Neutral": "keywords_neutral.txt",
    "Negative": "keywords_negative.txt"
}

# Кэшируем ключевые слова при старте
CACHED_KEYWORDS = {
    category: [line.strip() for line in open(os.path.join(STATIC_DIR, filename), encoding="utf-8")]
    for category, filename in KEYWORD_CATEGORIES.items()
}

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def classify_by_keywords(text):
    text = text.lower()
    for category, keywords in CACHED_KEYWORDS.items():
        if any(word in text for word in keywords):
            return category
    return "Неизвестно"

def is_bot_comment(text):
    text = text.lower()
    total = sum(
        sum(1 for word in keywords if word in text)
        for keywords in CACHED_KEYWORDS.values()
    )
    return total >= 3 or len(set(text.split())) <= 3

@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")

@app.route("/comments", methods=["GET"])
def get_comments():
    return jsonify(load_data())

@app.route("/add-comment", methods=["POST"])
def add_comment():
    comment_data = request.get_json()
    comment = comment_data.get("comment", "")
    comment_data["category"] = classify_by_keywords(comment)
    comment_data["is_bot"] = is_bot_comment(comment)
    data = load_data()
    data.append(comment_data)
    save_data(data)
    return jsonify({"status": "ok", "category": comment_data["category"], "is_bot": comment_data["is_bot"]})

if __name__ == "__main__":
    app.run(debug=False, host="127.0.0.1", port=5020)