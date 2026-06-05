import asyncio
from src.retrieval.retriever import retrieve_context

async def test():
    print("Test 1: 'what are his projects'")
    res1 = await asyncio.to_thread(retrieve_context, "what are his projects")
    for i, r in enumerate(res1[:3]):
        print(f"[{i}] {r[:100]}")

    print("\nTest 2: 'show me the code for multithreaded http server'")
    res2 = await asyncio.to_thread(retrieve_context, "show me the code for multithreaded http server")
    for i, r in enumerate(res2[:3]):
        print(f"[{i}] {r[:100]}")

asyncio.run(test())
