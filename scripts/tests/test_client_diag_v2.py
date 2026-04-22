import asyncio
import os
import sys
from notebooklm_mcp.client import NotebookLMClient
from notebooklm_mcp.config import ServerConfig

async def test():
    config = ServerConfig()
    config.headless = True
    # Force use of existing profile
    config.auth.profile_dir = "c:/Projet_David/GM-OS-v5/chrome_profile_notebooklm"
    
    client = NotebookLMClient(config)
    print("Starting client...")
    try:
        await client.start()
        print(f"Driver status: {client.driver}")
        
        # Test Direct RPC (the thing that forge uses)
        from notebooklm_mcp.api_client import NotebookLMClient as ApiClient
        
        cookies = client.driver.get_cookies()
        api = ApiClient(cookies=cookies)
        
        print("Listing notebooks...")
        notebooks = api.list_notebooks()
        for nb in notebooks:
            print(f"- {nb.title} (ID: {nb.id})")
            
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if client.driver:
            await client.stop()

if __name__ == "__main__":
    asyncio.run(test())
