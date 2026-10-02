import test from "node:test";
import assert from "node:assert/strict";
import { gameData } from "../js/data.js";
import { matrices, cellKey, createState, cycleCell } from "../js/notebook.js";
import {
  STORAGE_KEY,
  loadNotebook,
  saveNotebook,
  clearNotebook,
} from "../js/storage.js";
import { access } from "node:fs/promises";

test("48 generated cells and complete four-state cycle", () => {
  const state = createState();
  assert.equal(Object.keys(state).length, 48);
  const key = "weapons-suspects:moon-key:bernica";
  for (const expected of [1, 2, 3, 0]) {
    cycleCell(state, "weapons-suspects", "moon-key", "bernica");
    assert.equal(state[key], expected);
  }
});
test("multiple possible marks do not change other cells", () => {
  const state = createState();
  for (const col of ["bernica", "alyssa"])
    for (let i = 0; i < 2; i++)
      cycleCell(state, "weapons-suspects", "moon-key", col);
  assert.equal(Object.values(state).filter((value) => value === 2).length, 2);
  assert.equal(Object.values(state).filter((value) => value !== 0).length, 2);
});
test("confirmation excludes exactly six neighbors in each matrix, without crossing matrices", () => {
  for (const matrix of matrices) {
    const state = createState();
    const row = matrix.rows[0];
    const col = matrix.cols[0];
    for (let i = 0; i < 3; i++) cycleCell(state, matrix.id, row.id, col.id);
    for (const r of matrix.rows)
      for (const c of matrix.cols) {
        assert.equal(
          state[cellKey(matrix.id, r.id, c.id)],
          r === row && c === col ? 3 : r === row || c === col ? 1 : 0,
        );
      }
    assert.equal(Object.values(state).filter((value) => value === 1).length, 6);
  }
});
test("new confirmation overrides an existing confirmation and possible marks", () => {
  const state = createState();
  for (let i = 0; i < 3; i++)
    cycleCell(state, "weapons-suspects", "moon-key", "bernica");
  for (let i = 0; i < 2; i++)
    cycleCell(state, "weapons-suspects", "moon-key", "alyssa");
  assert.equal(state["weapons-suspects:moon-key:alyssa"], 3);
  assert.equal(state["weapons-suspects:moon-key:bernica"], 1);
});
test("removing a confirmation clears its automatic row and column marks in all matrices", () => {
  for (const matrix of matrices) {
    const state = createState();
    const row = matrix.rows[0].id;
    const col = matrix.cols[0].id;
    for (let i = 0; i < 3; i++) cycleCell(state, matrix.id, row, col);
    assert.equal(Object.values(state).filter(value => value === 1).length, 6);
    cycleCell(state, matrix.id, row, col);
    assert.ok(Object.values(state).every(value => value === 0));
  }
});
test("removing one tick preserves crosses required by another tick", () => {
  const state = createState();
  for (const [row, col] of [["moon-key", "bernica"], ["metal-clamp", "alyssa"]])
    for (let i = 0; i < 3; i++)
      cycleCell(state, "weapons-suspects", row, col);
  cycleCell(state, "weapons-suspects", "moon-key", "bernica");
  assert.equal(state["weapons-suspects:moon-key:bernica"], 0);
  assert.equal(state["weapons-suspects:metal-clamp:alyssa"], 3);
  assert.equal(state["weapons-suspects:moon-key:alyssa"], 1);
  assert.equal(state["weapons-suspects:metal-clamp:bernica"], 1);
  assert.equal(Object.values(state).filter(value => value === 1).length, 6);
  cycleCell(state, "weapons-suspects", "metal-clamp", "alyssa");
  assert.ok(Object.values(state).every(value => value === 0));
});
test("removing a tick does not clear exclusions in another matrix", () => {
  const state = createState();
  for (let i = 0; i < 3; i++) {
    cycleCell(state, "weapons-suspects", "moon-key", "bernica");
    cycleCell(state, "weapons-locations", "moon-key", "control-room");
  }
  const unchanged = Object.fromEntries(
    Object.entries(state).filter(([key]) => key.startsWith("weapons-locations:")),
  );
  cycleCell(state, "weapons-suspects", "moon-key", "bernica");
  for (const [key, value] of Object.entries(unchanged))
    assert.equal(state[key], value);
  assert.equal(Object.values(state).filter(value => value === 1).length, 6);
});
test("manual crosses and later annotations survive removing a tick", () => {
  const state = createState();
  cycleCell(state, "weapons-suspects", "moon-key", "alyssa");
  for (let i = 0; i < 3; i++)
    cycleCell(state, "weapons-suspects", "moon-key", "bernica");
  cycleCell(state, "weapons-suspects", "moon-key", "glaucous");
  assert.equal(state["weapons-suspects:moon-key:glaucous"], 2);
  cycleCell(state, "weapons-suspects", "moon-key", "bernica");
  assert.equal(state["weapons-suspects:moon-key:alyssa"], 1);
  assert.equal(state["weapons-suspects:moon-key:glaucous"], 2);
  assert.equal(Object.values(state).filter(value => value !== 0).length, 2);
});
test("replacing a tick clears exclusions from its former column", () => {
  const state = createState();
  for (let i = 0; i < 3; i++)
    cycleCell(state, "weapons-suspects", "moon-key", "bernica");
  for (let i = 0; i < 2; i++)
    cycleCell(state, "weapons-suspects", "moon-key", "alyssa");
  for (const row of ["metal-clamp", "power-drill", "repair-drone"])
    assert.equal(state[cellKey("weapons-suspects", row, "bernica")], 0);
  assert.equal(Object.values(state).filter(value => value === 1).length, 6);
  cycleCell(state, "weapons-suspects", "moon-key", "alyssa");
  assert.ok(Object.values(state).every(value => value === 0));
});
test("old saved confirmations can have their exclusions cleared", () => {
  const state = createState();
  for (let i = 0; i < 3; i++)
    cycleCell(state, "weapons-suspects", "moon-key", "bernica");
  const loaded = createState({ ...state });
  cycleCell(loaded, "weapons-suspects", "moon-key", "bernica");
  assert.ok(Object.values(loaded).every(value => value === 0));
});
test("persistence, reset, invalid JSON and unavailable storage", () => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
  const state = createState();
  for (let i = 0; i < 3; i++)
    cycleCell(state, "weapons-suspects", "moon-key", "bernica");
  assert.equal(saveNotebook(state), true);
  assert.deepEqual(createState(loadNotebook()), state);
  const restored = createState(loadNotebook());
  cycleCell(restored, "weapons-suspects", "moon-key", "bernica");
  assert.ok(Object.values(restored).every(value => value === 0));
  const manual = createState();
  cycleCell(manual, "weapons-suspects", "moon-key", "alyssa");
  for (let i = 0; i < 3; i++)
    cycleCell(manual, "weapons-suspects", "moon-key", "bernica");
  saveNotebook(manual);
  const restoredManual = createState(loadNotebook());
  cycleCell(restoredManual, "weapons-suspects", "moon-key", "bernica");
  assert.equal(restoredManual["weapons-suspects:moon-key:alyssa"], 1);
  assert.equal(Object.values(restoredManual).filter(value => value !== 0).length, 1);
  clearNotebook();
  assert.equal(entries.has(STORAGE_KEY), false);
  entries.set(STORAGE_KEY, "{bad");
  assert.deepEqual(loadNotebook(), {});
  assert.deepEqual(
    createState({ "weapons-suspects:moon-key:bernica": 99 }),
    createState(),
  );
  globalThis.localStorage = {
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
    removeItem() {
      throw new Error();
    },
  };
  assert.deepEqual(loadNotebook(), {});
  assert.equal(saveNotebook(state), false);
  assert.equal(clearNotebook(), false);
});
test("all 36 declared assets exist", async () => {
  for (const cards of Object.values(gameData))
    for (const card of cards) {
      for (const field of ["front", "back", "icon"])
        await access(new URL(`../${card[field]}`, import.meta.url));
    }
});
