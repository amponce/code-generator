import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultVectorStore } from "../../config/constants";

const useToolsStore = create(
  persist(
    (set) => ({
      vectorStore: defaultVectorStore.id !== "" ? defaultVectorStore : null,
      webSearchConfig: {
        user_location: {
          type: "approximate",
          country: "",
          city: "",
          region: "",
        },
      },
      fileSearchEnabled: false,
      setFileSearchEnabled: (enabled) => {
        set({ fileSearchEnabled: enabled });
      },
      webSearchEnabled: false,
      setWebSearchEnabled: (enabled) => {
        set({ webSearchEnabled: enabled });
      },
      functionsEnabled: true,
      setFunctionsEnabled: (enabled) => {
        set({ functionsEnabled: enabled });
      },
      setVectorStore: (store) => set({ vectorStore: store }),
      setWebSearchConfig: (config) => set({ webSearchConfig: config }),
    }),
    {
      name: "tools-store",
    }
  )
);

export default useToolsStore; 