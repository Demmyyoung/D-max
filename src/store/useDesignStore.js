import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Debounce utility for auto-sync
const debounce = (fn, ms) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

// Feline pattern presets
export const FELINE_PATTERNS = {
  leopard: {
    id: "pattern-leopard",
    name: "Leopard Print",
    type: "pattern",
    url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=200&h=200&fit=crop",
  },
  tiger: {
    id: "pattern-tiger",
    name: "Tiger Stripes",
    type: "pattern",
    url: "https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=200&h=200&fit=crop",
  },
  cheetah: {
    id: "pattern-cheetah",
    name: "Cheetah Spots",
    type: "pattern",
    url: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=200&h=200&fit=crop",
  },
  jaguar: {
    id: "pattern-jaguar",
    name: "Jaguar Rosettes",
    type: "pattern",
    url: "https://images.unsplash.com/photo-1551972873-b7e8754e8e26?w=200&h=200&fit=crop",
  },
};

export const useDesignStore = create(
  persist(
    immer((set, get) => ({
      // ===== STATE =====
      blocks: [],
      selectedIds: [], // Now an array to support multi-select
      canvasColor: "#ffffff",
      recentColors: ["#000000", "#ffffff", "#6366f1", "#f43f5e", "#10b981"],
      canvasWidth: 400,
      canvasHeight: 500,

      // ===== ACTIONS =====
      addRecentColor: (color) =>
        set((state) => {
          if (!color) return;
          // Remove if already exists to move it to the front
          state.recentColors = state.recentColors.filter((c) => c !== color);
          // Add to the front
          state.recentColors.unshift(color);
          // Keep only top 12
          if (state.recentColors.length > 12) {
            state.recentColors.pop();
          }
        }),

      // Add a new block (pattern, logo, text, image)
      addBlock: (type, url, options = {}) =>
        set((state) => {
          const newBlock = {
            id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            url: url || "",
            x: options.x ?? null,
            y: options.y ?? null,
            width: options.width ?? 100,
            height: options.height ?? 100,
            scale: options.scale ?? 1,
            rotation: options.rotation ?? 0,
            opacity: options.opacity ?? 1,
            // Text-specific
            text: options.text ?? "Untitled Text",
            fontSize: options.fontSize ?? 18,
            fontFamily: options.fontFamily ?? "Inter",
            fill: options.fill ?? "#000000",
            // Metadata
            name: options.name ?? type,
            locked: false,
            visible: true,
            createdAt: Date.now(),
          };
          state.blocks.push(newBlock);
          state.selectedIds = [newBlock.id];
        }),

      // Update block attributes (optimistic - instant UI response)
      updateBlock: (id, newAttrs) =>
        set((state) => {
          const block = state.blocks.find((b) => b.id === id);
          if (block) {
            Object.assign(block, newAttrs);
          }
        }),

      // Delete a block or multiple blocks
      deleteBlock: (ids) =>
        set((state) => {
          const idsToDelete = Array.isArray(ids) ? ids : [ids];
          state.blocks = state.blocks.filter(
            (b) => !idsToDelete.includes(b.id),
          );
          state.selectedIds = state.selectedIds.filter(
            (id) => !idsToDelete.includes(id),
          );
        }),

      // Select a single block (replaces selection)
      selectBlock: (id) => set({ selectedIds: [id] }),

      // Toggle a block in the selection (for Shift-click)
      toggleBlockSelection: (id) =>
        set((state) => {
          if (state.selectedIds.includes(id)) {
            state.selectedIds = state.selectedIds.filter((i) => i !== id);
          } else {
            state.selectedIds.push(id);
          }
        }),

      // Select multiple blocks (for marquee selection)
      selectBlocks: (ids) => set({ selectedIds: ids }),

      // Deselect all
      deselectAll: () => set({ selectedIds: [] }),

      // Set canvas background color
      setCanvasColor: (color) => set({ canvasColor: color }),

      // Clear all blocks
      clearAll: () =>
        set((state) => {
          state.blocks = [];
          state.selectedIds = [];
        }),

      // Duplicate selected block
      duplicateBlock: (id) =>
        set((state) => {
          const block = state.blocks.find((b) => b.id === id);
          if (block) {
            const newBlock = {
              ...JSON.parse(JSON.stringify(block)),
              id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              x: block.x + 20,
              y: block.y + 20,
              createdAt: Date.now(),
            };
            state.blocks.push(newBlock);
            state.selectedIds = [newBlock.id];
          }
        }),

      // Move block in layer order
      moveBlockUp: (id) =>
        set((state) => {
          const index = state.blocks.findIndex((b) => b.id === id);
          if (index < state.blocks.length - 1) {
            [state.blocks[index], state.blocks[index + 1]] = [
              state.blocks[index + 1],
              state.blocks[index],
            ];
          }
        }),

      moveBlockDown: (id) =>
        set((state) => {
          const index = state.blocks.findIndex((b) => b.id === id);
          if (index > 0) {
            [state.blocks[index], state.blocks[index - 1]] = [
              state.blocks[index - 1],
              state.blocks[index],
            ];
          }
        }),

      // Add feline pattern by name
      addFelinePattern: (patternName) => {
        const pattern = FELINE_PATTERNS[patternName.toLowerCase()];
        if (pattern) {
          get().addBlock("pattern", pattern.url, {
            name: pattern.name,
            width: 120,
            height: 120,
          });
        }
      },

      // Get selected block (returns first selected block for backwards compatibility)
      getSelectedBlock: () => {
        const state = get();
        return (
          state.blocks.find((b) => state.selectedIds.includes(b.id)) || null
        );
      },

      // Get all selected blocks
      getSelectedBlocks: () => {
        const state = get();
        return state.blocks.filter((b) => state.selectedIds.includes(b.id));
      },
    })),
    {
      name: "d-max-design-storage",
      version: 1,
      partialize: (state) => ({
        blocks: state.blocks,
        canvasColor: state.canvasColor,
      }),
    },
  ),
);

// Debounced sync function for external persistence (database, etc.)
export const syncDesignToServer = debounce(async (blocks, canvasColor) => {
  // Placeholder for future server sync
  // await fetch('/api/designs/sync', {
  //   method: 'POST',
  //   body: JSON.stringify({ blocks, canvasColor }),
  // });
  console.log(
    "[D-MAX] Design auto-saved to cloud/localStorage:",
    blocks.length,
    "blocks at time:",
    new Date().toLocaleTimeString(),
  );
}, 5000);

// Subscribe to changes for auto-sync
useDesignStore.subscribe((state, prevState) => {
  if (
    state.blocks !== prevState.blocks ||
    state.canvasColor !== prevState.canvasColor
  ) {
    syncDesignToServer(state.blocks, state.canvasColor);
  }
});
