let { buildTestJsonnet } = require('../scripts/support/test-jsonnet');

module.exports = class JsonnetWatchPlugin {
  getUsageInfo(/* globalConfig */) {
    return {
      key: 's',
      prompt: 'rebuild jsonnet sources',
    };
  }

  async run(/* globalConfig, updateConfigAndRun */) {
    await buildTestJsonnet();
    return true;
  }
};
