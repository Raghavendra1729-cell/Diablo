from src.retrieval.retriever import retrieve_context

chunks = retrieve_context("show me the code for Lost-n-Found React components")
for c in chunks:
    print(c)
    print("---")
