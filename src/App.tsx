import { addEventListener } from '@react-native-community/netinfo';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import MainNavigation from './MainNavigation';
import { ApiError } from './lib/errors';
import { store } from './lib/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          return false;
        }

        if (failureCount >= 1) {
          return false;
        }

        return true;
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      Toast.show({
        type: 'error',
        text1: error.message,
      });
    },
  }),
});

const App = () => {
  useEffect(() => {
    const setupAppServices = async () => {
      let isExpoGo = false;

      try {
        const constantsModule = require('expo-constants') as {
          default?: { appOwnership?: string };
          appOwnership?: string;
        };
        const constants = constantsModule.default ?? constantsModule;
        isExpoGo = constants.appOwnership === 'expo';
      } catch {
        isExpoGo = false;
      }

      if (isExpoGo) {
        return;
      }

      const { setupTrackPlayer } = await import('./lib/audio/setupTrackPlayer');
      await setupTrackPlayer();
    };

    void setupAppServices();

    let appState = AppState.currentState;

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          focusManager.setFocused(true);
        } else {
          focusManager.setFocused(false);
        }
        appState = nextAppState;

        // console.log(appState);
      },
    );

    onlineManager.setEventListener(setOnline => {
      return addEventListener(nextState => {
        const isOnline =
          nextState.isConnected === true &&
          nextState.isInternetReachable !== false;

        setOnline(isOnline);
        console.log(isOnline ? 'connected' : 'disconnected');
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          <MainNavigation />
        </QueryClientProvider>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
