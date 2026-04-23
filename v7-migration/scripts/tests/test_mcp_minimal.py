from fastmcp import FastMCP
import sys

mcp = FastMCP("test-server")

@mcp.tool()
def hello(name: str = "World") -> str:
    return f"Hello, {name}!"

if __name__ == "__main__":
    mcp.run()
