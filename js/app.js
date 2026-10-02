import { gameData } from "./data.js";
import { renderCards } from "./cards.js";
import { initNotebook } from "./notebook.js";

const notebook = initNotebook(
  document.querySelector("#logic-notebook"),
  document.querySelector("#save-status"),
);
for (const button of document.querySelectorAll("[data-category]")) {
  button.addEventListener("click", () => {
    for (const tab of document.querySelectorAll("[data-category]"))
      tab.setAttribute("aria-pressed", String(tab === button));
    document.querySelector("#card-empty").hidden = true;
    document.querySelector("#card-area").hidden = false;
    renderCards(
      gameData[button.dataset.category],
      document.querySelector("#cards"),
    );
  });
}
const dialog = document.querySelector("#reset-dialog");
document.querySelector("#card-size").addEventListener("click", (event) => {
  const expanded = document
    .querySelector("#cards")
    .classList.toggle("large-cards");
  event.currentTarget.setAttribute("aria-pressed", String(expanded));
});
document.querySelector("#reset").addEventListener("click", () => {
  dialog.returnValue = "";
  dialog.showModal();
});
dialog.addEventListener("close", () => {
  if (dialog.returnValue === "confirm") notebook.reset();
});
