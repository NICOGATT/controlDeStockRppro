import type * as React from "react";

declare global {
  namespace JSX {
    // When TS is configured with `jsx: "react-native"`, the global JSX namespace
    // comes from React Native typings, which don't include React's special `key`
    // attribute. Add it back so `<View key=... />` works as intended.
    interface IntrinsicAttributes {
      key?: React.Key;
    }
  }
}

export {};
