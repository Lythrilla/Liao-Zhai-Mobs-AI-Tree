const webpack = require('webpack');

module.exports = function override(config, env) {
  // 添加Node.js polyfills
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify'),
    util: require.resolve('util'),
    buffer: require.resolve('buffer'),
    process: require.resolve('process/browser'),
  };

  // 添加全局变量
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  );

  // 禁用 splitChunks，解决 Electron 加载 chunks 的问题
  if (config.optimization) {
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };
  }

  // 设置输出文件名为固定名称，而不是包含哈希值
  config.output = {
    ...config.output,
    filename: 'static/js/[name].js',
    chunkFilename: 'static/js/[name].chunk.js',
  };

  return config;
}; 