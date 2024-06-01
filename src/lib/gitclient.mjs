import git from './isogit/index_fixed.mjs'
// import git from './isogit/index.mjs'
// import git from 'isomorphic-git'

function logerror(msg){
  if(typeof window !== 'undefined'&& window.acode) {
    let logger = window.acode.require('logger');
    logger.error('ISOGIT ' + msg);
  } else {
    console.log("ISOGIT [ERROR] " + msg);
  }
}

function logwarn(msg){
  if(typeof window !== 'undefined'&& window.acode) {
    let logger = window.acode.require('logger');
    logger.warn('ISOGIT ' + msg);
  } else {
    console.log("ISOGIT [WARN] " + msg);
  }
}

function loginfo(msg){
  if(typeof window !== 'undefined' && window.acode) {
    let logger = window.acode.require('logger');
    logger.info('ISOGIT ' + msg);
  } else {
    console.log("ISOGIT [INFO] " + msg);
  }
}

function logdebug(msg){
  if(typeof window !== 'undefined' && window.acode) {
    let logger = window.acode.require('logger');
    logger.debug('ISOGIT ' + msg);
  } else {
    // console.log("ISOGIT [DEBUG] " + msg);
  }
}


export function cloneRepo(_fs, _http, _url, _destDir) {

  return git.clone({
    fs: _fs,
    url: _url,
    dir: _destDir,
    gitdir: _destDir + "/.git",
    http: _http,
    corsProxy: 'https://cors.isomorphic-git.org',
    singleBranch: true, // Cloner seulement la branche principale
  });
}

export async function initRepo(_fs, _destDir) {

  return await git.init({
    fs: _fs,
    dir: _destDir,
    gitdir: _destDir + "/.git"
  });
}

export async function gitLogs(_fs, _dir) {
  return await git.log({
    fs: _fs,
    dir: _dir,
    gitdir: _dir + "/.git"
  });
}

export async function gitAllBranches(_fs, _dir, excludeCurrent = false) {
  const currentBranch = await gitCurrentBranch(_fs, _dir);
  const localBranches = await gitBranches(_fs, _dir);
  const remoteBranches = await gitRemoteBranches(_fs, _dir);

  let branches = [];

  if (currentBranch && !excludeCurrent) {
    branches.push(currentBranch);
  }

  if (localBranches && localBranches.length > 0) {
    localBranches.forEach((br) => {
      if (br !== currentBranch) {
        branches.push(br);
      }
    });
  }

  if (remoteBranches && remoteBranches.length > 0) {
    remoteBranches.forEach((br) => {
      if (br !== 'HEAD') {
        branches.push('remote/origin/' + br);
      }
    });
  }

  return branches;
}

export async function gitCurrentBranch(_fs, _dir) {
  return await git.currentBranch({
    fs: _fs,
    dir: _dir,
    fullname: false
  });
}

export async function gitBranches(_fs, _dir) {
  return await git.listBranches({
    fs: _fs,
    dir: _dir
  });
}

export async function gitRemoteBranches(_fs, _dir) {
  return await git.listBranches({
    fs: _fs,
    dir: _dir,
    remote: 'origin'
  });
}

export async function gitCheckout(_fs, _dir, _ref) {
  return await git.checkout({
    fs: _fs,
    dir: _dir,
    ref: _ref
  });
}

export async function gitAdd(_fs, _dir, _files) {
  return await git.add({
    fs: _fs,
    dir: _dir,
    filepath: _files
  });
}

export async function gitRemove(_fs, _dir, _file) {
  return await git.remove({
    fs: _fs,
    dir: _dir,
    filepath: _file
  });
}

export async function gitCommit(_fs, _dir, _msg, _auth_name, _auth_email) {
  return await git.commit({
    fs: _fs,
    dir: _dir,
    message: _msg,
    author: {
      name: _auth_name,
      email: _auth_email
    }
  });
}

export async function gitPush(_fs, _dir, _http) {
  return await git.push({
    fs: _fs,
    dir: _dir,
    http: _http,
    remote: 'origin',
    corsProxy: 'https://cors.isomorphic-git.org',
  });
}

export async function gitStatusMatrix(_fs, _dir, _filter) {
  return await git.statusMatrix({
    fs: _fs,
    dir: _dir,
    filter: _filter
  });
}

// Write config value
export async function gitSetConfig(_fs, _dir, _path, _value) {
  return await git.setConfig({
    fs: _fs,
    dir: _dir,
    path: _path,
    value: _value
  });
}

// Read config value
export async function gitGetConfig(_fs, _dir, _path) {
  return await git.getConfig({
    fs: _fs,
    dir: _dir,
    path: _path
  });
}