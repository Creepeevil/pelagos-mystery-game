export function renderCards(items, container) {
  container.replaceChildren();
  for (const item of items) {
    const wrapper = document.createElement("article");
    wrapper.className = "card";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card-flip";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute(
      "aria-label",
      `${item.name}: mặt trước, chạm để xem mặt sau`,
    );
    const inner = document.createElement("span");
    inner.className = "card-inner";
    for (const side of ["front", "back"]) {
      const face = document.createElement("span");
      face.className = `card-face card-${side}`;
      face.setAttribute("aria-hidden", side === "back" ? "true" : "false");
      const img = document.createElement("img");
      img.src = item[side];
      img.alt = `${item.name} — ${side === "front" ? "mặt trước" : "mặt sau"}`;
      img.width = 1200;
      img.height = 1698;
      img.loading = "lazy";
      img.addEventListener(
        "error",
        () => {
          img.hidden = true;
          const message = document.createElement("span");
          message.className = "asset-error";
          message.textContent = `Không tải được ảnh ${item.name}. Vui lòng thử tải lại trang.`;
          face.append(message);
        },
        { once: true },
      );
      face.append(img);
      inner.append(face);
    }
    button.append(inner);
    button.addEventListener("click", () => {
      const flipped = button.classList.toggle("is-flipped");
      button.setAttribute("aria-pressed", String(flipped));
      button.setAttribute(
        "aria-label",
        `${item.name}: ${flipped ? "mặt sau, chạm để xem mặt trước" : "mặt trước, chạm để xem mặt sau"}`,
      );
      inner.children[0].setAttribute("aria-hidden", String(flipped));
      inner.children[1].setAttribute("aria-hidden", String(!flipped));
    });
    const caption = document.createElement("p");
    caption.className = "card-caption";
    caption.textContent = item.name;
    wrapper.append(button, caption);
    container.append(wrapper);
  }
}
