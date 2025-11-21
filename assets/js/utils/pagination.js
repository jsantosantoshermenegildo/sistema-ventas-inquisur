// assets/js/utils/pagination.js — Utilidad de paginación

/**
 * Paginar array de datos
 * @param {Array} items - items a paginar
 * @param {number} page - página (1-indexed)
 * @param {number} pageSize - items por página
 * @returns {Object} { items, currentPage, totalPages, total, hasNextPage, hasPrevPage }
 */
export function paginate(items, page = 1, pageSize = 50) {
  if (!Array.isArray(items)) {items = [];}

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePageSize = Math.max(1, pageSize);
  const safePage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (safePage - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    currentPage: safePage,
    totalPages,
    total,
    pageSize: safePageSize,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, total),
  };
}

/**
 * Crear HTML para controles de paginación
 * @param {Object} pagination - objeto retornado de paginate()
 * @param {string} containerId - ID del elemento para event delegation
 * @returns {string} HTML de controles
 */
export function renderPaginationControls(pagination, containerId = "pagination") {
  const { currentPage, totalPages, total, pageSize, startIndex, endIndex } = pagination;

  if (totalPages <= 1) {return "";} // No mostrar si cabe en 1 página

  const btnPrev = pagination.hasPrevPage
    ? `<button class="pagination-btn px-3 py-1 border rounded" data-page="${currentPage - 1}">← Anterior</button>`
    : `<button class="pagination-btn px-3 py-1 border rounded opacity-50 cursor-not-allowed" disabled>← Anterior</button>`;

  const btnNext = pagination.hasNextPage
    ? `<button class="pagination-btn px-3 py-1 border rounded" data-page="${currentPage + 1}">Siguiente →</button>`
    : `<button class="pagination-btn px-3 py-1 border rounded opacity-50 cursor-not-allowed" disabled>Siguiente →</button>`;

  return `
    <div id="${containerId}" class="flex items-center justify-between mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
      <div class="text-sm text-gray-600 dark:text-gray-300">
        Mostrando <strong>${startIndex}</strong> a <strong>${endIndex}</strong> de <strong>${total}</strong> registros
      </div>
      <div class="flex gap-2">
        ${btnPrev}
        <span class="px-3 py-1 border rounded bg-white dark:bg-gray-800">
          ${currentPage} / ${totalPages}
        </span>
        ${btnNext}
      </div>
    </div>
  `;
}

/**
 * Setup delegador de eventos para botones de paginación
 * @param {Function} onPageChange - callback(newPage)
 * @param {string} containerId - ID del contenedor con botones
 */
export function setupPaginationEvents(onPageChange, containerId = "pagination") {
  const container = document.getElementById(containerId);
  if (!container) {return;}

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("pagination-btn") && !e.target.disabled) {
      const newPage = parseInt(e.target.dataset.page);
      if (!isNaN(newPage)) {
        onPageChange(newPage);
      }
    }
  });
}

/**
 * Crear elemento HTML para controles de página rápida
 * Permite ir a una página específica
 */
export function renderPageJumper(currentPage, totalPages) {
  if (totalPages <= 1) {return "";}

  return `
    <div class="mt-2 flex gap-2 items-center">
      <label for="pageJumper" class="text-sm">Ir a página:</label>
      <input id="pageJumper" type="number" min="1" max="${totalPages}" value="${currentPage}" 
        class="w-16 border rounded px-2 py-1" title="Ingresa número de página">
    </div>
  `;
}

/**
 * Setup para page jumper
 * @param {Function} onJump - callback(page)
 * @param {number} totalPages - total de páginas
 */
export function setupPageJumper(onJump, totalPages) {
  const jumper = document.getElementById("pageJumper");
  if (!jumper) {return;}

  jumper.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const page = Math.max(1, Math.min(parseInt(jumper.value) || 1, totalPages));
      onJump(page);
      jumper.value = page;
    }
  });
}

/**
 * Crear componente completo de paginación
 */
export function renderFullPagination(pagination, onPageChange, containerId = "pagination") {
  const controls = renderPaginationControls(pagination, containerId);
  const jumper = renderPageJumper(pagination.currentPage, pagination.totalPages);

  return `
    ${controls}
    ${jumper}
  `;
}

console.log("✅ Pagination Manager inicializado");
