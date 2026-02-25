import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from 'react-native-track-player';

let isTrackPlayerSetup = false;

export const setupTrackPlayer = async () => {
  if (isTrackPlayerSetup) {
    return;
  }

  await TrackPlayer.setupPlayer({
    maxCacheSize: 1024 * 5,
  });

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior:
        AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.Stop,
      Capability.SeekTo,
      Capability.JumpForward,
      Capability.JumpBackward,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.JumpBackward,
      Capability.JumpForward,
    ],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.Stop,
      Capability.SeekTo,
      Capability.JumpForward,
      Capability.JumpBackward,
    ],
    progressUpdateEventInterval: 1,
    forwardJumpInterval: 10,
    backwardJumpInterval: 10,
  });

  isTrackPlayerSetup = true;
};
