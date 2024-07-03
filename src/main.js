import plugin from '../plugin.json';
import style from "./style.scss";
import acestyle from './lib/acediff/styles/ace-diff.scss';
// import logconsole from "./template/logconsole.tpl.html";
import FsWrapper from './lib/wrapper/acodefswrapper.js'

import {
  FileLogger
} from './lib/logger/filelogger.js'

import {
  ConsoleLogger
} from './lib/logger/consolelogger.js'

import {
  SideBarManager
} from './components/sidebarapp/sidebarmanager.js'

import {
  CommandsManager
} from './manager/commandsmanager.js'

const alert = acode.require('alert');

export class GitClientAcodePlugin {

  appName = 'git-client-app';

  async init($page) {
    this.fs = acode.require('fs');
    this.filelogger = new FileLogger(this.fs);
    this.consolelogger = new ConsoleLogger(this);
    
    this.$page = $page;
    this.$style = tag("style", {
      textContent: style,
    });
    
    this.$acestyle = tag("style", {
      textContent: acestyle,
    });

    await this.defineLogger();
    
    this.filesystem = new FsWrapper(this.fs);
    this.sideBarManager = new SideBarManager(this);
    this.commandsManager = new CommandsManager(this);
    document.head.append(this.$style);
    document.head.append(this.$acestyle);

    await this.sideBarManager.init();
    await this.commandsManager.init();
  }

  async destroy() {
    await this.sideBarManager.destroy();
    await this.commandsManager.destroy();
    this.$style.remove();
  }

  async defineLogger() {
    const _self = this;
    acode.define('logger', {
      info: (msg) => {
        _self.loginfo(msg);
      },
      debug: (msg) => {
        _self.logdebug(msg);
      },
      error: (msg) => {
        _self.logerror(msg);
      },
      warn: (msg) => {
        _self.logwarn(msg);
      },
      msg: (msg) => {
        _self.logmsg(msg);
      },
      msgformat: (msg) => {
        _self.logmsgformat(msg);
      },
    });
  }

  async saveLogsToFile() {
    this.showMsg('self toto');
    this.showToast('self toto');
    // this.filelogger.info(this.$page.logs.innerText);
  }

  showTracePage(title) {
    this.$page.settitle(title);
    
    // clear logs element
    let diff = this.$page.get('#diff');
    if(diff) {
      // diff.replaceChildren();
      this.$page.remove(diff);
    }
    
    const _self = this;
    // this.addToolbar((e) => {
      // _self.showMsg("click")
      // _self.saveLogsToFile();
      // _self.saveLogsToFile();
    // });
    
    let logs = this.$page.get('#logs');
    if(!logs) {
      logs = <div id="logs"/>;
      this.$page.append(logs);
    } else {
      logs.replaceChildren();
    }
    
    this.$page.show();
  }
  
  showDiffPage(title) {
    this.$page.settitle(title);
    
    // clear logs element
    let logs = this.$page.get('#logs');
    if(logs) {
      // logs.replaceChildren();
      this.$page.remove(logs);
    }
    
    const _self = this;
    // this.addToolbar((e) => {
      // _self.saveLogsToFile();
      // _self.showMsg("click")
    // });
    
    let diff = this.$page.get('#diff');
    if(!diff) {
      diff = <div id="diff"/>;
      this.$page.append(diff);
    } else {
      diff.replaceChildren();
    }
    
    // this.$page.on("hide", () => {
    //   _self.showMsg("hide");
    // });
    
    this.$page.show();
    
    return diff;
  }
  
  addToolbar(callback){
    let toolbar = this.$page.get('#toolbar');
    
    if(!toolbar) {
      toolbar =
      <div
        id='toolbar'
        className='toolbar'>
      </div>;
      
      saveBtn =
      <span
        id="toolbarSaveBtn"
        className='icon save'>
      </span>;
      toolbar.append(saveBtn);
      
      this.$page.header.append(toolbar);
      // saveBtn.addEventListener("click", callback);
    }

    // query.on('document', 'click', '#'+acediff.closeLeftEditorButtonId, (e) => {
	   // switchEditorVisibility(acediff, 'left');
    // });
    
    // let saveBtn = document.querySelector('#toolbarSaveBtn');
  
    // let saveBtn = toolbar.get('#saveBtn');
  }

  showMsg(msg) {
    alert('Alert', msg);
  }

  showToast(msg) {
    const toast = acode.require('toast');
    toast(msg, 1000);
  }

  showLog(msg) {
    const msgtag = tag("div", {
      textContent: msg,
    });
    
    let logs = this.$page.get('#logs');
    
    if (logs) {
      logs.append(msgtag);
      logs.append(tag('br'));
    }
  }

  showLogFormat(msgformat) {
    
    let logs = this.$page.get('#logs');
    
    if (logs) {
      logs.append(msgformat);
      logs.append(tag('br'));
    }
  }

  logerror(msg) {
    this.consolelogger.error(msg);
  }

  logwarn(msg) {
    this.consolelogger.warn(msg);
  }

  loginfo(msg) {
    this.consolelogger.info(msg);
  }

  logdebug(msg) {
    this.consolelogger.debug(msg);
  }

  logmsg(msg) {
    this.consolelogger.msg(msg);
  }

  logmsgformat(msg) {
    this.consolelogger.msgformat(msg);
  }

}

if (window.acode) {
  const acodePlugin = new GitClientAcodePlugin();

  acode.setPluginInit(plugin.id, async (baseUrl, $page, {
    cacheFileUrl, cacheFile
  }) => {
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    acodePlugin.baseUrl = baseUrl;
    await acodePlugin.init($page, cacheFile, cacheFileUrl);
  });

  acode.setPluginUnmount(plugin.id,
    () => {
      acodePlugin.destroy();
    });
}