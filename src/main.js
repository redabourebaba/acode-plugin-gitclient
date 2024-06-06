import plugin from '../plugin.json';
import style from "./style.scss";
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

    await this.defineLogger();
    
    this.filesystem = new FsWrapper(this.fs);
    this.sideBarManager = new SideBarManager(this);
    this.commandsManager = new CommandsManager(this);
    document.head.append(this.$style);

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
    
    let logs = this.$page.get('#logs');
    
    if(!logs) {
      logs = <div id="logs"/>;
      this.$page.append(logs);
    } else {
      logs.replaceChildren();
    }

    const _self = this;
    const saveBtn =
    <span
      className='icon save'
      onclick={() => this.saveLogsToFile.call(this)}>
    </span>;
    
    saveBtn.addEventListener("click", function(e) {
      _self.saveLogsToFile();
    }, false);

    // this.saveBtn = this.$page.querySelector('.save');

    // if (this.saveBtn === undefined) {
    this.$page.header.append(saveBtn);
    // }

    // var editor = ace.edit(this.$page.logs, {
    //   mode: "ace/mode/javascript",
    //   selectionStyle: "text"
    // })
    // editor.setTheme("ace/theme/monokai");
    // editor.session.setMode("ace/mode/javascript");

    this.$page.show();
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