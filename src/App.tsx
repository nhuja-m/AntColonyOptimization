import React, { useState } from 'react';
import GraphInputComponent from './components/GraphInput';
import NodeList from './components/NodeList';
import './App.css';

type GraphNode = {
  id: number;
  x: number;
  y: number;
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);

  const handleNodeUpdate = (updatedNodes: GraphNode[]) => {
    setNodes(updatedNodes);
  };

  return (
    <div className="container">
      <div className="left-section">
        <NodeList nodes={nodes} />
      </div>
      <div className="center-section">
        <GraphInputComponent onNodeUpdate={handleNodeUpdate} />
      </div>
      <div className="right-section"></div>
    </div>
  );
};

export default App;
