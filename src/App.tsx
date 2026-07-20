import { addEventListener } from '@react-native-community/netinfo';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { initSentry } from './lib/sentry';
import Sentry from '@sentry/react-native';
import { AppState, AppStateStatus } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import MainNavigation from './MainNavigation';
import { AudioProvider } from './contexts/AudioContext';
import { ApiError } from './lib/errors';
import { store } from './lib/store';
import { registerForPushNotificationsAsync } from './lib/pushClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — subjects/chapters/lessons don't change often
      gcTime: 10 * 60 * 1000,   // keep unused data in cache for 10 min
      retry: (failureCount, error) => {
        if (error instanceof ApiError) return false;
        if (failureCount >= 1) return false;
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
  // Initialize Sentry early in app lifecycle
  initSentry();
  useEffect(() => {
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
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Register push token when app starts (best-effort)
  useEffect(() => {
    void registerForPushNotificationsAsync();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          <AudioProvider>
            <Sentry.ErrorBoundary fallback={<View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Unexpected error occurred</Text></View>}>
              <MainNavigation />
            </Sentry.ErrorBoundary>
          </AudioProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
