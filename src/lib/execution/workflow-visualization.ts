/**
 * Workflow visualization utilities
 */

import { Workflow, WorkflowNode, Connection } from './workflow-executor';

/**
 * Node position information for visualization
 */
export interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Connection visualization data
 */
export interface ConnectionVisualization extends Connection {
  path: string;
  animationOffset?: number;
}

/**
 * Options for automatic layout
 */
export interface LayoutOptions {
  direction: 'horizontal' | 'vertical';
  nodeWidth: number;
  nodeHeight: number;
  padding: number;
  levelDistance: number;
}

/**
 * Class for handling workflow visualization layout
 */
export class WorkflowVisualizer {
  private positions: Map<string, NodePosition> = new Map();
  private connections: ConnectionVisualization[] = [];
  private workflow: Workflow;
  private options: LayoutOptions;
  
  constructor(
    workflow: Workflow, 
    options: Partial<LayoutOptions> = {}
  ) {
    this.workflow = workflow;
    
    this.options = {
      direction: 'horizontal',
      nodeWidth: 150,
      nodeHeight: 80,
      padding: 20,
      levelDistance: 200,
      ...options
    };
    
    // Calculate layout
    this.calculateLayout();
    this.calculateConnections();
  }
  
  /**
   * Auto-layout algorithm for positioning nodes
   */
  private calculateLayout(): void {
    const { nodes, connections } = this.workflow;
    const { nodeWidth, nodeHeight, padding, levelDistance, direction } = this.options;
    
    // Calculate levels (depths) of nodes
    const levels = this.calculateNodeLevels(nodes, connections);
    
    // Count nodes in each level
    const levelCounts = new Map<number, number>();
    for (const [nodeId, level] of levels) {
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    }
    
    // Position nodes by level
    const horizontalGap = direction === 'horizontal' ? levelDistance : nodeWidth + padding;
    const verticalGap = direction === 'horizontal' ? nodeHeight + padding : levelDistance;
    
    for (const node of nodes) {
      const level = levels.get(node.id) || 0;
      const nodesInLevel = levelCounts.get(level) || 1;
      const nodeIndex = this.getNodeIndexInLevel(node.id, level, levels);
      
      let x = 0;
      let y = 0;
      
      if (direction === 'horizontal') {
        // Horizontal layout (left to right)
        x = level * horizontalGap;
        y = nodeIndex * verticalGap;
      } else {
        // Vertical layout (top to bottom)
        x = nodeIndex * horizontalGap;
        y = level * verticalGap;
      }
      
      this.positions.set(node.id, {
        id: node.id,
        x, y,
        width: nodeWidth,
        height: nodeHeight
      });
    }
  }
  
  /**
   * Calculate levels for each node based on graph structure
   */
  private calculateNodeLevels(nodes: WorkflowNode[], connections: Connection[]): Map<string, number> {
    const levels = new Map<string, number>();
    const incomingConnections = new Map<string, number>();
    
    // Count incoming connections for each node
    for (const node of nodes) {
      incomingConnections.set(node.id, 0);
    }
    
    for (const conn of connections) {
      incomingConnections.set(conn.target, (incomingConnections.get(conn.target) || 0) + 1);
    }
    
    // Find root nodes (nodes with no incoming connections)
    const rootNodes = nodes
      .filter(node => (incomingConnections.get(node.id) || 0) === 0)
      .map(node => node.id);
    
    // Assign level 0 to root nodes
    for (const rootId of rootNodes) {
      levels.set(rootId, 0);
    }
    
    // Build adjacency list
    const outgoing = new Map<string, string[]>();
    for (const node of nodes) {
      outgoing.set(node.id, []);
    }
    
    for (const conn of connections) {
      outgoing.get(conn.source)?.push(conn.target);
    }
    
    // BFS to calculate levels
    const queue = [...rootNodes];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const level = levels.get(nodeId)!;
      
      for (const targetId of outgoing.get(nodeId) || []) {
        const currentLevel = levels.get(targetId);
        if (currentLevel === undefined || currentLevel < level + 1) {
          levels.set(targetId, level + 1);
        }
        
        // Decrement incoming count and add to queue if all incoming edges are processed
        const newCount = (incomingConnections.get(targetId) || 0) - 1;
        incomingConnections.set(targetId, newCount);
        
        if (newCount === 0) {
          queue.push(targetId);
        }
      }
    }
    
    // Handle cycles by setting remaining nodes to maximum level + 1
    const maxLevel = Math.max(...[...levels.values()]);
    for (const node of nodes) {
      if (!levels.has(node.id)) {
        levels.set(node.id, maxLevel + 1);
      }
    }
    
    return levels;
  }
  
  /**
   * Get the index of a node within its level
   */
  private getNodeIndexInLevel(nodeId: string, level: number, levels: Map<string, number>): number {
    let index = 0;
    
    for (const [id, nodeLevel] of levels) {
      if (nodeLevel === level && id < nodeId) {
        index++;
      }
    }
    
    return index;
  }
  
  /**
   * Calculate connection paths
   */
  private calculateConnections(): void {
    this.connections = [];
    
    for (const conn of this.workflow.connections) {
      const source = this.positions.get(conn.source);
      const target = this.positions.get(conn.target);
      
      if (!source || !target) continue;
      
      const isHorizontal = this.options.direction === 'horizontal';
      let path = '';
      
      // Calculate source and target points
      const sourceX = isHorizontal ? source.x + source.width : source.x + source.width / 2;
      const sourceY = isHorizontal ? source.y + source.height / 2 : source.y + source.height;
      const targetX = isHorizontal ? target.x : target.x + target.width / 2;
      const targetY = isHorizontal ? target.y + target.height / 2 : target.y;
      
      if (isHorizontal) {
        // Horizontal layout - bezier curve
        const controlX1 = sourceX + (targetX - sourceX) * 0.4;
        const controlX2 = targetX - (targetX - sourceX) * 0.4;
        
        path = `M ${sourceX},${sourceY} C ${controlX1},${sourceY} ${controlX2},${targetY} ${targetX},${targetY}`;
      } else {
        // Vertical layout - bezier curve
        const controlY1 = sourceY + (targetY - sourceY) * 0.4;
        const controlY2 = targetY - (targetY - sourceY) * 0.4;
        
        path = `M ${sourceX},${sourceY} C ${sourceX},${controlY1} ${targetX},${controlY2} ${targetX},${targetY}`;
      }
      
      this.connections.push({
        ...conn,
        path,
        animationOffset: Math.random() // Used for staggered animations
      });
    }
  }
  
  /**
   * Get node positions
   */
  public getNodePositions(): NodePosition[] {
    return Array.from(this.positions.values());
  }
  
  /**
   * Get connection paths
   */
  public getConnections(): ConnectionVisualization[] {
    return this.connections;
  }
  
  /**
   * Get position for a specific node
   */
  public getNodePosition(nodeId: string): NodePosition | undefined {
    return this.positions.get(nodeId);
  }
  
  /**
   * Get SVG paths for connections
   */
  public getConnectionPaths(): { id: string; path: string; sourceId: string; targetId: string }[] {
    return this.connections.map(conn => ({
      id: `${conn.source}-${conn.target}`,
      path: conn.path,
      sourceId: conn.source,
      targetId: conn.target
    }));
  }
  
  /**
   * Get canvas dimensions
   */
  public getCanvasDimensions(): { width: number; height: number } {
    const positions = Array.from(this.positions.values());
    
    if (positions.length === 0) {
      return { width: 800, height: 600 };
    }
    
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const maxY = Math.max(...positions.map(p => p.y + p.height));
    
    return {
      width: maxX + this.options.padding * 2,
      height: maxY + this.options.padding * 2
    };
  }
}