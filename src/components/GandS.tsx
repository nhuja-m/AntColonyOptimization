import React, { useRef, useState, useEffect } from 'react';

type GraphNode = {
  id: number;
  x: number;
  y: number;
};

type Edge = {
  source: number;
  target: number;
};

type Ant = {
    id: number;
    currentCity: number;
    path: number[];
  };

type GraphInputComponentProps = {
  onNodeUpdate: (updatedNodes: GraphNode[]) => void;
};

const Ant: React.FC<Ant> = ({ id, currentCity, path }) => {
    // Implement the rendering logic for the Ant component
    return (
      <div>
        Ant {id}: Current City - {currentCity}, Path - {path.join(' -> ')}
      </div>
    );
  };

const GraphInputComponent: React.FC<GraphInputComponentProps> = ({ onNodeUpdate }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const [ants, setAnts] = useState<Ant[]>([]);
  const [bestPath, setBestPath] = useState<number[]>([]);
  const [pheromones, setPheromones] = useState<number[][]>([]);
  const [distances, setDistances] = useState<number[][]>([]);

  useEffect(() => {
    // Calculate initial pheromones and distances
    // Replace with your own logic to calculate initial values
    const initialPheromones: number[][] = [];
    const initialDistances: number[][] = [];

    setPheromones(initialPheromones);
    setDistances(initialDistances);
  }, []);

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

  const handleStartSimulation = () => {
    // Run the ant colony optimization algorithm
    if (ants.length === 0 || pheromones.length === 0 || distances.length === 0) {
      // Handle invalid inputs
      return;
    }

    // Replace with your own logic for the ant colony optimization algorithm
    const updatedAnts: Ant[] = [];
    const updatedBestPath: number[] = [];

    setAnts(updatedAnts);
    setBestPath(updatedBestPath);
  };

  const moveAnts = () => {
    const updatedAnts = ants.map((ant) => {
      // Replace with your own logic to choose the next city for each ant
      const updatedAnt: Ant = {
        ...ant,
        currentCity: chooseNextCity(ant, pheromones, distances),
      };

      return updatedAnt;
    });

    setAnts(updatedAnts);
  };

  useEffect(() => {
    // Add event listener to the graph panel for node creation
    panelRef.current?.addEventListener('click', handlePanelClick);

    // Start moving the ants when the component mounts
    const intervalId = setInterval(moveAnts, 1000); // Adjust the interval duration as needed

    return () => {
      // Clean up the event listener and interval when the component unmounts
      panelRef.current?.removeEventListener('click', handlePanelClick);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div ref={panelRef} className="graph-input-panel">
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
      <svg className="graph-input-edges">
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
      <div className="ant-container">
        {ants.map((ant) => (
          <Ant key={ant.id} id={ant.id} currentCity={ant.currentCity} path={ant.path} />
        ))}
      </div>
      <button onClick={handleStartSimulation}>Start Simulation</button>
    </div>
  );
};

export default GraphInputComponent;
