import FsWrapper from '../wrapper/acodefswrapper.js'

import Queue from 'queue'

export class FileLogger {
  
  constructor(_fs) {
    this.fs = new FsWrapper(_fs);
    this.logfile = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments%2Fprojects::primary:Documents/projects/acode/log.txt';
    this.queue = new Queue({results: []});
    this.queue.start(err => {
      if (err) throw err
      console.log('all done:', this.queue.results)
    });
  }

  async info(msg) {
    this.queue.push(this.writeLog(msg));
  }
  
  writeLog(msg){
      return this.fs.writeFile(this.logfile, msg, {
        append: true
      });
  }
}