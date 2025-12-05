export const initialInteractionState = {
  hoveredNode: null,
  hoveredEdge: null,
  nearbyEdges: [],
  selectedEdge: null,
  edgeOptions: [],
  tooltip: null,
};

export function interactionReducer(state, action) {
  switch (action.type) {
    case 'HOVER_NODE':
      return {
        ...initialInteractionState,
        hoveredNode: action.node,
        tooltip: { type: 'node', x: action.x, y: action.y },
      };

    case 'HOVER_EDGE':
      return {
        ...initialInteractionState,
        hoveredEdge: action.edge,
        nearbyEdges: action.nearbyEdges,
        tooltip: { type: 'edge', x: action.x, y: action.y },
      };

    case 'SELECT_EDGE':
      return {
        ...state,
        selectedEdge: action.edge,
        edgeOptions: [],
      };

    case 'SHOW_EDGE_OPTIONS':
      return {
        ...state,
        edgeOptions: action.edges,
      };

    case 'HOVER_NOTHING':
    case 'CLOSE_MODAL':
    case 'RESET':
      return initialInteractionState;

    default:
      return state;
  }
}