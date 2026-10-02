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
  state[key] = (state[key] + 1) % 4;
  // Only a newly confirmed pairing overrides its row and column, in this matrix.
  // Clearing a confirmation leaves prior exclusions for the player to revise.
  if (state[key] === CellState.CONFIRMED) {
    for (const row of matrix.rows)
      for (const col of matrix.cols) {
        if (
          (row.id === rowId || col.id === colId) &&
          !(row.id === rowId && col.id === colId)
        ) {
          state[cellKey(matrixId, row.id, col.id)] = CellState.EXCLUDED;
        }
      }
  }
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
          cycleCell(state, matrix.id, row.id, col.id);
          paint();
          status.textContent = saveNotebook(state)
            ? "Đã lưu trên thiết bị"
            : "Không thể lưu · ghi chú chỉ giữ trong phiên này";
          document.querySelector("#grid-status").textContent =
            `${button.dataset.pair}: ${names[state[key]]}${state[key] === 3 ? ". Đã loại trừ các ô khác cùng hàng và cột." : "."}`;
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
      status.textContent = clearNotebook()
        ? "Đã xóa ghi chú"
        : "Đã xóa trong phiên này · không thể truy cập bộ nhớ";
    },
  };
}
