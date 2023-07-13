import React from 'react';

type GraphNode = {
  id: number;
  x: number;
  y: number;
}

type NodeListProps = {
  nodes: GraphNode[];
}

const NodeList: React.FC<NodeListProps> = ({ nodes }) => {
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>X</th>
            <th>Y</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.id}>
              <td>{node.id}</td>
              <td>{node.x}</td>
              <td>{node.y}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NodeList;
