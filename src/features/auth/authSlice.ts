import { RootState } from '@/lib/store';
import { mmkv, storageKeys } from '@/lib/storage/mmkv';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'teacher';
}

interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
  token: string | null;
}

const loadInitialState = (): AuthState => {
  const token = mmkv.getString(storageKeys.authToken);
  const user = mmkv.getObject<AuthUser>(storageKeys.authUser);

  if (token && user) {
    return { isLoggedIn: true, user, token };
  }

  return { isLoggedIn: false, user: null, token: null };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>,
    ) => {
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      mmkv.setString(storageKeys.authToken, action.payload.token);
      mmkv.setObject(storageKeys.authUser, action.payload.user);
    },
    logout: state => {
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      mmkv.setString(storageKeys.authToken, '');
      mmkv.setString(storageKeys.authUser, '');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;
export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn;
export const selectAuthUser = (state: RootState) => state.auth.user;

export default authSlice.reducer;
