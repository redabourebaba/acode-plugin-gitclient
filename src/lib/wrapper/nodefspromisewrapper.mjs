export class FsWrapper {
  constructor(_fs) {
    this.fs = _fs;
  }

  readFile(filepath, options = {}) {
    return this.fs.readFile(filepath, options);
  }

  createFile(filepath, contents) {
    return this.fs.createFile(filepath, contents);
  }

  writeFile(filepath, contents, options = {}) {
    
    console.log('writeFile ' + filepath);
    console.log(typeof contents);
    console.log(contents);
    
    return this.fs.writeFile(filepath, contents, options);
  }

  mkdir(path) {
    return this.fs.mkdir(path);
  }

  rmdir(path) {
    return this.fs.rmdir(path);
  }

  rm(path) {
    return this.fs.rm(path);
  }

  unlink(path) {
    return this.fs.unlink(path);
  }

  stat(path) {
    // return this.fs.stat(path, (error) => { console.log(error); });
    return this.fs.stat(path);
  }

  lstat(path) {
    return this.fs.lstat(path);
  }

  readdir(path) {
    return this.fs.readdir(path);
  }

  readlink(path, opts = {}) {
    return this.fs.readlink(path, opts);
  }

  symlink(buffer, path) {
    return this.fs.symlink(buffer, path);
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