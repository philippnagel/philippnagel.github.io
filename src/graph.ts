import type { SceneDef } from "./types";

/** Symmetric link adjacency between object ids of one scene. */
export function adjacencyOf(def: SceneDef): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>(
    def.objects.map((o) => [o.id, new Set<string>()]),
  );
  for (const o of def.objects)
    for (const t of o.links) {
      adj.get(o.id)?.add(t);
      adj.get(t)?.add(o.id);
    }
  return adj;
}
