// assets/js/rules/roles.js
export const PERMISOS = {
  admin:  ["dashboard","productos","clientes","proformas","ventas","reportes","auditoria","cuenta"],
  seller: ["ventas","clientes","cuenta"],
  viewer: ["reportes","cuenta"],
};

export const HOME_BY_ROLE = {
  admin: "dashboard",
  seller: "ventas",
  viewer: "reportes",
};
