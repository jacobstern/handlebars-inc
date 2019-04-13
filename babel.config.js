module.exports = api => {
  let presetEnvOptions;
  let isRuntime = api.env() === 'runtime';

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
