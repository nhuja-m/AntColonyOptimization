import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  pathLength: number;  // New attribute for storing path length
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
  const antFactor = 1.8;
  const randomFactor = 0.01;

  const initialPheromones: number[][] = [];
  const initialDistances: number[][] = [];

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

  useEffect(() => {
    console.log("Updated bestPath: ", bestPath);
}, [bestPath]);

  useEffect(() => {
    const distancesMatrix = generateDistancesMatrix(nodes);
    setDistances(distancesMatrix);
    setNumberOfCities(distancesMatrix.length);
  
    const initialPheromonesMatrix = generateInitialPheromonesMatrix(distancesMatrix.length);
    setPheromones(initialPheromonesMatrix);
    setDistances(distancesMatrix);
  }, [nodes]);
  
  useEffect(() => {
    panelRef.current?.addEventListener('click', handlePanelClick);
    return () => {
      panelRef.current?.removeEventListener('click', handlePanelClick);
    };
  }, []);

  const initializeAnts = useCallback(() => {
    const numberOfCities = nodes.length;
    const numberOfAnts = Math.floor(numberOfCities * antFactor);
    const antsArray: Ant[] = [];
  
    for (let i = 0; i < numberOfAnts; i++) {
      const city = getRandomCity(numberOfCities)
      const ant: Ant = {
        id: i + 1,
        currentCity: city,
        path: [city],
        pathLength: 0
      };
      antsArray.push(ant);
    }
  
    setAnts(antsArray);
  }, [nodes]);
  
  useEffect(() => {
    initializeAnts();
  }, [initializeAnts]);

  const getRandomCity = (numberOfCities: number) => {
    return Math.floor(Math.random() * numberOfCities) + 1;
  };

  // const performAntUpdate = (prevAnts: Ant[]) => {
  //   return prevAnts.map((ant) => {
  //     const currentCity = ant.currentCity;
  //     console.log("current city: ", currentCity);
  //     console.log("current path: ", ant.path);
  //     const nextCity = chooseNextCity(ant, ant.path, pheromones, distances);  // Use ant.path directly here
  //     console.log("next city: ", nextCity);
  //     const updatedPath = [...ant.path, nextCity];
  //     console.log("updated path: ", updatedPath);
      
  //     // Calculate path length for the updated path
  //     let updatedPathLength = 0;
  //     for (let i = 0; i < updatedPath.length - 1; i++) {
  //       updatedPathLength += distances[updatedPath[i] - 1][updatedPath[i + 1] - 1];
  //     }
  //     console.log("updatedpath len:", updatedPathLength);
  
  //     return {
  //       ...ant,
  //       currentCity: nextCity,
  //       path: updatedPath,
  //       pathLength: updatedPathLength  // Update the pathLength for the ant
  //     };
  //   });
  // };

  const performAntUpdate = (prevAnts: Ant[]) => {
    let updatedAnts = [...prevAnts];  // Clone the ants
  
    for (let currentIndex = 0; currentIndex < numberOfCities - 1; currentIndex++) {
      updatedAnts = updatedAnts.map((ant) => {
        const currentCity = ant.currentCity;
        console.log("current city: ", currentCity);
        console.log("current path: ", ant.path);

        if (ant.path.length === numberOfCities) {
          return ant;
      }
  
        const nextCity = chooseNextCity(ant, ant.path, pheromones, distances);
        console.log("next city: ", nextCity);
  
        const updatedPath = [...ant.path, nextCity];
        console.log("updated path: ", updatedPath);
        
        // Calculate path length for the updated path
        let updatedPathLength = 0;
        for (let i = 0; i < updatedPath.length - 1; i++) {
          updatedPathLength += distances[updatedPath[i] - 1][updatedPath[i + 1] - 1];
        }
        console.log("updatedpath len:", updatedPathLength);
  
        return {
          ...ant,
          currentCity: nextCity,
          path: updatedPath,
          pathLength: updatedPathLength
        };
      });
    }
  
    return updatedAnts;
  };
  
  


  // const chooseNextCity = (ant: Ant, pheromones: number[][], distances: number[][]) => {
  const chooseNextCity = (ant: Ant, previousPath: number[], pheromones: number[][], distances: number[][]) => {
    const currentCity = ant.currentCity;
    const cities = nodes.map((node) => node.id);
    // const remainingCities = cities.filter((city) => !ant.path.includes(city));
    const remainingCities = cities.filter((city) => !previousPath.includes(city));

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

  const updateBest = (currentAnts: Ant[]) => {
    let bestTourLength = Infinity;
    let bestTourOrder: number[] = [];
  
    currentAnts.forEach((ant) => {
      if (ant.path.length !== nodes.length) return; 
      const tourLength = ant.pathLength;
      console.log("inside updatebest ant path len: ", tourLength);
      if (tourLength < bestTourLength) {
        bestTourLength = tourLength;
        bestTourOrder = ant.path.slice();
      }
    });
  
    setBestPath(bestTourOrder);
    console.log("bestPath: ", bestPath);
  };
  
  const updatePheromones = (currentAnts: Ant[]) => {
    const updatedPheromones: number[][] = [];
  
    for (let i = 0; i < nodes.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < nodes.length; j++) {
        row.push(pheromones[i][j] * evaporation);
      }
      updatedPheromones.push(row);
    }
  
    currentAnts.forEach((ant) => {
      console.log("inside phermones ant path:", ant.path);
      console.log("inside phermones ant path length:", ant.pathLength);

      const antPath = ant.path;
      const contribution = Q / ant.pathLength;
      console.log("contribution: ", contribution);
      for (let i = 0; i < antPath.length - 1; i++) {
        const source = antPath[i] - 1;
        const target = antPath[i + 1] - 1;
        updatedPheromones[source][target] += contribution;
        updatedPheromones[target][source] += contribution;
      }
    });
  
    setPheromones(updatedPheromones);
  };

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

const runAntColonyOptimization = async () => {
  console.log("ants.length: ", ants.length);

  if (ants.length === 0 || pheromones.length === 0 || distances.length === 0) {
      return;
  }

  const maxIterations = 200;
  
  let currentAnts = [...ants];  // Make a copy of the ants
  for (let i = 0; i < maxIterations; i++) {
      currentAnts = performAntUpdate(currentAnts);  // Update the ants based on previous state
      updatePheromones(currentAnts);  // This remains unchanged using global state
      updateBest(currentAnts);  // This also remains unchanged using global state
  }
  setAnts(currentAnts);  // Update the React state at the end
};

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
          
          const indexOfSource = bestPath.indexOf(edge.source);
          const isConsecutiveEdge = indexOfSource !== -1 && 
                                    (bestPath[indexOfSource + 1] === edge.target || 
                                    bestPath[indexOfSource - 1] === edge.target);
          const isLoopBackEdge = (edge.source === bestPath[0] && 
                                edge.target === bestPath[bestPath.length - 1]) || 
                                (edge.target === bestPath[0] && 
                                edge.source === bestPath[bestPath.length - 1]);
          const isBestPathEdge = isConsecutiveEdge || isLoopBackEdge;
          const strokeColor = isBestPathEdge ? 'red' : 'black';
          const strokeWidth = isBestPathEdge ? 3 : 1;

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
          <AntComponent key={`${ant.id}-${ant.currentCity}`} id={ant.id} currentCity={ant.currentCity} path={ant.path} pathLength={ant.pathLength}/>
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