import { Store } from "tinybase";
import { TableSchema } from "../types";

export const categoriesSchema: TableSchema = {
  name: { type: "string" },
  emoji: { type: "string", default: "💵" }, // "_string" or "emoji"
  color: { type: "string", default: "#149c38" },
};

export const cmd_addCategory = (
  store: Store,
  name: string,
  emoji?: string,
  color?: string
) => {
  store.transaction(() => {
    store.setRow("categories", name, {
      name: name,
      emoji: emoji || "💵",
      color: color || "#149c38",
    });
  });
};

export const cmd_removeCategory = (store: Store, category: string) => {
  store.transaction(() => {
    store.delRow("categories", category);
  });
};