// hooks/use-mounted.ts
import { useSyncExternalStore } from "react";

export function useMounted() {
  return useSyncExternalStore(
    () => () => {}, // subscribe (ไม่ต้องทำอะไร)
    () => true,     // getSnapshot (Client = true)
    () => false     // getServerSnapshot (Server = false)
  );
}