import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { useState } from 'react';
import { Linking, ScrollView, Text } from 'react-native';

// Lazy-load react-native-webview to avoid crash in Expo Go
let WebViewComponent: typeof import('react-native-webview').default | null = null;
try {
  const isExpoGo = (() => {
    try {
      const c = require('expo-constants') as { default?: { appOwnership?: string }; appOwnership?: string };
      return (c.default ?? c).appOwnership === 'expo';
    } catch { return false; }
  })();
  if (!isExpoGo) {
    WebViewComponent = require('react-native-webview').default;
  }
} catch {
  WebViewComponent = null;
}

interface CustomWebViewProps {
  html?: string;
  basic?: boolean;
}

export const CustomWebView = ({ html, basic }: CustomWebViewProps) => {
  const { colors, dark } = useAppSelector(selectTheme);

  const [webViewHeight, setWebViewHeight] = useState<number>();

  // Fallback for Expo Go: render raw text stripped of HTML tags
  if (!WebViewComponent) {
    const plainText = (html ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    return (
      <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled>
        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
          {plainText || '(No content)'}
        </Text>
      </ScrollView>
    );
  }

  const extraLib = `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.10.0/build/styles/atom-one-dark.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
      
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" integrity="sha384-43gviWU0YVjaDtb/GhzOouOXtZMP/7XUzwPTstBeZFe/+rCMvRwr4yROQP43s0Xk" crossorigin="anonymous"
        onload="renderMathInElement(document.body);"></script>
  `;

  const htmlWrapper = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, user-scalable=no">
        ${!basic && html ? extraLib : ''}
        <style type="text/css">
          @font-face {
            font-family: "Roboto";
            font-weight: 400;
            src: url('Roboto-Regular.ttf') format('truetype');
          }
          @font-face {
            font-family: "Roboto";
            font-weight: 500;
            src: url('Roboto-Medium.ttf') format('truetype');
          }
          @font-face {
            font-family: "Roboto";
            font-weight: 600;
            src: url('Roboto-Bold.ttf') format('truetype');
          }
          @font-face {
            font-family: "Roboto";
            font-weight: 700;
            src: url('Roboto-Black.ttf') format('truetype');
          }
          body {
            font-family: Roboto;
            margin: 0;
            padding: 0;
            color: ${colors.text};
          }
          p, li {
            font-size: 14px;
            color: ${colors.muted};
          }
          img {
            width: 100%;
            height: auto;
          }
          .table-wrapper {
            overflow-x: auto;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          table p {
            margin: 0;
          }
          th {
            background-color: ${colors.default};
            text-align: left;
          }
          td, th {
            border: 1px solid ${colors.border};
            padding: 12px;
          }
          pre {
            text-wrap: nowrap !important;
          }
          pre code {
            color: inherit;
            border-radius: 3px;
            background-color: ${dark ? '#111827' : '#1f2937'} !important;
          }
          a {
            color: inherit;
            font-weight: 500;
          }
          hr {
            border: 0.7px solid ${colors.border};
          }
        </style>
      </head>
      <body>
        ${html ?? '<p></p>'}
        ${!basic && html ? '<script>hljs.highlightAll();</script>' : ''}
        <script>
          window.addEventListener('load', function() {
            window.ReactNativeWebView.postMessage(
              document.documentElement.scrollHeight
            );
          });
        </script>
      </body>
    </html>
  `;

  return (
    <WebViewComponent
      originWhitelist={['*']}
      source={{ html: htmlWrapper, baseUrl: '' }}
      scrollEnabled={false}
      useWebView2
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      style={{
        height: webViewHeight ?? 0,
        backgroundColor: 'transparent',
      }}
      onMessage={evt => {
        setWebViewHeight(Number(evt.nativeEvent.data));
      }}
      // injectedJavaScript={injectedJavaScript}
      onError={evt => {
        console.log(evt);
      }}
      onShouldStartLoadWithRequest={event => {
        if (event.url.startsWith('http')) {
          Linking.openURL(event.url);
          return false;
        }
        return true;
      }}
    />
  );
};
