import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import type { GraphData, Lead } from '../types/api';

interface InvestigativeGraphProps {
  data: GraphData | null;
  onElementSelect?: (type: 'node' | 'edge' | null, data: any) => void;
  activeLead?: Lead | null;
  selectedSourceRecordId?: string | null;
  highlightedElementIds?: string[];
}

const InvestigativeGraph: React.FC<InvestigativeGraphProps> = ({ data, onElementSelect, activeLead, selectedSourceRecordId, highlightedElementIds = [] }) => {
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (cyRef.current && data) {
      const cy = cyRef.current;
      cy.elements().remove();
      cy.add(data.nodes);
      cy.add(data.edges);
      
      const layout = cy.layout({
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      });
      layout.run();

      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        if (onElementSelect) onElementSelect('node', node.data());
        
        // Highlight neighborhood
        cy.elements().removeClass('highlighted faded timeline-highlight');
        cy.elements().addClass('faded');
        
        const neighborhood = node.neighborhood();
        neighborhood.removeClass('faded').addClass('highlighted');
        node.removeClass('faded').addClass('highlighted');
      });

      cy.on('tap', 'edge', (evt) => {
        const edge = evt.target;
        if (onElementSelect) onElementSelect('edge', edge.data());

        cy.elements().removeClass('highlighted faded timeline-highlight');
        cy.elements().addClass('faded');
        
        edge.removeClass('faded').addClass('highlighted');
        edge.connectedNodes().removeClass('faded').addClass('highlighted');
      });

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          cy.elements().removeClass('highlighted faded timeline-highlight');
          if (onElementSelect) onElementSelect(null, null);
        }
      });
    }
  }, [data, onElementSelect]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    
    // Clear previous timeline highlights if any
    cy.elements().removeClass('timeline-highlight');

    if (selectedSourceRecordId) {
      // Do NOT fade the rest of the graph
      const matches = cy.elements(`[source_record_id = "${selectedSourceRecordId}"]`);
      matches.removeClass('faded').addClass('timeline-highlight');
      matches.connectedNodes().removeClass('faded').addClass('timeline-highlight');
    }
  }, [selectedSourceRecordId]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.elements().removeClass('highlighted faded');

    if (!activeLead) {
      return;
    }

    const nodeA = cy.getElementById(activeLead.entity_a);
    const nodeB = cy.getElementById(activeLead.entity_b);

    if (nodeA.length > 0 && nodeB.length > 0) {
      cy.elements().addClass('faded');
      
      // Find intersection of their neighborhoods (shared nodes/edges)
      const neighborhoodA = nodeA.neighborhood();
      const neighborhoodB = nodeB.neighborhood();
      const shared = neighborhoodA.intersection(neighborhoodB);
      
      nodeA.removeClass('faded').addClass('highlighted');
      nodeB.removeClass('faded').addClass('highlighted');
      
      if (shared.length > 0) {
        shared.removeClass('faded').addClass('highlighted');
        // Also highlight edges connecting A to shared, and B to shared
        neighborhoodA.edgesWith(shared).removeClass('faded').addClass('highlighted');
        neighborhoodB.edgesWith(shared).removeClass('faded').addClass('highlighted');
      } else {
        // Fallback: highlight shortest path if no direct shared nodes
        const dijkstra = cy.elements().dijkstra({ root: nodeA });
        const path = dijkstra.pathTo(nodeB);
        if (path.length > 0) {
          path.removeClass('faded').addClass('highlighted');
        }
      }
      
      // Zoom to fit the highlighted elements with padding
      cy.animate({
        fit: {
          eles: cy.elements('.highlighted'),
          padding: 50
        },
        duration: 500,
        options: { maxZoom: 1.5 }
      } as any);
    }
  }, [activeLead]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    
    // If there are other highlight sources active (like activeLead or selectedRecord), we might conflict.
    // For MVP, we'll just add our highlights if array is not empty.
    if (highlightedElementIds && highlightedElementIds.length > 0) {
      cy.elements().removeClass('highlighted faded timeline-highlight');
      cy.elements().addClass('faded');
      
      const elementsToHighlight = cy.collection();
      highlightedElementIds.forEach(id => {
        const ele = cy.getElementById(id);
        if (ele.length > 0) {
          elementsToHighlight.merge(ele);
          if (ele.isEdge()) {
             elementsToHighlight.merge(ele.connectedNodes());
          }
        }
      });
      
      if (elementsToHighlight.length > 0) {
        elementsToHighlight.removeClass('faded').addClass('highlighted');
        
        cy.animate({
          fit: {
            eles: elementsToHighlight,
            padding: 50
          },
          duration: 500,
          options: { maxZoom: 1.5 }
        } as any);
      }
    } else if (!activeLead && !selectedSourceRecordId) {
      // If we cleared the AI highlights and nothing else is selected, reset
      cy.elements().removeClass('highlighted faded timeline-highlight');
    }
  }, [highlightedElementIds]);

  const stylesheet: cytoscape.StylesheetStyle[] = [
    {
      selector: 'node',
      style: {
        'label': 'data(name)',
        'color': '#E2E8F0',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 5,
        'font-size': '10px',
        'font-family': 'Inter, sans-serif',
        'background-color': '#111827',
        'border-width': 2,
        'border-color': '#0891b2', // default cyan border
        'width': 30,
        'height': 30,
      }
    },
    {
      selector: 'node[label="PERSON"]',
      style: {
        'border-color': '#0d9488', // teal for persons
        'shape': 'ellipse'
      }
    },
    {
      selector: 'node[label="VEHICLE"]',
      style: {
        'border-color': '#8b5cf6', // purple
        'shape': 'round-rectangle'
      }
    },
    {
      selector: 'node[label="PHONE"]',
      style: {
        'border-color': '#ec4899', // pink
        'shape': 'diamond'
      }
    },
    {
      selector: 'node[label="LOCATION"]',
      style: {
        'border-color': '#eab308', // yellow
        'shape': 'hexagon'
      }
    },
    {
      selector: 'node[label="ORGANIZATION"]',
      style: {
        'border-color': '#3b82f6', // blue
        'shape': 'barrel'
      }
    },
    {
      selector: 'node[?is_cross_case]', // nodes with is_cross_case=true
      style: {
        'border-color': '#d97706', // amber for cross case
        'border-width': 3,
        'border-style': 'double'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': '#374151',
        'target-arrow-color': '#374151',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(type)',
        'font-size': '8px',
        'color': '#9ca3af',
        'text-rotation': 'autorotate',
        'text-margin-y': -10
      }
    },
    {
      selector: '.highlighted',
      style: {
        'border-width': 3,
        'border-color': '#f3f4f6',
        'line-color': '#f3f4f6',
        'target-arrow-color': '#f3f4f6',
        'color': '#ffffff',
        'font-weight': 'bold',
        'z-index': 10
      }
    },
    {
      selector: '.timeline-highlight',
      style: {
        'border-width': 4,
        'border-color': '#10b981', // green for timeline match
        'line-color': '#10b981',
        'target-arrow-color': '#10b981',
        'z-index': 15
      }
    },
    {
      selector: '.faded',
      style: {
        'opacity': 0.25,
        'text-opacity': 0
      }
    }
  ];

  return (
    <div className="graph-container" style={{ position: 'relative' }}>
      <CytoscapeComponent
        elements={[]}
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
        stylesheet={stylesheet}
        cy={(cy: cytoscape.Core) => { cyRef.current = cy; }}
        wheelSensitivity={0.1}
      />
      <div style={{
        position: 'absolute', bottom: '10px', left: '10px',
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '0.7rem',
        color: '#9ca3af',
        display: 'flex',
        gap: '16px',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #0d9488' }}></div> PERSON
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', transform: 'rotate(45deg)', border: '2px solid #ec4899' }}></div> PHONE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', border: '2px solid #8b5cf6' }}></div> VEHICLE
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '12px', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', border: '2px solid #eab308' }}></div> LOCATION
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '10px', borderRadius: '2px', border: '2px solid #3b82f6' }}></div> ORGANIZATION
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigativeGraph;
