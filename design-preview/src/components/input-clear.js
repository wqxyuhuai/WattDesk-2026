// Shared clear affordance for text inputs. Pages own the slot; this component
// owns the appearance, pointer behaviour and toggle contract.
import {iconAsset} from "./icons.js";

export function createInputClear({label = "Clear search", onClear} = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "wd-input-clear wd-glass--no-scale";
  button.setAttribute("aria-label", label);
  button.hidden = true;
  button.tabIndex = -1;
  const glyph = iconAsset("tab-close.svg", "mono");
  glyph.classList.add("wd-input-clear-glyph");
  button.append(glyph);
  // Keep focus in the input while clicking, so the result surface does not
  // close and reopen mid-interaction.
  button.addEventListener("pointerdown", (event) => event.preventDefault());
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClear?.(event);
  });
  return button;
}

export function syncInputClear(button, value) {
  if (!button) return false;
  const visible = String(value ?? "").trim().length > 0;
  button.hidden = !visible;
  button.tabIndex = visible ? 0 : -1;
  return visible;
}
