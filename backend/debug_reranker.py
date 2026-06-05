from src.embeddings.embedder import get_reranker
reranker = get_reranker()
query = "what are his projects"
chunks = ["He has built AI and software projects including SastaNotebookLM, WEB-AUTOMATION-AGENT.", "Some random text."]
scores = list(reranker.rerank(query, chunks))
print(scores)
