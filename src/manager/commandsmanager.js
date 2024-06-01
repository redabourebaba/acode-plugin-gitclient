import {
  cloneRepo,
  initRepo,
  gitLogs,
  gitBranches,
  gitCurrentBranch,
  gitRemoteBranches,
  gitAllBranches,
  gitCheckout,
  gitStatusMatrix
} from '../lib/gitclient.mjs';
import FsWrapper from '../lib/wrapper/acodefswrapper.js'
import http from 'isomorphic-git/http/web/index.js'

export class CommandsManager {
  constructor(_plug) {
    this.plug = _plug;
  }

  async init() {
    await this.removeCommands();
    await this.addCommands();
  }

  async destroy() {
    await this.removeCommands();
  }

  async addCommands() {
    const {
      commands
    } = editorManager.editor;

    commands.addCommand({
      name: 'Git clone',
      bindKey: {
        win: 'Ctrl-Alt-C', mac: 'Command-Alt-C'
      },
      exec: () => {
        this.showClonePromptGitUrl();
      },
    });

    commands.addCommand({
      name: 'Git init',
      bindKey: {
        win: 'Ctrl-Alt-I', mac: 'Command-Alt-I'
      },
      exec: () => {
        let url = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments%2Fprojects::primary:Documents/projects/test/repo';
        // this.showInitRepoConfirm(url);
        this.showInitPromptDestinationFolder();
      },
    });

    commands.addCommand({
      name: 'Git log',
      bindKey: {
        win: 'Ctrl-Alt-L', mac: 'Command-Alt-L'
      },
      exec: () => {
        this.showGitLogs();
      },
    });

    commands.addCommand({
      name: 'Git branch',
      bindKey: {
        win: 'Ctrl-Alt-B', mac: 'Command-Alt-B'
      },
      exec: () => {
        this.showGitBranches();
      },
    });

    commands.addCommand({
      name: 'Git checkout',
      bindKey: {
        win: 'Ctrl-Alt-K', mac: 'Command-Alt-K'
      },
      exec: () => {
        this.showGitBranchSelection();
      },
    });

    commands.addCommand({
      name: 'Git diff',
      bindKey: {
        win: 'Ctrl-Alt-D', mac: 'Command-Alt-D'
      },
      exec: () => {
        this.calcAndShowGitDiff();
      },
    });
  }

  async removeCommands() {
    const {
      commands
    } = editorManager.editor;
    commands.removeCommand('Git clone');
    commands.removeCommand('Git init');
    commands.removeCommand('Git log');
    commands.removeCommand('Git branch');
    commands.removeCommand('Git checkout');
    commands.removeCommand('Git diff');
  }

  async showClonePromptGitUrl() {

    const prompt = acode.require('prompt');
    const options = {
      required: true,
      placeholder: 'Enter git repository URL',
      test: (value) => true
    };

    const gitUrl = await prompt(
      'Which repository clone ?',
      'https://github.com/redabourebaba/acode-plugin-gitclient.git',
      'text',
      null
    );
    if (gitUrl) {
      // let destDir = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments%2Fprojects::primary:Documents/projects/test/repo';
      // this.showCloneRepoConfirm(gitUrl, destDir);
      this.showClonePromptDestinationFolder(gitUrl);
    } else {
      this.plug.showToast('Cancelled');
    }
  }

  async showInitPromptDestinationFolder() {

    const defDestDir = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments%2Fprojects::primary:Documents/projects/test/repo';
    const fileBrowser = acode.require('fileBrowser');
    const destDir = await fileBrowser('folder', 'Select destination folder', true, [{
      name: 'projects',
      url: defDestDir
    }]);

    if (destDir.url) {
      this.showInitRepoConfirm(destDir.url);
    } else {
      this.plug.showToast('Cancelled');
    }
  }

  async showClonePromptDestinationFolder(url) {

    const defDestDir = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments%2Fprojects::primary:Documents/projects/test/repo';
    const fileBrowser = acode.require('fileBrowser');
    const destDir = await fileBrowser('folder', 'Select destination folder', true, [{
      name: 'projects',
      url: defDestDir
    }]);

    if (destDir.url) {
      this.showCloneRepoConfirm(url, destDir.url);
    } else {
      this.plug.showToast('Cancelled');
    }
  }

  async showInitRepoConfirm(destDir) {
    try {
      const confirm = acode.require('confirm');
      let confirmation = await confirm('Warning', 'Will init git in '+destDir);
      
      if (confirmation) {
        this.plug.showTracePage("Init git repo");
        this.plug.loginfo('Init is running...');
        
        await initRepo(this.getFilesystem(), destDir);
        this.plug.loginfo('Repository inited successfully');
        this.plug.showMsg('Repository inited successfully');
      } else {
        this.plug.loginfo('Init cancelled');
      }
    } catch (error) {
      this.plug.showMsg('Error init repository: ' + error + ' ' + JSON.stringify(error));
      this.plug.logerror('Error init repository: ' + error + ' ' + JSON.stringify(error));
    }
  }

  async showCloneRepoConfirm(url, destDir) {
    try {
      const confirm = acode.require('confirm');
      let confirmation = await confirm('Warning', 'Will clone '+url+' to '+destDir);
      
      if (confirmation) {
        this.plug.showTracePage("Clone git repo");
        this.plug.loginfo('Clone is running...');
        
        await cloneRepo(this.getFilesystem(), http, url, destDir);
        this.plug.loginfo('Repository cloned successfully');
        this.plug.showMsg('Repository cloned successfully');
      } else {
        this.plug.loginfo('Clone cancelled');
      }
    } catch (error) {
      this.plug.showMsg('Error clone repository: ' + error + ' ' + JSON.stringify(error));
      this.plug.logerror('Error clone repository: ' + error + ' ' + JSON.stringify(error));
    }
  }

  async showGitBranchSelection() {
    try {
      this.plug.showTracePage("Init git repo");
      
      const fs = this.getFilesystem();
      const gitDir = this.getCurrentGitdir();
      this.plug.logmsg('Reading branches ...');

      let branches = await gitAllBranches(fs, gitDir, true);

      this.plug.logmsg('Found branches : ' + JSON.stringify(branches));

      const select = acode.require('select');
      const options = [];

      branches.forEach((el) => {
        options.push([el, el, '', true]);
      });

      const opts = {
        onCancel: () => this.plug.logmsg('Cancelled'),
        hideOnSelect: true,
        textTransform: false,
        default: ''
      };

      const selectedBranch = await select('Choose branch to checkout', options, opts);
      this.plug.logmsg('Selected branch to checkout : ' + selectedBranch);
      await gitCheckout(fs, gitDir, selectedBranch);
    } catch(err) {
      this.plug.logmsg('Error : ' + err);
    }
  }

  async calcAndShowGitDiff() {
    try {
      this.plug.showTracePage("Git diff");
      
      const fs = this.getFilesystem();
      const gitDir = this.getCurrentGitdir();
      this.plug.logmsg('Calculate diff for ' + gitDir);
      
      this.plug.logmsg('Searching ... ');
      
      const diffs = await gitStatusMatrix(fs, gitDir);
      if (diffs) {
        // filter for only changed files
        diffs.filter((o) => o[1] !== 1 || o[2] !== 1 || o[3] !== 1).forEach((el) => {
          this.showGitDiff(el);
        });
      } else {
        this.plug.logmsg('No changes found');
      }
      
      this.plug.logmsg('Git diff calculated ... ');
    } catch (error) {
      this.plug.logerror('Error : ' + error);
      this.plug.showMsg('Error : ' + error);
    }
  }

  async showGitBranches() {
    try {
      this.plug.showTracePage("Git repo branches");

      const fs = this.getFilesystem();
      const gitDir = this.getCurrentGitdir();
      this.plug.logmsg('Branches for ' + gitDir);
      this.plug.logmsg('Searching ... ');

      const currentBranch = await gitCurrentBranch(fs, gitDir);
      const localBranches = await gitBranches(fs, gitDir);
      const remoteBranches = await gitRemoteBranches(fs, gitDir);

      this.plug.logmsg('Local branches : ');
      this.plug.logmsg('   * ' + currentBranch);

      if (localBranches && localBranches.length > 0) {
        localBranches.forEach((el) => {
          if (el !== currentBranch) {
            this.plug.logmsg('   ' + el);
          }
        });
      } else {
        this.plug.logmsg('No local branches found');
      }

      this.plug.logmsg('Remote branches : ');

      if (remoteBranches && remoteBranches.length > 0) {
        remoteBranches.forEach((el) => {
          if (br !== 'HEAD') {
            this.plug.logmsg('   remote/origin/' + el);
          }
        });
      } else {
        this.plug.logmsg('No remote branches found');
      }
    } catch (error) {
      this.plug.logerror('Error : ' + error);
      this.plug.showMsg('Error : ' + error);
    }
  }

  async showGitLogs() {
    try {
      this.plug.showTracePage("Git repo logs");

      const gitDir = this.getCurrentGitdir();
      this.plug.logmsg('Logs for ' + gitDir);
      
      const logs = await gitLogs(this.getFilesystem(), gitDir);
      if (logs) {
        logs.forEach((el) => {
          this.showGitLog(el);
        });
      } else {
        this.plug.logmsg('No logs found');
      }
    } catch (error) {
      this.plug.showMsg('Git Logs Error : ' + error);
    }
  }
  
  getFilesystem() {
    if (this.plug.filesystem) {
      return this.plug.filesystem;
    } else if (this.plug.fs) {
      return new FsWrapper(this.plug.fs);
    } else {
      throw new Error('Error fs is undefined');
    }
  }

  getCurrentGitdir() {
    if (window.addedFolder !== undefined && window.addedFolder.length != null && window.addedFolder.length > 0) {
      if (window.addedFolder[0].url !== undefined) {
        this.plug.logmsg('Logs for ' + window.addedFolder[0].url);
        return window.addedFolder[0].url;
      } else {
        throw new Error('window.addedFolder.listState.url is undefined');
      }
    } else {
      throw new Error('There is no folders loaded in the sidebar');
    }
  }

  async showGitLog(el) {

    const date = new Date(el.commit.author.timestamp);

    const msg = <div>
      <span className='gitlogmsg'>commit&nbsp;{el.oid}</span>
      <br />
      <span>Author:&nbsp;{el.commit.author.name}&lt;{el.commit.author.email}&gt;</span>
      <br />
      <span>Date:&nbsp;&nbsp;&nbsp;{date.toLocaleString()}</span>
      <br />
      <br />
      <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{el.commit.message}</span>
    </div>;
    this.plug.logmsgformat(msg);
  }

  async showGitDiff(el) {
    try{
      const filename = el[0];
      const status = this.getDiffStatusMess(el);
      
      const msg = <div>
        <span className='gitlogmsg'>{filename} &nbsp; {status}</span>
      </div>;
      this.plug.logmsgformat(msg);
    } catch(err){
      this.plug.logerror('showGitDiff error ' + JSON.stringify(err));
    }
  }
  
  getDiffStatusMess(el){
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
}