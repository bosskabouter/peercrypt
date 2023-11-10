module.exports = {
  apps: [
    {
      name: "Volatalk-Server-Prod",
      
      script: "volatalk/prod/current/dist/volatalk/server/main.js",
      watch: false,
      env: {
        PORT: 2000,
      },
    },
    // {
    //   name: "Volatalk-Push-Prod",
    //   script: "./volatalk/prod/current/server/volapush/dist/index.js",
    //   instances: 2,
    //   exec_mode: "cluster",
    //   watch: false,
    //   env: {
    //     PORT: 3000,
    //     CTX: "/volapush",
    //   },
    // },
    // {
    //   name: "Volatalk-Chat-Prod",
    //   script: "./volatalk/prod/current/server/volachat/dist/index.js",
    //   instances: 2,
    //   exec_mode: "cluster",
    //   watch: false,
    //   env: {
    //     PORT: 4000,
    //     CTX: "/volachat",
    //   },
    // },
    // {
    //   name: "Volatalk-Proxy-Prod",
    //   script: "./volatalk/prod/current/server/volaproxy/dist/index.js",
    //   instances: 2,
    //   exec_mode: "cluster",
    //   watch: false,
    //   env: {
    //     PORT: 5000,
    //     CTX: "/volaproxy",
    //   },
    // },
  ],
};
