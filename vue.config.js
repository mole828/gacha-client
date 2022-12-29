const { defineConfig } = require('@vue/cli-service')

let host = 'http://d.hetaobuy.com:7070';  // host = 'http://localhost:8888';

module.exports = defineConfig({
  transpileDependencies: true, 
  devServer: {
    proxy: {
      '/0': {
        target: 'http://d.hetaobuy.com:8000',
        changeOrigin: true,
        pathRewrite: {
          '/0': '/api',
        }
      },
      '/api': {
        target: host,
        changeOrigin: true,
      },
      '/socket.io': {
        target: host,
        ws: true,
        changeOrigin: true,
      },
    },
  }
});

/**
 * TODO:
 * 
 */
