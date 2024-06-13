import { Space } from "../../../type";
import { Count } from "./count";
import { Heart } from "./heart";

export const Like = (space: Space) => {
  const box = document.createElement("a");

  box.setAttribute("href", `https://huggingface.co/spaces/${space.id}`);
  box.setAttribute("rel", "noopener noreferrer");
  box.setAttribute("target", "_blank");

  box.style.border = "1px solid #e5e7eb";
  box.style.borderRadius = "6px";
  box.style.display = "flex";
  box.style.flexDirection = "row";
  box.style.alignItems = "center";
  box.style.margin = "0 12px"
  box.style.fontSize = "14px";
  box.style.paddingLeft = "4px";

  box.appendChild(Heart());
  box.appendChild(Count(space.likes));

  return box;
}