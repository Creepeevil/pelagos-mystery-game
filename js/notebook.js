import { gameData } from "./data.js";
import { loadNotebook, saveNotebook, clearNotebook } from "./storage.js";

export const CellState = Object.freeze({
  EMPTY: 0,
  EXCLUDED: 1,
  POSSIBLE: 2,
  CONFIRMED: 3,
});
export const matrices = [
  { id: "weapons-suspects", rows: gameData.weapons, cols: gameData.suspects },
  { id: "weapons-locations", rows: gameData.weapons, cols: gameData.locations },
  {
    id: "locations-suspects",
    rows: gameData.locations,
    cols: gameData.suspects,
  },
];
export const cellKey = (matrix, row, col) => `${matrix}:${row}:${col}`;

function isExcludedByConfirmation(state, matrix, rowId, colId) {
  return (
    matrix.cols.some(
      (col) =>
        col.id !== colId &&
        state[cellKey(matrix.id, rowId, col.id)] === CellState.CONFIRMED,
    ) ||
    matrix.rows.some(
      (row) =>
        row.id !== rowId &&
        state[cellKey(matrix.id, row.id, colId)] === CellState.CONFIRMED,
    )
  );
}

function clearUnusedExclusions(state, matrix) {
  for (const row of matrix.rows)
    for (const col of matrix.cols) {
      const key = cellKey(matrix.id, row.id, col.id);
      if (
        state.automaticExclusions.has(key) &&
        !isExcludedByConfirmation(state, matrix, row.id, col.id)
      ) {
        if (state[key] === CellState.EXCLUDED) state[key] = CellState.EMPTY;
        state.automaticExclusions.delete(key);
      }
    }
}

export function createState(saved = {}) {
  const state = {};
  for (const matrix of matrices)
    for (const row of matrix.rows)
      for (const col of matrix.cols) {
        const key = cellKey(matrix.id, row.id, col.id);
        state[key] =
          Number.isInteger(saved[key]) && saved[key] >= 0 && saved[key] <= 3
            ? saved[key]
            : 0;
      }
  // Keep bookkeeping separate from the 48 cell values. Storage persists it so
  // automatic exclusions remain reversible after a refresh.
  const automaticExclusions = new Set();
  Object.defineProperty(state, "automaticExclusions", {
    value: automaticExclusions,
  });
  if (Array.isArray(saved._automaticExclusions)) {
    for (const key of saved._automaticExclusions)
      if (state[key] === CellState.EXCLUDED) automaticExclusions.add(key);
  } else {
    // Older saves did not record the origin of crosses. Treat exclusions beside
    // an existing confirmation as automatic so removing that tick still works.
    for (const matrix of matrices)
      for (const row of matrix.rows)
        for (const col of matrix.cols) {
          const key = cellKey(matrix.id, row.id, col.id);
          if (
            state[key] === CellState.EXCLUDED &&
            isExcludedByConfirmation(state, matrix, row.id, col.id)
          )
            automaticExclusions.add(key);
        }
  }
  return state;
}
export function cycleCell(state, matrixId, rowId, colId) {
  const matrix = matrices.find((item) => item.id === matrixId);
  if (
    !matrix ||
    !matrix.rows.some((row) => row.id === rowId) ||
    !matrix.cols.some((col) => col.id === colId)
  )
    return state;
  const key = cellKey(matrixId, rowId, colId);
  const previous = state[key];
  state[key] = (state[key] + 1) % 4;
  // Clicking an automatically marked cell makes it a player's own annotation.
  state.automaticExclusions.delete(key);
  // Only a newly confirmed pairing overrides its row and column, in this matrix.
  if (state[key] === CellState.CONFIRMED) {
    for (const row of matrix.rows)
      for (const col of matrix.cols) {
        if (
          (row.id === rowId || col.id === colId) &&
          !(row.id === rowId && col.id === colId)
        ) {
          const neighbor = cellKey(matrixId, row.id, col.id);
          // Existing manual crosses stay manual; other overwritten marks are
          // automatic and will clear when their last confirmation is removed.
          if (state[neighbor] !== CellState.EXCLUDED)
            state.automaticExclusions.add(neighbor);
          state[neighbor] = CellState.EXCLUDED;
        }
      }
  }
  if (previous === CellState.CONFIRMED || state[key] === CellState.CONFIRMED)
    clearUnusedExclusions(state, matrix);
  return state;
}

const symbols = ["", "✕", "?", "✓"];
const names = ["Trống", "Loại trừ", "Phân vân", "Xác nhận"];
function header(item, className) {
  const node = document.createElement("div");
  node.className = `entity-label ${className}`;
  node.title = item.name;
  const img = document.createElement("img");
  img.src = item.icon;
  img.alt = item.name;
  img.width = 40;
  img.height = 40;
  const label = document.createElement("span");
  label.textContent = item.name;
  node.append(img, label);
  return node;
}
export function initNotebook(container, status) {
  let state = createState(loadNotebook());
  const buttons = new Map();
  const group = (text, className) => {
    const node = document.createElement("div");
    node.className = className;
    node.textContent = text;
    container.append(node);
  };
  group("SUSPECTS", "axis-title suspects-title");
  group("LOCATIONS", "axis-title locations-title");
  for (const [offset, items] of [
    [0, gameData.suspects],
    [4, gameData.locations],
  ]) {
    items.forEach((item, i) => {
      const node = header(item, "column-label");
      node.style.gridColumn = String(i + offset + 3);
      node.style.gridRow = "2";
      container.append(node);
    });
  }
  group("WEAPONS", "axis-title weapons-title");
  group("LOCATIONS", "axis-title row-locations-title");
  for (const [offset, items] of [
    [0, gameData.weapons],
    [4, gameData.locations],
  ]) {
    items.forEach((item, i) => {
      const node = header(item, "row-label");
      node.style.gridColumn = "2";
      node.style.gridRow = String(i + offset + 3);
      container.append(node);
    });
  }
  function paint() {
    for (const [key, button] of buttons) {
      const value = state[key];
      button.textContent = symbols[value];
      button.dataset.state = String(value);
      button.setAttribute(
        "aria-label",
        `${button.dataset.pair}: ${names[value]}. Chạm để đổi dấu.`,
      );
    }
  }
  for (const [index, matrix] of matrices.entries()) {
    const grid = document.createElement("div");
    grid.className = `matrix matrix-${index}`;
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", matrix.id.replaceAll("-", " × "));
    for (const row of matrix.rows)
      for (const col of matrix.cols) {
        const key = cellKey(matrix.id, row.id, col.id);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cell";
        button.dataset.key = key;
        button.dataset.pair = `${row.name} × ${col.name}`;
        button.addEventListener("click", () => {
          const previous = state[key];
          cycleCell(state, matrix.id, row.id, col.id);
          paint();
          const saved = saveNotebook(state);
          if (status)
            status.textContent = saved
              ? "Đã lưu trên thiết bị"
              : "Không thể lưu · ghi chú chỉ giữ trong phiên này";
          document.querySelector("#grid-status").textContent =
            `${button.dataset.pair}: ${names[state[key]]}${state[key] === 3 ? ". Đã loại trừ các ô khác cùng hàng và cột." : previous === 3 ? ". Đã xóa các dấu loại trừ tự động không còn cần thiết." : "."}`;
        });
        buttons.set(key, button);
        grid.append(button);
      }
    container.append(grid);
  }
  paint();
  return {
    reset() {
      state = createState();
      paint();
      const cleared = clearNotebook();
      if (status)
        status.textContent = cleared
          ? "Đã xóa ghi chú"
          : "Đã xóa trong phiên này · không thể truy cập bộ nhớ";
    },
  };
}
