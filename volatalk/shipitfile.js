module.exports = (shipit) => {
  require("shipit-deploy")(shipit);
  require("shipit-shared")(shipit);
  require("shipit-pm2")(shipit);

  const projectRoot = "./volatalk";

  shipit.initConfig({
    default: {
      servers: "admin@volatalk.org",
      branch: "master",
      deployTo: projectRoot + "/test",
      repositoryUrl: "https://github.com/bosskabouter/peercrypt.git",
      keepReleases: 5,
      shared: {
        overwrite: true,
        dirs: ["node_modules"],
      },
    },
    test: {
      branch: "develop",
      deployTo: projectRoot + "/test",
      pm2: {
        json: projectRoot + "/test/current/server/pm2.test.config.js",

      },
    },
    prod: {
      branch: "master",
      deployTo: projectRoot + "/prod",
      pm2: {
        json: projectRoot + "/server/pm2.prod.config.js",

      },
    },
  });

  shipit.on("published", function () {
    const conf = shipit.config;


    const srcClientBuild = `${conf.deployTo}/current/client/build/*`;
    const desWWW = `/var/www/volatalk/${conf.branch}/`;
    const cmdCopyClientWWW = `mkdir ${desWWW} -p & cp -R ${srcClientBuild} ${desWWW}`;

    const cdServer = `cd ${conf.deployTo}/current/ && `;
    runRemote(cdServer + `npm i && npx nx run volatalk-server:build `);


   // runRemote(cmdCopyClientWWW);
  });

  async function runRemote(cmd) {
    shipit.log("CMD: " + cmd);
    let result = (await shipit.remote(cmd))[0].child;
   
    shipit.log("exitCode: " + result.exitCode);
  }

  const path = require("path");
  const ecosystemFilePath = path.join(
    shipit.config.deployTo,
    "shared",
    "ecosystem.config.js"
  );

  // Our listeners and tasks will go here
};
