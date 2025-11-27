import { OTP_TYPES } from "@/constants/auth-constants";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: {
    id: number | null;
    name: string | null;
    email: string | null;
  } | null;
  otpType: (typeof OTP_TYPES)[number] | null;
}

const initialState: AuthState = {
  user: null,
  otpType: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        email?: string | null;
        name?: string | null;
        id?: number | null;
      }>
    ) => {
      state.user = {
        email: action.payload?.email || null,
        name: action.payload?.name || null,
        id: action.payload?.id || null,
      };
    },
    logoutUser: (state) => {
      state.user = null;
    },
    setOtpType: (
      state,
      action: PayloadAction<{ otpType: (typeof OTP_TYPES)[number] | null }>
    ) => {
      state.otpType = action.payload.otpType;
    },
  },
});

export const { setCredentials, logoutUser, setOtpType } = authSlice.actions;
export default authSlice.reducer;
