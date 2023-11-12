module.exports = (shipit) => {
  require('shipit-deploy')(shipit);
  // require('shipit-shared')(shipit);
  require('shipit-pm2')(shipit);

  const projectRoot = './volatalk';

  shipit.initConfig({
    default: {
      servers: 'admin@volatalk.org',
      branch: 'master',
      deployTo: projectRoot + '/test',
      repositoryUrl: 'https://github.com/bosskabouter/peercrypt.git',
      keepReleases: 2,
      // shared: {
      //   overwrite: true,
      //   dirs: ['node_modules'],
      // },
    },
    test: {
      branch: 'develop',
      deployTo: projectRoot + '/test',
      // pm2: {
      //   json: projectRoot + '/server/pm2.test.config.js',
      // },
    },
    prod: {
      branch: 'master',
      deployTo: projectRoot + '/prod',
      // pm2: {
      //   json: projectRoot + '/server/pm2.prod.config.js',
      // },
    },
  });

  shipit.on('updated', async function () {
    shipit.start('build');
    // const conf = shipit.config;

    // const srcClientBuild = `${conf.deployTo}/current/client/build/*`;
    // const desWWW = `/var/www/volatalk/${conf.branch}/`;
    // const cmdCopyClientWWW = `mkdir ${desWWW} -p & cp -R ${srcClientBuild} ${desWWW}`;
  });

  shipit.blTask('build', async () => {
    await runRemote(
      `cd ${shipit.releasePath} && 
      npm i &&  
      nx run-many --targets=build && 
      nx run volatalk-server:pm2
      
      `
    );
    shipit.emit('built');
  });

  async function runRemote(cmd) {
    const res = await shipit.remote(cmd);
    shipit.log(res.stdout);
  }

  // const path = require('path');
  // const ecosystemFilePath = path.join(
  //   shipit.config.deployTo,
  //   'shared',
  //   'ecosystem.config.js'
  // );

  // Our listeners and tasks will go here
};
