// Declaraciones de tipos para reportes-charts.js

interface Window {
  Chart?: any;
  chartInstance?: any;
  chartEstadoInstance?: any;
  chartClientesInstance?: any;
}

interface HTMLCanvasElement {
  getContext(contextId: '2d'): CanvasRenderingContext2D | null;
}
