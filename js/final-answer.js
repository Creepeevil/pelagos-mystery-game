export const FINAL_ANSWER_KEY = "pelagos-final-answer-v1";

export function initFinalAnswer(container, gameData) {
  const fields = { suspect: gameData.suspects, weapon: gameData.weapons, location: gameData.locations };
  const empty = () => ({ suspect: "", weapon: "", location: "", locked: false });
  let state = empty();
  const controls = container.querySelector(".final-controls");
  const result = container.querySelector(".final-result");
  const submit = container.querySelector("#final-submit");
  const status = container.querySelector(".final-storage-status");
  const dialog = document.querySelector("#final-dialog");
  const selects = {};
  const complete = () => Object.entries(fields).every(([key, items]) => items.some(item => item.id === state[key]));

  try {
    const saved = JSON.parse(localStorage.getItem(FINAL_ANSWER_KEY));
    for (const [key, items] of Object.entries(fields)) {
      if (items.some(item => item.id === saved?.[key])) state[key] = saved[key];
    }
    state.locked = saved?.locked === true && complete();
  } catch { /* Missing or invalid storage starts an empty draft. */ }

  function persist() {
    try {
      localStorage.setItem(FINAL_ANSWER_KEY, JSON.stringify(state));
      status.textContent = "";
    } catch {
      status.textContent = "Không thể lưu trên thiết bị. Lựa chọn chỉ được giữ trong phiên này; tải lại trang có thể làm mất đáp án.";
    }
  }

  function render() {
    controls.hidden = state.locked;
    result.hidden = !state.locked;
    submit.disabled = state.locked || !complete();
    for (const [key, items] of Object.entries(fields)) {
      selects[key].value = state[key];
      selects[key].disabled = state.locked;
      container.querySelector(`[data-answer="${key}"]`).textContent =
        items.find(item => item.id === state[key])?.name ?? "";
    }
  }

  for (const [key, items] of Object.entries(fields)) {
    const select = container.querySelector(`#final-${key}`);
    selects[key] = select;
    for (const item of items) {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      select.append(option);
    }
    select.addEventListener("change", () => {
      if (state.locked) { render(); return; }
      state[key] = items.some(item => item.id === select.value) ? select.value : "";
      persist();
      render();
    });
  }
  submit.addEventListener("click", () => {
    if (!state.locked && complete() && !dialog.open) dialog.showModal();
  });
  document.querySelector("#final-cancel").addEventListener("click", () => dialog.close());
  document.querySelector("#final-confirm").addEventListener("click", () => {
    if (!dialog.open || state.locked || !complete()) return;
    state.locked = true;
    persist();
    dialog.close();
    render();
    result.focus();
  });
  render();
  return {
    reset() {
      if (dialog.open) dialog.close();
      state = empty();
      try {
        localStorage.removeItem(FINAL_ANSWER_KEY);
        status.textContent = "";
      } catch {
        status.textContent = "Đã reset trong phiên này nhưng không thể xóa đáp án khỏi bộ nhớ thiết bị.";
      }
      render();
    },
  };
}
