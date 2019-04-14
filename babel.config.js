module.exports = api => {
  let env = api.env();
  let isRuntime = env === 'runtime';

  let presetEnvOptions;
  if (isRuntime) {
    presetEnvOptions = { modules: 'auto' };
  } else {
    presetEnvOptions = { targets: { node: 8 } };
  }

  return {
    comments: !isRuntime, // Honestly not sure if this is doing anything but can't hurt I guess
    presets: [
      ['@babel/preset-env', presetEnvOptions],
      '@babel/preset-typescript',
    ],
    plugins: [
      [
        'add-module-exports',
        {
          addDefaultProperty: true,
        },
      ],
    ],
  };
};
