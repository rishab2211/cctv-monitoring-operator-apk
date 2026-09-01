import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/navigation/RootNavigator', () => {
  const { View } = require('react-native');
  const ReactObj = require('react');
  return {
    RootNavigator: () => ReactObj.createElement(View, { testID: 'root-navigator' }),
  };
});

test('renders app root providers correctly', async () => {
  let renderer: any;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(renderer).toBeDefined();
  await ReactTestRenderer.act(async () => {
    renderer.unmount();
  });
});

