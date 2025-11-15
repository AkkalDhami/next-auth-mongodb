import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: {
    id: number | null;
    name: string | null;
    email: string | null;
    role: string;
  } | null;
}

const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken?: string | null;
        email?: string | null;
        name?: string | null;
        id?: number | null;
        role?: string | null;
      }>
    ) => {
      console.log(action.payload);
      state.user = {
        email: action.payload?.email || null,
        name: action.payload?.name || null,
        id: action.payload?.id || null,
        role: action.payload?.role || "",
      };
    },
    logoutUser: (state) => {
      state.user = null;
    },
  },
});

export const { setCredentials, logoutUser } = authSlice.actions;
export default authSlice.reducer;
