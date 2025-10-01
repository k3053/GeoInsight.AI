import { configureStore, createSlice } from "@reduxjs/toolkit";

// Redux slice
const dashboardSlice = createSlice({
    name: "dashboard",
    initialState: {
    filters: ["Air Quality Index", "Elevation", "% of GreenCover"],
        selectedFilter: null,
        searchQuery: "",
    },
    reducers: {
        setFilter: (state, action) => {
            state.selectedFilter = action.payload;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
    },
});

export const { setFilter, setSearchQuery } = dashboardSlice.actions;
const store = configureStore({ reducer: { dashboard: dashboardSlice.reducer } });
export default store;