import asyncio
from src.retrieval.retriever import retrieve_context

async def main():
    q1 = "could you show me a fucntion from this code"
    q2 = "readme file for this web-automation agent"
    print("Q1 Results:")
    for res in retrieve_context(q1):
        print(res[:200])
        print("---")
    print("Q2 Results:")
    for res in retrieve_context(q2):
        print(res[:200])
        print("---")

asyncio.run(main())
