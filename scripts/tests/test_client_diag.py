import asyncio
import os
import sys
from notebooklm_mcp.client import NotebookLMClient
from notebooklm_mcp.config import ServerConfig

async def test():
    config = ServerConfig()
    # Force headless for test
    config.headless = True
    client = NotebookLMClient(config)
    print("Starting client...")
    try:
        await client.start()
        print(f"Driver status: {client.driver}")
        if client.driver:
            print("Cookies:", client.driver.get_cookies())
    except Exception as e:
        print(f"FAILED: {e}")
    finally:
        if client.driver:
            await client.stop()

if __name__ == "__main__":
    asyncio.run(test())
