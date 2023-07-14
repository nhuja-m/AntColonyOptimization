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

const AntComponent: React.FC<Ant> = ({ id, currentCity, path }) => {
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

  const c = 1.0;
  const alpha = 1;
  const beta = 5;
  const evaporation = 0.5;
  const Q = 500;
  const antFactor = 0.8;
  const randomFactor = 0.01;

  useEffect(() => {
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

  const initializeAnts = () => {
    const numberOfCities = nodes.length;
    const numberOfAnts = Math.floor(numberOfCities * antFactor);
    const antsArray: Ant[] = [];

    for (let i = 0; i < numberOfAnts; i++) {
      const ant: Ant = {
        id: i + 1,
        currentCity: getRandomCity(numberOfCities),
        path: [],
      };
      antsArray.push(ant);
    }

    setAnts(antsArray);
  };

  const getRandomCity = (numberOfCities: number) => {
    return Math.floor(Math.random() * numberOfCities) + 1;
  };

  const updateAnts = () => {
    const updatedAnts = ants.map((ant) => {
      const currentCity = ant.currentCity;
      const nextCity = chooseNextCity(ant, pheromones, distances);
      const updatedPath = [...ant.path, currentCity];

      return {
        ...ant,
        currentCity: nextCity,
        path: updatedPath,
      };
    });

    setAnts(updatedAnts);
  };

  const chooseNextCity = (ant: Ant, pheromones: number[][], distances: number[][]) => {
    const currentCity = ant.currentCity;
    const cities = nodes.map((node) => node.id);
    const remainingCities = cities.filter((city) => !ant.path.includes(city));

    let totalProbability = 0;
    const probabilities: number[] = [];

    remainingCities.forEach((city) => {
      const pheromone = pheromones[currentCity - 1][city - 1];
      const distance = distances[currentCity - 1][city - 1];
      const probability = Math.pow(pheromone, alpha) * Math.pow(1 / distance, beta);
      probabilities.push(probability);
      totalProbability += probability;
    });

    const rouletteWheel = probabilities.map((probability) => probability / totalProbability);

    let rouletteWheelPosition = Math.random();
    let nextCity = remainingCities[0];

    for (let i = 0; i < rouletteWheel.length; i++) {
      rouletteWheelPosition -= rouletteWheel[i];
      if (rouletteWheelPosition <= 0) {
        nextCity = remainingCities[i];
        break;
      }
    }

    return nextCity;
  };

  const updatePheromones = () => {
    const updatedPheromones: number[][] = [];

    for (let i = 0; i < nodes.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < nodes.length; j++) {
        row.push(pheromones[i][j] * evaporation);
      }
      updatedPheromones.push(row);
    }

    ants.forEach((ant) => {
      const antPath = ant.path;
      for (let i = 0; i < antPath.length - 1; i++) {
        const source = antPath[i] - 1;
        const target = antPath[i + 1] - 1;
        updatedPheromones[source][target] += Q / antPath.length;
        updatedPheromones[target][source] += Q / antPath.length;
      }
    });

    setPheromones(updatedPheromones);
  };

  const runAntColonyOptimization = () => {
    if (ants.length === 0 || pheromones.length === 0 || distances.length === 0) {
      // Handle invalid inputs
      return;
    }

    initializeAnts();
    const maxIterations = 10; // Adjust the maximum number of iterations as needed

    for (let i = 0; i < maxIterations; i++) {
      updateAnts();
      updatePheromones();
    }
  };

  useEffect(() => {
    panelRef.current?.addEventListener('click', handlePanelClick);
    return () => {
      panelRef.current?.removeEventListener('click', handlePanelClick);
    };
  }, []);

  return (
    <div ref={panelRef} className="graph-input-panel">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="graph-input-node"
          style={{
            left: node.x - 5,
            top: node.y - 5,
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
          <AntComponent key={ant.id} id={ant.id} currentCity={ant.currentCity} path={ant.path} />
        ))}
      </div>
      <div>Best Path: {bestPath.join(' -> ')}</div>
      <button onClick={runAntColonyOptimization}>Start Simulation</button>
    </div>
  );
};

export default GraphInputComponent;
