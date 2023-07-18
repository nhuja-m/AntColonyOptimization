import React, { useRef, useState, useEffect } from 'react';
import { Button } from 'antd';
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

let nodeIdCounter = 1;

const GraphInputComponent: React.FC<GraphInputComponentProps> = ({ onNodeUpdate }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [ants, setAnts] = useState<Ant[]>([]);
  const [bestPath, setBestPath] = useState<number[]>([]);
  const [pheromones, setPheromones] = useState<number[][]>([]);
  const [distances, setDistances] = useState<number[][]>([]);
  const [numberOfCities, setNumberOfCities] = useState<number>(0);
  
  const c = 1.0;
  const alpha = 1;
  const beta = 5;
  const evaporation = 0.5;
  const Q = 500;
  const antFactor = 0.8;
  const randomFactor = 0.01;


  const initialPheromones: number[][] = [];
  const initialDistances: number[][] = [];

  useEffect(() => {
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
      id: nodeIdCounter,
      x,
      y,
    };
    nodeIdCounter++;

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

  // gets correct numver of ants randomly assigned with 0 path len
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

  useEffect(() => {
    const antArrayLength = ants.length;
  }, [ants]);

  const getRandomCity = (numberOfCities: number) => {
    return Math.floor(Math.random() * numberOfCities) + 1;
  };

  const updateAnts = () => {
    console.log("inside updateAnts");
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
    updateBest();
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

  const runAntColonyOptimization = async () => {
    await initializeAnts();
    console.log("ants.length: ", ants.length);
    // if (ants.length === 0 || pheromones.length === 0 || distances.length === 0) {
    //   // Handle invalid inputs
    //   console.log("invalid");
    //   return;
    // }
    console.log("valid");

    const maxIterations = 10; // Adjust the maximum number of iterations as needed

    for (let i = 0; i < maxIterations; i++) {
      updateAnts();
      updatePheromones();
      // updateBest();
    }    
    console.log("bestPath: II ", bestPath);
  };

  useEffect(() => {
    panelRef.current?.addEventListener('click', handlePanelClick);
    return () => {
      panelRef.current?.removeEventListener('click', handlePanelClick);
    };
  }, []);



  const calculateDistance = (node1: GraphNode, node2: GraphNode) => {
    const dx = node2.x - node1.x;
    const dy = node2.y - node1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  const generateDistancesMatrix = (nodes: GraphNode[]) => {
    const numberOfCities = nodes.length;
    const distances: number[][] = [];
  
    for (let i = 0; i < numberOfCities; i++) {
      distances[i] = [];
      for (let j = 0; j < numberOfCities; j++) {
        if (i === j) {
          distances[i][j] = 0;
        } else {
          distances[i][j] = calculateDistance(nodes[i], nodes[j]);
        }
      }
    }
  
    return distances;
  };
  
  useEffect(() => {
    const distancesMatrix = generateDistancesMatrix(nodes);
    setDistances(distancesMatrix);
  }, [nodes]);
  
  const generateInitialPheromonesMatrix = (numberOfCities: number) => {
    const pheromones: number[][] = [];
  
    for (let i = 0; i < numberOfCities; i++) {
      pheromones[i] = [];
      for (let j = 0; j < numberOfCities; j++) {
        pheromones[i][j] = c;
      }
    }
  
    return pheromones;
  };
  
  useEffect(() => {
    if (distances.length > 0) {
      const numberOfCities = distances.length;
      const initialPheromonesMatrix = generateInitialPheromonesMatrix(numberOfCities);
      setPheromones(initialPheromonesMatrix);
    }
  }, [distances]);
  
  
  const trailLength = (ant: Ant) => {
    console.log("city num", numberOfCities);
    let length = distances[ant.path[numberOfCities - 1] - 1][ant.path[0] - 1];

    for (let i = 0; i < numberOfCities - 1; i++) {
      length += distances[ant.path[i] - 1][ant.path[i + 1] - 1];
    }
    return length;
  };

  const updateBest = () => {
    let bestTourLength = Infinity;
    let bestTourOrder: number[] = [];
  
    ants.forEach((ant) => {
      const tourLength = trailLength(ant);
      if (tourLength < bestTourLength) {
        bestTourLength = tourLength;
        bestTourOrder = ant.path.slice();
      }
    });
  
    setBestPath(bestTourOrder);
    console.log("bestPath: ", bestPath);
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
      const contribution = Q / trailLength(ant);
      for (let i = 0; i < antPath.length - 1; i++) {
        const source = antPath[i] - 1;
        const target = antPath[i + 1] - 1;
        updatedPheromones[source][target] += contribution;
        updatedPheromones[target][source] += contribution;
      }
    });
  
    setPheromones(updatedPheromones);
  };


  useEffect(() => {
    const distancesMatrix = generateDistancesMatrix(nodes);
    setDistances(distancesMatrix);
    setNumberOfCities(distancesMatrix.length);
  }, [nodes]);
  


  useEffect(() => {
    if (distances.length > 0) {
      const initialPheromonesMatrix = generateInitialPheromonesMatrix(numberOfCities);
      setPheromones(initialPheromonesMatrix);
    }
  }, [distances, numberOfCities]);
  
  useEffect(() => {
    console.log("bestPath effect: ", bestPath);
  }, [bestPath]);

  return (
    <div className="graph-input-container">
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
        {edges.map((edge, index) => {
          const sourceNode = nodes.find((node) => node.id === edge.source);
          const targetNode = nodes.find((node) => node.id === edge.target);
          const isBestPathEdge = bestPath.includes(edge.source) && bestPath.includes(edge.target);
          const strokeColor = isBestPathEdge ? 'red' : 'black';
          const strokeWidth = isBestPathEdge ? 10 : 1;

          if (sourceNode && targetNode) {
            return (
              <line
                key={index}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                style={{ stroke: strokeColor, strokeWidth }}
              />
            );
          }

          return null;
        })}
      </svg>

      </div>
  
      <div className="ant-container">
        {ants.map((ant) => (
          <AntComponent key={`${ant.id}-${ant.currentCity}`} id={ant.id} currentCity={ant.currentCity} path={ant.path} />
        ))}
      </div>
      <div>Best Path: {bestPath.join(' -> ')}</div>
      <div className="button-container">
        <Button onClick={runAntColonyOptimization}>Start Simulation</Button>
      </div>
    </div>
  );

  
};

export default GraphInputComponent;
