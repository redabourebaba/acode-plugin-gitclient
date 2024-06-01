// import fs from 'node:fs';
import fs from 'node:fs/promises';
import {
  cloneRepo,
  initRepo,
  gitStatusMatrix
} from '../src/lib/gitclient.mjs';
// import { FsWrapper } from '../src/lib/nodefswrapper.mjs';
import { FsWrapper } from '../src/lib/wrapper/nodefspromisewrapper.mjs';

// const git = require('./src/gitclient.mjs');
// const filepath = '/storage/emulated/0/Documents/projects/test/repo/concurrency';
const filepath = '/storage/emulated/0/Documents/projects/test/repo';
// const filepath = '/storage/emulated/0/Documents/projects/acode/acode-plugin-gitclient';

const filesystem = new FsWrapper(fs);
console.log('-------RUNNING-------');

// await filesystem.writeFile(
//     filepath + '/config',
//     '[core]\n' +
//       '\trepositoryformatversion = 0\n' +
//       '\tfilemode = false\n' +
//       `\tbare = \n` +
//       '\tlogallrefupdates = true\n' +
//       '\tsymlinks = false\n' +
//       '\tignorecase = true\n'
//   )
  
// await filesystem.mkdir(filepath);

// try {
//   let result = await filesystem.stat(filepath);
//   // let result = await fs.stat(filepath, () => {});
//   console.log(result);
  
// } catch (err) {
//   console.log('xxxxxx--------------');
//   if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
//     console.log('ENOENT/ENOTDIR')
//   } else {
//     console.log('Unhandled error in "FileSystem.exists()" function', err)
//     // throw err
//   }
// }https://gitlab.com/java_fundamentals/concurrency.git

// cloneRepo('https://github.com/deadlyjack/Acode.git', '/storage/emulated/0/Documents/projects/test');
// await cloneRepo(
//   filesystem,
//   'https://gitlab.com/java_fundamentals/concurrency.git',
//   filepath
// );

// try {
//       await filesystem.stat(filepath);
//       console.log("exist");
//     } catch (err) {
//       if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
//         console.log("not exists");
//       } else {
//         console.log('Unhandled error in "FileSystem.exists()" function', err);
//         throw err;
//       }
//     }
    
// await initRepo(
//   filesystem,
//   filepath
// );

const diffs = await gitStatusMatrix(filesystem, filepath);

if (diffs) {
  // filter for only changed files
  diffs.filter((o) => o[1] !== 1 || o[2] !== 1 || o[3] !== 1).forEach((el) => {
    showGitDiff(el);
  });
} else {
  console.log('No changes found');
}

console.log('------DONE--------');

function showGitDiff(el) {
  try{
    const filename = el[0];
    const status = getDiffStatusMess(el);
    
    const msg = `${filename} ${status}`
    
    console.log(msg);
  } catch(err){
    console.log('showGitDiff error ' + JSON.stringify(err));
  }
}
  
function getDiffStatusMess(el){
  const HeadStatus = el[1];
  const WorkdirStatus = el[2];
  const StageStatus = el[3];
  if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 0) return 'new, untracked';
  if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 2) return 'added, staged';
  if(HeadStatus === 1 && WorkdirStatus === 1 && StageStatus == 1) return 'unmodified';
  if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 3) return 'added, staged, with unstaged changes';
  if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 1) return 'modified, unstaged';
  if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 2) return 'modified, staged';
  if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 3) return 'modified, staged, with unstaged changes';
  if(HeadStatus === 1 && WorkdirStatus === 0 && StageStatus == 1) return 'deleted, unstaged';
  if(HeadStatus === 1 && WorkdirStatus === 0 && StageStatus == 0) return 'deleted, staged';
  if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 0) return 'deleted, staged, with unstaged-modified changes (new file of the same name)';
  if(HeadStatus === 1 && WorkdirStatus === 1 && StageStatus == 0) return 'deleted, staged, with unstaged changes (new file of the same name)';
  
  return 'unknown status';
}