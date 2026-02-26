import { RootState } from '@/lib/store';
import { mmkv, storageKeys } from '@/lib/storage/mmkv';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  language?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const loadInitialState = (): AuthState => {
  const accessToken = mmkv.getString(storageKeys.accessToken);
  const user = mmkv.getObject<AuthUser>(storageKeys.authUser);

  if (accessToken && user) {
    return { isLoggedIn: true, user, accessToken, refreshToken: mmkv.getString(storageKeys.refreshToken) ?? null };
  }

  return { isLoggedIn: false, user: null, accessToken: null, refreshToken: null };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken: string }>,
    ) => {
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      mmkv.setString(storageKeys.accessToken, action.payload.accessToken);
      mmkv.setString(storageKeys.refreshToken, action.payload.refreshToken);
      mmkv.setObject(storageKeys.authUser, action.payload.user);
    },
    logout: state => {
      state.isLoggedIn = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      mmkv.delete(storageKeys.accessToken);
      mmkv.delete(storageKeys.refreshToken);
      mmkv.delete(storageKeys.authUser);
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;
export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn;
export const selectAuthUser = (state: RootState) => state.auth.user;

export default authSlice.reducer;
