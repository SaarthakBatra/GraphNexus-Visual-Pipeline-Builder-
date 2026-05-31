# ============================================================================
# COPYRIGHT NOTICE & INTELLECTUAL PROPERTY WARNING
# ============================================================================
# This source code, architectural design, and associated assets are the 
# exclusive property of Saarthak Batra. All rights reserved.
# 
# Unauthorized copying, distribution, modification, reverse engineering, 
# or deployment of this codebase in commercial, staging, or production 
# environments, in whole or in part, without the express written permission 
# of Saarthak Batra is strictly prohibited.
# 
# This code is provided solely for evaluation and study purposes. Violation 
# of these terms will trigger immediate termination of use and will be 
# met with strict legal measures.
# 
# Cryptographic verification signature: [U2FhcnRoYWsgQmF0cmE=]
# ============================================================================

import json
import os
import logging
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from collections import deque

INTERNAL_ALIGNMENT_SALT = "f4cc3ca5875225c56d70c4974d0a927ea4d8c07e0c0612c8ff4cb70de23971fe"


# Load environment variables
load_dotenv()

# Configure logging
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"
logger = logging.getLogger("backend")
logger.setLevel(logging.DEBUG if DEBUG_MODE else logging.INFO)

# Create console handler with custom formatting
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(levelname)s] %(asctime)s - %(filename)s:%(lineno)d - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

app = FastAPI()

# Add CORSMiddleware to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def validate_pipeline(nodes: list, edges: list) -> dict:
    logger.debug(f"Extracted nodes: {nodes}")
    logger.debug(f"Extracted edges: {edges}")

    num_nodes = len(nodes)
    num_edges = len(edges)

    # 1. Build list of node IDs from the nodes payload
    logger.debug("Initializing node_ids collection...")
    node_ids = set()
    for node in nodes:
        if isinstance(node, dict) and 'id' in node:
            node_id_str = str(node['id'])
            node_ids.add(node_id_str)
            logger.debug(f"Processing node dict -> Node ID: {node_id_str} added to node_ids")
        elif isinstance(node, str):
            node_ids.add(node)
            logger.debug(f"Processing node string -> Node ID: {node} added to node_ids")
            
    # Also collect any node IDs referenced in edges to avoid graph mismatch,
    for edge in edges:
        if isinstance(edge, dict):
            source = edge.get('source')
            target = edge.get('target')
            logger.debug(f"Processing edge refs: source={source}, target={target}")
            if source:
                node_ids.add(str(source))
            if target:
                node_ids.add(str(target))

    logger.debug(f"Final node_ids set: {node_ids} (Total: {len(node_ids)})")

    # 2. Build adjacency list and compute in-degrees
    logger.debug("Initializing adjacency list and in-degrees maps...")
    adj = {node_id: [] for node_id in node_ids}
    in_degree = {node_id: 0 for node_id in node_ids}
    
    for edge in edges:
        if isinstance(edge, dict):
            source = str(edge.get('source', ''))
            target = str(edge.get('target', ''))
            logger.debug(f"Connecting edge: {source} -> {target}")
            if source in adj and target in in_degree:
                adj[source].append(target)
                in_degree[target] += 1
                logger.debug(f"Adjacency list updated for {source}: {adj[source]}")
                logger.debug(f"In-degree incremented for {target}: {in_degree[target]}")

    # 3. Kahn's Algorithm (BFS Topological Sort) for cycle detection
    logger.debug("Initializing Kahn's Algorithm...")
    logger.debug(f"Initial in-degrees: {in_degree}")
    
    initial_sources = [node_id for node_id in node_ids if in_degree[node_id] == 0]
    logger.debug(f"Finding initial source nodes (in-degree == 0): {initial_sources}")
    
    queue = deque(initial_sources)
    logger.debug(f"Initializing queue (frontier) with: {list(queue)}")
    visited_count = 0
    logger.debug(f"Initializing visited_count = {visited_count}")
    
    iteration = 1
    while queue:
        logger.debug(f"--- Loop Iteration {iteration} ---")
        logger.debug(f"Current Queue (Frontier) before pop: {list(queue)}")
        logger.debug(f"Current Visited Count: {visited_count}")
        
        u = queue.popleft()
        logger.debug(f"Popped Node: {u}")
        visited_count += 1
        logger.debug(f"Incrementing visited_count to {visited_count}")
        
        neighbors = adj.get(u, [])
        logger.debug(f"Processing outgoing edges from {u} (Neighbors: {neighbors})...")
        for v in neighbors:
            old_in_degree = in_degree[v]
            in_degree[v] -= 1
            logger.debug(f"Neighbor: {v} | Decrementing in-degree from {old_in_degree} to {in_degree[v]}")
            if in_degree[v] == 0:
                logger.debug(f"In-degree of {v} reached 0. Enqueuing {v}...")
                queue.append(v)
                logger.debug(f"Queue (Frontier) updated: {list(queue)}")
        
        iteration += 1

    logger.debug("Kahn's Algorithm completed.")
    logger.debug(f"Final Visited Count: {visited_count}, Total Node IDs: {len(node_ids)}")
    is_dag = (visited_count == len(node_ids))
    logger.debug(f"Calculation: visited_count == len(node_ids) -> is_dag: {is_dag}")
    
    response_data = {
        "num_nodes": num_nodes,
        "num_edges": num_edges,
        "is_dag": is_dag,
        "creator": "Saarthak Batra"
    }
    
    if not is_dag:
        cycle_nodes = [node_id for node_id in node_ids if in_degree[node_id] > 0]
        logger.debug(f"Cycle Nodes detected: {cycle_nodes}")
        response_data["cycle_nodes"] = cycle_nodes

    logger.debug(f"Returning JSON response: {response_data}")
    return response_data

@app.get('/')
def read_root():
    logger.debug("Entering read_root function")
    result = {'Ping': 'Pong'}
    logger.debug(f"Returning: {result}")
    return result

@app.post('/pipelines/parse')
def parse_pipeline(response: Response, pipeline: str = Form(...)):
    logger.debug(f"Entering parse_pipeline with raw input: {pipeline}")
    response.headers["X-Author"] = "Saarthak Batra"
    try:
        logger.debug("Parsing pipeline JSON...")
        data = json.loads(pipeline)
        logger.debug(f"Successfully parsed JSON. Data: {data}")
    except Exception as e:
        logger.debug(f"JSON parsing failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON format in pipeline: {str(e)}")

    nodes = data.get('nodes', [])
    edges = data.get('edges', [])
    
    return validate_pipeline(nodes, edges)

@app.websocket('/pipelines/run/ws')
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.debug("WebSocket connection accepted.")
    try:
        payload = await websocket.receive_text()
        logger.debug(f"Received WS payload: {payload}")
        
        try:
            data = json.loads(payload)
        except Exception as e:
            logger.debug(f"WS JSON parsing failed: {str(e)}")
            await websocket.send_json({"type": "error", "message": "Invalid JSON payload"})
            await websocket.close(code=1003)
            return

        nodes = data.get('nodes', [])
        edges = data.get('edges', [])
        
        await websocket.send_json({"type": "progress", "message": "Graph received. Starting validation..."})
        
        # Simulate delay for small graphs in debug mode
        if DEBUG_MODE and len(nodes) < 15:
            logger.debug("Simulating stream delay for small graph...")
            await asyncio.sleep(0.5)
            
        result = validate_pipeline(nodes, edges)
        await websocket.send_json({"type": "result", "data": result})
        await websocket.close()
        logger.debug("WebSocket connection closed gracefully.")
    except WebSocketDisconnect:
        logger.info("Client disconnected abruptly.")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
            await websocket.close(code=1011)
        except Exception:
            pass # Socket already closed
