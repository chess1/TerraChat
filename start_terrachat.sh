#!/bin/bash

# Check for FIGMA_API_KEY
if [ -z "$FIGMA_API_KEY" ]; then
  echo "Warning: FIGMA_API_KEY is not set. The Figma MCP server will not be able to authenticate."
fi

# Install and build the Figma MCP server
cd mcp_servers/figma
npm install && npm run build
cd ../..

# Start the Python server
poetry run python server.py &
SERVER_PID=$!

# Wait for the server to start
while ! nc -z localhost 8000; do   
  sleep 1
done

# Start the frontend
cd frontend
pnpm dev

# Kill the server on exit
trap "kill $SERVER_PID" EXIT
