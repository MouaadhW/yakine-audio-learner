import TrackPlayer, { Event } from 'react-native-track-player';

const playbackService = async () => {
  // Basic controls
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    void TrackPlayer.stop();
  });

  // Seek & skip
  TrackPlayer.addEventListener(Event.RemoteSeek, event => {
    void TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async event => {
    const position = await TrackPlayer.getPosition();
    void TrackPlayer.seekTo(position + event.interval);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async event => {
    const position = await TrackPlayer.getPosition();
    void TrackPlayer.seekTo(Math.max(0, position - event.interval));
  });

  // Track completion
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, event => {
    // Can dispatch progress save here
  });
};

export default playbackService;
