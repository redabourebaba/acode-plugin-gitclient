import {
  arrayToString,
  stringToArray
} from '../utils/utils.js';

export default class FsWrapper {
  constructor(_fs) {
    this.fs = _fs;
    this.logger = window.acode.require('logger');
  }

  logdebug(msg) {
    // this.logger.debug('FsWrapper ' + msg);
  }

  loginfo(msg) {
    // this.logger.info('FsWrapper ' + msg);
  }

  logwarn(msg) {
    this.logger.warn('FsWrapper ' + msg);
  }

  logerror(msg) {
    this.logger.error('FsWrapper ' + msg);
  }

  async readFile(path, options = {}) {
    this.loginfo('readFile start : ' + path);

    try{
      let result;
      if (options.encoding) {
        result = arrayToString(await this.fs(path).readFile());
      } else {
        result = Buffer.from(await this.fs(path).readFile(), 'base64');
      }
      // await this.loginfo('readfile result : ' + result);
      this.loginfo('readfile end : ' + path + ' success');
      return result
    } catch(err){
      const msg = 'readFile error : ' + path + ' not found';
      this.logerror(msg);
      const error = new Error(msg);
      error.code = 'ENOENT';
      throw error;
    }
  }

  async createFile(path, contents) {
    this.logdebug('createFile start : ' + path);

    let fileName = this.extractItemName(path);
    let parentPath = this.extractParentPath(path);

    if (!(await this.exists(parentPath))) {
      this.logdebug('createFile create parent folder : ' + parentPath);
      await this.mkdir(parentPath);
    }

    await this.fs(parentPath).createFile(fileName, contents);

    this.logdebug('createFile end : ' + path);

    return
  }

  async writeFile(path, data, options = {}) {

    this.loginfo('writeFile start : ' + path);

    try {

      const exists = await this.exists(path);
      if (!exists) {
        await this.createFile(path, '');
        //   if (options.append) {
        //     const data = arrayToString(await this.readFile(path));
        //     contents = data.concat('\n').concat(data)
        //   }
        //   await this.fs(path).writeFile(data);
        // } else {
        //   await this.createFile(path, data);
      }
      let content;

      if (Buffer.isBuffer(data)) {
        content = Buffer.from(data).buffer;
      } else {
        content = data;
      }

      await this.fs(path).writeFile(content);
      this.loginfo('writeFile end : ' + path);
      return
    } catch(err) {
      const msg = 'writeFile error : ' + path + '. ' + err;
      this.logerror(msg);
      const error = new Error(msg);
      error.code = 'ENOENT';
      throw error;
    }
  }

  async exists(path) {
    this.loginfo('exists start : ' + path);

    let result = false;
    try {
      const stats = await this.fs(path).stat();
      result = stats.exists;
    } catch (err) {
      // this.loginfo('exists error : ' + path + '. ' + err);
      result = false;
    }

    // const result = await this.fs(path).exists();

    this.loginfo('exists checked : ' + path + ' = ' + result);

    return result
  }

  async mkdir(path, level) {
    this.logdebug('mkdir start : ' + path);

    if (!await this.exists(path)) {
      let folderName = this.extractItemName(path);
      let parentPath = this.extractParentPath(path);

      if (parentPath) {
        if (!level) level = 0;

        this.logdebug('mkdir : ' + parentPath + ' check parent. level=' + level);

        if (level < 4) {
          if (parentPath && !(await this.exists(parentPath))) {
            level += 1;
            // recursively create folders
            this.logdebug('mkdir : ' + path + ' create parents');
            await this.mkdir(parentPath, level);
          }

          await this.fs(parentPath).createDirectory(folderName);
          this.logdebug('mkdir : ' + path + ' created');
        } else {
          this.logerror('mkdir : ' + path + ' max level reached');
        }
      } else {
        this.logerror('mkdir : ' + path + ' parentPath empty');
      }
    } else {
      this.logdebug('mkdir : ' + path + ' already exists');
    }

    this.logdebug('mkdir end : ' + path);

    return;
  }

  async rmdir(path) {
    this.logdebug('rmdir start : ' + path);

    await this.rm(path);

    this.logdebug('rmdir end : ' + path);
    return;
  }

  async rm(path, opts) {
    this.logdebug('rm start : ' + path);

    await this.fs(path).delete();

    this.logdebug('rm end : ' + path);
    return
  }

  async unlink(path) {
    this.logdebug('unlink start : ' + path);

    if (await this.exists(path)) {
      await this.fs(path).delete();
    }

    this.logdebug('unlink end : ' + path);

    return
  }

  async stat(path) {
    this.logdebug('stat start : ' + path);


    if (await this.exists(path)) {
      let result;
      result = await this.fs(path).stat();
      
      const isDir = result.isDirectory;
      const isFile = result.isFile;
      
      result.isDirectory = () => { return isDir };
      result.isFile = () => { return isFile };
      result.isSymbolicLink = () => { return false };
      result.ctimeSeconds = result.lastModified / 1000;
      result.ctimeNanoseconds = result.lastModified * 1000;
      result.ctimeMs = result.lastModified;
      result.ctime = new Date(result.lastModified).toString();
      result.mtimeSeconds = result.lastModified / 1000;
      result.mtimeNanoseconds = result.lastModified * 1000;
      result.mtimeMs = result.lastModified;
      result.mtime = new Date(result.lastModified).toString();
      result.dev = 1;
      result.ino = 1;
      result.uid = 1;
      result.gid = 1;
      result.size = result.length;
      
      this.logdebug('stat end : ' + path);
      return result;
    } else {
      const msg = 'stat error : ' + path + ' not found';
      this.logdebug(msg);
      const error = new Error(msg);
      error.code = 'ENOENT';
      throw error;
    }
  }

  async lstat(path) {
    this.logdebug('lstat start : ' + path);
    let result = await this.stat(path);
    this.logdebug('lstat end : ' + path);
    return result;
  }

  async readdir(path) {
    this.logdebug('readdir start : ' + path);

    // response is object with :
    // { name,
    //   mime,
    //   isDirectory,
    //   isFile, // = !isDirectory
    //   uri, // will be deprected in future
    //   url, // same that uri
    // }
    let result = await this.fs(path).lsDir();

    this.logdebug('readdir end : ' + path);

    // return only names
    return result?.map(res => res.name);
  }

  async readlink(path) {
    this.logdebug('readlink start : ' + path);

    if (await this.exists(path)) {
      let result;
      if (options.encoding) {
        result = arrayToString(await this.fs(path).readFile());
      } else {
        result = await this.fs(path).readFile();
      }
      // await this.logdebug('readfile result : ' + result);
      this.logdebug('readlink end : ' + path + ' success');
      return result
    } else {
      const msg = 'readlink error : ' + path + ' not found';
      this.logdebug(msg);
      const error = new Error(msg);
      error.code = 'ENOENT';
      throw error;
    }
  }

  async symlink(path) {
    this.logdebug('symlink start : ' + path);

    try {
      const exists = await this.exists(path);
      if (!exists) {
        await this.createFile(path, '');
      }

      await this.fs(path).writeFile(data);
      this.logdebug('symlink end : ' + path);
      return
    } catch(err) {
      const msg = 'symlink error : ' + path + '. ' + err;
      this.logerror(msg);
      const error = new Error(msg);
      error.code = 'ENOENT';
      throw error;
    }
  }

  extractItemName(path) {
    return path.split('\\').pop().split('/').pop();
  }

  extractParentPath(path) {
    return path.split('/').slice(0, -1).join('/');
  }
}



  // module.exports = fs = {
  //   readFile,
  //   writeFile,
  //   mkdir,
  //   rmdir,
  //   unlink,
  //   stat,
  //   lstat,
  //   readdir,
  //   readlink,
  //   symlink,
  //   setFs
  // }