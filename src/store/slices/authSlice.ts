import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '../../types/auth.types';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  franchiseName: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  franchiseName: null,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    loginSuccess: (state, action: PayloadAction<{ user: UserProfile }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      state.isLoading = false;
    },
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
    },
    setFranchiseName: (state, action: PayloadAction<string>) => {
      state.franchiseName = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.franchiseName = null;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const { setLoading, loginSuccess, setUser, setFranchiseName, setError, logout } = authSlice.actions;
export default authSlice.reducer;
