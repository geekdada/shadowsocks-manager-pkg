#!/usr/bin/env node

'use strict';

const execa = require('execa');
const fs = require('fs-extra');
const { join } = require('path');

const cacheFolder = join(__dirname, '../.cache');
const distFolder = join(__dirname, '../dist');
const pkgFolder = join(require.resolve('shadowsocks-manager'), '../');

const copyArchive = async () => {
  await fs.copy(pkgFolder, cacheFolder);
};

const installDependencies = async () => {
  const cmd = ['npm', 'install', '--production'];

  await execa.command(cmd.join(' '), {
    stderr: process.stderr,
    stdout: process.stdout,
    cwd: cacheFolder,
  });
};

const deleteArchive = async () => {
  await fs.remove(cacheFolder);
  await fs.ensureDir(cacheFolder);
  await fs.remove(distFolder);
  await fs.ensureDir(distFolder);
};

const patchPackage = async () => {
  const patch = await fs.readFile(join(__dirname, '../patch.txt'));
  const pkg = require(join(cacheFolder, './package.json'));

  await fs.writeFile(join(cacheFolder, './bin/ssmgr'), patch);
  await fs.writeJson(join(cacheFolder, './package.json'), {
    ...pkg,
    pkg: {
      assets: [
        'plugins/**/*',
        'services/**/*',
        'models/**/*',
      ],
    },
  });
};

const makePackage = async () => {
  const platform = process.platform === 'darwin' ? 'macos' : 'linux';
  const binName = 'shadowsocks-manager-' + platform + '-x64';
  const cmd = ['pkg', '--target', 'node12-' + platform + '-x64', '--output', join(distFolder, binName), '.'];

  await execa.command(cmd.join(' '), {
    stderr: process.stderr,
    stdout: process.stdout,
    cwd: cacheFolder,
  });
};

const main = async () => {
  await deleteArchive();
  await copyArchive();
  await installDependencies();
  await patchPackage();
  await makePackage();
};

(async () => {
  await main();
})()
.catch(err => {
  console.error(err);
  process.exit(1);
});

