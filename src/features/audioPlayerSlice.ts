import { AudioPlayerState, BACLesson } from '@/lib/models';
import { RootState } from '@/lib/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: AudioPlayerState = {
  currentLesson: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  speed: 1.0,
  isReady: false,
};

const audioPlayerSlice = createSlice({
  name: 'audioPlayer',
  initialState,
  reducers: {
    setCurrentLesson: (state, action: PayloadAction<BACLesson>) => {
      state.currentLesson = action.payload;
      state.position = 0;
      state.isReady = false;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setPosition: (state, action: PayloadAction<number>) => {
      state.position = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setSpeed: (state, action: PayloadAction<number>) => {
      state.speed = action.payload;
    },
    setIsReady: (state, action: PayloadAction<boolean>) => {
      state.isReady = action.payload;
    },
    clearPlayer: () => initialState,
  },
  extraReducers: builder => {
    // Reset the player on logout so one user's "now playing" lesson never bleeds
    // into the next user's session. (auth/logout is dispatched by authSlice.)
    builder.addMatcher(
      (action): action is { type: string } => action.type === 'auth/logout',
      () => initialState,
    );
  },
});

export const {
  setCurrentLesson,
  setIsPlaying,
  setPosition,
  setDuration,
  setSpeed,
  setIsReady,
  clearPlayer,
} = audioPlayerSlice.actions;

export const selectAudioPlayer = (state: RootState) => state.audioPlayer;
export const selectCurrentLesson = (state: RootState) =>
  state.audioPlayer.currentLesson;
export const selectIsPlaying = (state: RootState) => state.audioPlayer.isPlaying;
export const selectSpeed = (state: RootState) => state.audioPlayer.speed;

export default audioPlayerSlice.reducer;