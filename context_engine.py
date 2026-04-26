from pathlib import Path


def load_knowledge_base(folder="knowledge_base"):
    docs = []

    for file in Path(folder).glob("*.md"):
        docs.append({
            "source": file.name,
            "text": file.read_text(encoding="utf-8")
        })

    return docs


def retrieve_context(query, max_results=3):
    docs = load_knowledge_base()
    query_words = query.lower().split()

    matches = []

    for doc in docs:
        score = 0
        text = doc["text"].lower()

        for word in query_words:
            if word in text:
                score += 1

        if score > 0:
            matches.append((score, doc))

    matches.sort(reverse=True, key=lambda x: x[0])
    return matches[:max_results]