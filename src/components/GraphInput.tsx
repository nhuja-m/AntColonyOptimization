import React, { useRef, useState, useEffect } from 'react';
import './GraphInputComponent.css';

type GraphNode = {
  id: number;
  x: number;
  y: number;
};

type Edge = {
  source: number;
  target: number;
};

type GraphInputComponentProps = {
  onNodeUpdate: (updatedNodes: GraphNode[]) => void;
};

const GraphInputComponent: React.FC<GraphInputComponentProps> = ({ onNodeUpdate }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const handlePanelClick = (event: MouseEvent) => {
      const panel = panelRef.current;
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newNode: GraphNode = {
        id: nodes.length + 1,
        x,
        y,
      };

      setNodes((prevNodes) => [...prevNodes, newNode]);
    };

    panelRef.current?.addEventListener('click', handlePanelClick);

    return () => {
      panelRef.current?.removeEventListener('click', handlePanelClick);
    };
  }, [nodes]);

  useEffect(() => {
    // Generate edges between nodes
    const newEdges: Edge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const source = nodes[i].id;
        const target = nodes[j].id;
        newEdges.push({ source, target });
      }
    }
    setEdges(newEdges);

    onNodeUpdate(nodes);
  }, [nodes, onNodeUpdate]);

  return (
    <div
      ref={panelRef}
      className="graph-input-panel"
    >
      {nodes.map((node) => (
        <div
        key={node.id}
        className="graph-input-node"
        style={{
          left: node.x - 5, // Adjust for node width (10px)
          top: node.y - 5, // Adjust for node height (10px)
        }}
        />
      ))}
      <svg
         className="graph-input-edges"
      >
        {edges.map((edge, index) => (
          <line
            key={index}
            x1={nodes.find((node) => node.id === edge.source)?.x}
            y1={nodes.find((node) => node.id === edge.source)?.y}
            x2={nodes.find((node) => node.id === edge.target)?.x}
            y2={nodes.find((node) => node.id === edge.target)?.y}
            style={{ stroke: 'black', strokeWidth: 1 }}
          />
        ))}
      </svg>
    </div>
  );
};

export default GraphInputComponent;