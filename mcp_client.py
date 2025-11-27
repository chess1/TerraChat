import asyncio
from contextlib import AsyncExitStack
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


class MCPClient:
    def __init__(self, server_script_path: str):
        self.server_script_path = server_script_path
        self.exit_stack = AsyncExitStack()
        self.session: ClientSession | None = None

    async def __aenter__(self):
        is_python = self.server_script_path.endswith('.py')
        is_js = self.server_script_path.endswith('.js')

        if not (is_python or is_js):
            raise ValueError("Server script must be a .py or .js file")

        command = "python" if is_python else "node"
        server_params = StdioServerParameters(
            command=command,
            args=[self.server_script_path],
            env=None
        )

        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))

        await self.session.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.exit_stack.aclose()

    async def call_tool(self, tool_name: str, tool_args: dict) -> dict:
        if not self.session:
            raise ConnectionError("MCP client is not connected to the server.")
        return await self.session.call_tool(tool_name, tool_args)


async def call_mcp_tool(server_path: str, tool_name: str, tool_args: dict) -> dict:
    async with MCPClient(server_path) as client:
        result = await client.call_tool(tool_name, tool_args)
        return result.content
