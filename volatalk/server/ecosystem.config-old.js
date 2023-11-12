module.exports = {
    apps: [
      {
        name: "volatalk-peercrypt",
        script: "../../dist/volatalk/server/dist/index.js",
        watch: false,
        env: {
          PORT: 2000,
          CTX:'/peercrypt'
          //"NODE_ENV": "development"
        },  
      }
    //   ,
    //   {
    //     name: "Volatalk-Push",
    //     script: "./volapush/dist/index.js",
    //     instances: 2,
    //     exec_mode: "cluster",
    //     watch: true,
    //     //increment_var: "PORT",
    //     env: {
    //       PORT: 3000,
    //       CTX:'/volapush'
    //       //  "NODE_ENV": "development"
    //     },
    //   },
    //   {
    //     name: "Volatalk-Chat",
    //     script: "./volachat/dist/index.js",
    //     instances: 2,
    //     exec_mode: "cluster",
    //     watch: true,
    //     // increment_var: "PORT",
    //     env: {
    //       PORT: 4000,
    //       CTX:'/volachat'
    //       //  "NODE_ENV": "development"
    //     },
    //   },
    //   {
    //     name: "Volatalk-Proxy",
    //     script: "./volaproxy/dist/index.js",
    //     instances: 2,
    //     exec_mode: "cluster",
    //     watch: true,
    //     // increment_var: "PORT",
    //     env: {
    //       PORT: 6000,
    //       CTX:'/volaproxy'
    //       //  "NODE_ENV": "development"
    //     },
    //   },
    ],
  };
  