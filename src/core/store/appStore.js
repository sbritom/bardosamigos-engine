import { create } from "zustand";

const useAppStore = create((set) => ({

  sidebar: true,

  loading: false,

  theme: "dark",

  online: true,

  search: "",

  toggleSidebar: () =>
    set((state) => ({
      sidebar: !state.sidebar,
    })),

  setLoading: (loading) =>
    set({
      loading,
    }),

  setTheme: (theme) =>
    set({
      theme,
    }),

  setSearch: (search) =>
    set({
      search,
    }),

}));

export default useAppStore;