// assets/js/utils/pdf-export.js — Exportación a PDF completa
import { toastSuccess, toastError } from './alerts.js';

async function ensureJsPDF() {
  if (window.jspdf?.jsPDF) {return;}
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar jsPDF'));
    document.head.appendChild(script);
  });
}

export async function exportToPDF(config = {}) {
  const {
    title = 'Reporte',
    subtitle = '',
    data = [],
    columns = [],
    headers = [],
    footer = true,
    logo = null
  } = config;

  try {
    await ensureJsPDF();
    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 15;

    // Colores profesionales
    const primaryColor = [59, 130, 246]; // Azul
    const textColor = [55, 65, 81]; // Gris oscuro
    const lightGray = [243, 244, 246]; // Gris claro

    // Encabezado
    if (logo) {
      doc.addImage(logo, 'PNG', 12, yPosition, 20, 20);
      yPosition += 5;
    }

    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    if (subtitle) {
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
    }

    // Fecha y hora
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const fecha = new Date().toLocaleString('es-PE');
    doc.text(`Generado: ${fecha}`, 12, yPosition);
    yPosition += 6;

    // Línea separadora
    doc.setDrawColor(...primaryColor);
    doc.line(12, yPosition, pageWidth - 12, yPosition);
    yPosition += 8;

    // Tabla de datos
    if (data && data.length > 0 && columns && columns.length > 0) {
      const tableData = data.map(item =>
        columns.map(col => {
          const value = item[col.key];
          if (col.format) {return col.format(value);}
          return String(value || '-');
        })
      );

      const tableHeaders = columns.map(col => col.label);

      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: yPosition,
        margin: { left: 12, right: 12 },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          textColor: textColor,
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
        didDrawPage: (data) => {
          // Pie de página
          if (footer) {
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.getHeight();
            const pageWidth = pageSize.getWidth();
            
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Página ${doc.internal.getNumberOfPages()}`,
              pageWidth / 2,
              pageHeight - 10,
              { align: 'center' }
            );
          }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Resumen/Totales si existen
    if (headers && headers.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text('Resumen', 12, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setTextColor(...textColor);
      headers.forEach(header => {
        doc.text(`${header.label}: ${header.value}`, 15, yPosition);
        yPosition += 6;
      });
    }

    // Descargar
    doc.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    toastSuccess('✅ PDF descargado correctamente');
    return true;
  } catch (error) {
    console.error('Error en PDF export:', error);
    toastError('❌ Error al generar PDF: ' + error.message);
    return false;
  }
}

export async function exportReportToPDF(config = {}) {
  const {
    title = 'Reporte de Ventas',
    ventas = [],
    estadisticas = {},
    fechaDesde = null,
    fechaHasta = null
  } = config;

  const columns = [
    { key: 'numero', label: 'Referencia' },
    { key: 'clienteNombre', label: 'Cliente' },
    { key: 'fecha', label: 'Fecha', format: (v) => new Date(v).toLocaleDateString('es-PE') },
    { key: 'estado', label: 'Estado' },
    { key: 'total', label: 'Total', format: (v) => `S/ ${Number(v).toFixed(2)}` }
  ];

  const headers = [
    { label: 'Total de Ventas', value: `S/ ${(estadisticas.total || 0).toFixed(2)}` },
    { label: 'Cantidad', value: estadisticas.cantidad || 0 },
    { label: 'Promedio', value: `S/ ${(estadisticas.promedio || 0).toFixed(2)}` }
  ];

  const subtitle = fechaDesde && fechaHasta
    ? `Del ${new Date(fechaDesde).toLocaleDateString('es-PE')} al ${new Date(fechaHasta).toLocaleDateString('es-PE')}`
    : '';

  return exportToPDF({
    title,
    subtitle,
    data: ventas,
    columns,
    headers,
    footer: true
  });
}
