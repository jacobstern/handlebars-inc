module.exports = api => {
  let presetEnvOptions;
  if (api.env() === 'runtime') {
    presetEnvOptions = {}; // Use default targets
  } else {
    presetEnvOptions = { targets: { node: 8 } };
  }

  return {
    presets: [
      ['@babel/preset-env', presetEnvOptions],
      '@babel/preset-typescript'
    ]
  };
};
