import FsWrapper from '../../lib/wrapper/acodefswrapper.js';
import {
  gitBranches,
  gitCurrentBranch,
  gitRemoteBranches,
  gitCheckout,
  gitStatusMatrix,
  gitAdd,
  gitRemove,
  gitCommit,
  gitGetConfig,
  gitSetConfig,
  gitPush
} from '../../lib/gitclient.mjs';

import collapsableList from '../collapsableList';
import tile from '../tile';
import Checkbox from '../checkbox';
import http from 'isomorphic-git/http/web/index.js'

/** @type {HTMLElement} */
let $container = null;

let $stagedCollapsableList = null;
let $unstagedCollapsableList = null;
let $untrackedCollapsableList = null;

let $stagedItems = [];
let $unstagedItems = [];
let $untrackedItems = [];

let $stagedItemsSelected = [];
let $unstagedItemsSelected = [];
let $untrackedItemsSelected = [];

let $selectActionList = null;

const confirm = acode.require('confirm');
const alert = acode.require('alert');
const multiPrompt = acode.require('multiPrompt');

// const $header = <div className='header'>
//   <span className='title'>Changed</span>
//   <input type='search' name='search-ext' placeholder='Search' />
// </div>;

// const $main = <div className='gt-main'>
// </div>;

const $header = <div className="gt_header">
  <div className="title">SOURCE CONTROL</div>
  <div className="commands">
    <select id="branches" name="branches" className="branches"></select>
    <span id="git_refresh_span" className="icon refresh"></span>
  </div>
  <input id="commit_message" className="commit_message" name="commit_message" type="text" placeholder="Message"></input>
  <div id="git_commands" className="git_commands">
    <select id="git_command" className="git_command" name="git_command">
      <option value="commit">Commit</option>
      <option value="commit_amend">Commit (Amend)</option>
      <option value="commit_push">Commit & Push</option>
      <option value="commit_sync">Commit & Sync</option>
      <option value="add">Add</option>
      <option value="rollback">Rollback</option>
      <option value="fetch">Fetch</option>
      <option value="pull">Pull</option>
      <option value="push">Push</option>
      <option value="status">Status</option>
    </select>
    <span id="git_exec" className="git_exec icon check"></span>
  </div>
  <br/>
  <br/>
</div>;

const $files = <div className='gt_files'>
</div>;

const onAuthSuccess = async function(url, auth){
  if (auth 
    && (!auth.state || auth.state !== 'cache')
    && await confirm('Confirm', 'Remember password?', true)) {
    savePassword(url, auth)
  }
};

const onAuthFailure = async function(url, auth){
  forgetSavedPassword(url)
  if (await confirm('Confirm', 'Access was denied. Try again?', true)) {
    return await promptAuthInfo(url)
  } else {
    return { cancel: true }
  }
};

const onAuth = async function(url){
  try {
    let auth = await lookupSavedPassword(url);
  
    if (auth) {
      // alert('Alert', 'onAuth look : **' + JSON.stringify(auth) + '**');
      auth.state = 'cache';
      return auth
    }
  
    if(await confirm('Confirm', 'This repo is password protected. Ready to enter a username & password?', true)){
      auth = await promptAuthInfo(url);
      // alert('Alert', 'onAuth prompt : ' + JSON.stringify(auth));
      auth.state = 'new'
      return auth;
    } else {
      return { cancel: true }
    }
  } catch(err){
    alert('Alert', 'Authentication error : ' + err);
    return { cancel: true }
  }
};

async function savePassword(url, auth){
  localStorage.setItem(url, JSON.stringify(auth));
}

async function forgetSavedPassword(url){
  localStorage.removeItem(url);
}

async function lookupSavedPassword(url, auth){
  try {
    const data = localStorage.getItem(url);
    if(data) return JSON.parse(data);
    else return null;
  } catch(err){
    return null;
  }
}

async function promptAuthInfo(url){
  let prompt = await multiPrompt(
      'Enter authentication infos',
      [
        [
          { type: 'text', id: 'user_name', placeholder: 'User name', required: false},
          { type: 'text', id: 'user_password', placeholder: 'User password', required: false}
        ],
        [
          { type: 'text', id: 'token', placeholder: 'Token', required: false},
        ]
      ],
      null
    );
    
    let userName = prompt['user_name'];
    let userPassword = prompt['user_password'];
    let token = prompt['token'];

    let auth = {
      username: userName,
      password: userPassword
    }
    
    if(token !== null){
      let platformAuth = getPlatformAuth(url, token);
      if(platformAuth !== null){
        auth = platformAuth;
      } else {
        auth = {
          username: token
        }
      }
    }
    
    return auth
}

function getPlatformAuth(url, token){
  if(url.includes('github')) 
    return {
      username: 'git',
      password: token
    };
  if(url.includes('gitlab')) 
    return {
      username: 'gitlab-ci-token',
      password: token
    };
  if(url.includes('bitbucket'))
    return {
      username: token
    };
  
  return null;
}

export class SideBarManager {
  constructor(_plug) {
    this.plug = _plug;
  }

  async init() {
    this.removeSidebarApp();
    this.addSidebarApp();
  }

  async destroy() {
    this.removeSidebarApp();
  }

  async addSidebarApp() {
    const sidebarApps = acode.require('sidebarApps');
    // acode.addIcon('git', 'https://git-scm.com/images/logos/downloads/Git-Icon-1788C.svg');

    const _self = this;
    
    sidebarApps.add(
    // icon
    'git', 
    // id
    this.plug.appName, 
    // title
    'Git Client App',
    // init function
    (el) => {
      _self.initApp(el);
    },
    // prepend
    false,
    // onSelected function
    () => {
      _self.refresh();
    }
    );
  }
  
  async initApp(el){
    try {
      
      const _self = this;
      
      if (!$container) {
        $container = el;
        $container.classList.add('extensions');
        $container.append($header);
        this.setEventListeners();

        // // this.setOnShow();
        $container.append($files);
      }
      
      if (!$stagedCollapsableList) {
        $stagedCollapsableList = collapsableList('Staged changes');
        $stagedCollapsableList.classList.add('staged');
        $stagedCollapsableList.$title.classList.add('title');
        $files.append($stagedCollapsableList);
        
        $stagedCollapsableList.collapse = ()=> {
          _self.collapseList($stagedCollapsableList);
        };
        
        $stagedCollapsableList.expand = ()=> {
          _self.expandList($stagedCollapsableList);
        };
      }
      
      if (!$unstagedCollapsableList) {
        $unstagedCollapsableList = collapsableList('Unstaged changes');
        $unstagedCollapsableList.classList.add('unstaged');
        $unstagedCollapsableList.$title.classList.add('title');
        $files.append($unstagedCollapsableList);
        
        $unstagedCollapsableList.collapse = ()=> {
          _self.collapseList($unstagedCollapsableList);
        };
        
        $unstagedCollapsableList.expand = ()=> {
          _self.expandList($unstagedCollapsableList);
        };
      }
      
      if (!$untrackedCollapsableList) {
        $untrackedCollapsableList = collapsableList('Untracked files');
        $untrackedCollapsableList.classList.add('untracked');
        $untrackedCollapsableList.$title.classList.add('title');
        $files.append($untrackedCollapsableList);
        
        $untrackedCollapsableList.collapse = ()=> {
          _self.collapseList($untrackedCollapsableList);
        };
        
        $untrackedCollapsableList.expand = ()=> {
          _self.expandList($untrackedCollapsableList);
        };
      }
  
    } catch(err) {
      this.plug.showMsg(err);
    }
  }
  
  initList(){
    let $list = collapsableList('Staged changes');
    $stagedCollapsableList.classList.add('staged');
    $stagedCollapsableList.$title.classList.add('title');
    $files.append($stagedCollapsableList);
    
    $list.collapse = ()=> {
      _self.collapseList($list);
    };
    
    $list.expand = ()=> {
      _self.expandList($list);
    };
    
    return $list;
  }
  
  collapseList($list){

    if($list.expanded){
      $list.classList.add('hidden');
    }
  }
  
  expandList($list){
    
    $list.classList.remove('hidden');
    
    if($list !== $stagedCollapsableList){
      $stagedCollapsableList.classList.add('hidden');
    }
    
    if($list !== $unstagedCollapsableList){
      $unstagedCollapsableList.classList.add('hidden');
    }
    
    if($list !== $untrackedCollapsableList){
      $untrackedCollapsableList.classList.add('hidden');
    }
    
    this.updateHeight($list);
  }
  
  setOnShow(){
    this.container.on("show", function(e) {
      this.plug.showMsg('onShow');
    }, false);
  }
  
  setEventListeners(){
    let _self = this;
   
    this.refreshBtn = $header.get('#git_refresh_span');
    this.refreshBtn.addEventListener("click", function(e) {
      _self.refresh();
    }, false);
    
    this.branchesSel = $header.get('#branches');
    this.branchesSel.addEventListener("change", function(e) {
      _self.checkout(e.target.value);
    }, false);
    
    this.commitMess = $header.get('#commit_message');
    this.gitCommand = $header.get('#git_command');
    this.gitExec = $header.get('#git_exec');
    this.gitExec.addEventListener("click", function(e) {
      let command = _self.gitCommand.value;
      _self.execComm(command);
    }, false);
    
  }
  
  async execComm(command){
    if('commit' === command){
      this.commit();
    }
    
    if('commit_amend' === command){
      this.commitAmend();
    }
    if('commit_push' === command){
      this.commitPush();
    }
    
    if('commit_sync' === command){
      this.commitSync();
    }
    
    if('add' === command){
      this.add();
    }
    
    if('rollback' === command){
      this.rollback();
    }
    
    if('fetch' === command){
      this.fetch();
    }
    
    if('pull' === command){
      this.pull();
    }
    
    if('push' === command){
      this.push();
    }
  }

  async removeSidebarApp() {
    const sidebarApps = acode.require('sidebarApps');
    sidebarApps.remove(this.plug.appName);
    this.$style.remove();
  }

  async refresh() {
    this.setBranches();
    this.setChangedFiles();
  }
  
  async commit(){
    if(await confirm('Confirm', `Commit following files ? <br/><ul><li>${$stagedItems.map((e)=>e[0]).join('</li><li>')}</li></ul>`, true)) {
      try{
        const gitDir = this.getCurrentGitdir();
        const filesystem = this.getFilesystem();
  
        let message = this.commitMess.value;
        let authorName = await gitGetConfig(filesystem, gitDir, 'user.name');
        let authorEmail = await gitGetConfig(filesystem, gitDir, 'user.email');
        
        if(!authorName) authorName = '';
        if(!authorEmail) authorEmail = '';
        
        await multiPrompt(
          'Enter commit infos',
          [
            { type: 'text', id: 'msg', placeholder: 'Commit message', value: message, required: true},
            [
              { type: 'text', id: 'author_name', placeholder: 'Author name', value: authorName, required: true},
              { type: 'text', id: 'author_email', placeholder: 'Author email', value: authorEmail, required: true}
            ]
          ],
          'Commit message : explain why this commit'
        ).then(
          prompt => {
              authorName = prompt['author_name'];
              authorEmail = prompt['author_email'];
              let commitMessage = prompt['msg'];
              // this.plug.showMsg(`author : ${authorName}/${authorEmail}, message : ${commitMessage}`)
            
              this.commitStagedItems(gitDir, filesystem, commitMessage, authorName, authorEmail);
          }
          // , error => {
          //   this.plug.showMsg('Cancelled');
          // }
        );
      } catch(err){
        this.plug.showMsg("Error : " + err);
      }
    }
  }
  
  async commitAmend(){
    this.plug.showMsg('commit amend ' + $stagedItems.toString());
  }
  
  async commitPush(){
    this.plug.showMsg('commit push ' + $stagedItems.toString());
  }
  
  async commitSync(){
    this.plug.showMsg('commit sync ' + $stagedItems.toString());
  }
  
  async add(){
    let toAddOrRemove = $unstagedItemsSelected.concat($untrackedItemsSelected);

    if(await confirm('Confirm', `Commit following files ? <br/><ul><li>${toAddOrRemove.map((e)=>e[0]).join('</li><li>')}</li></ul>`, true)) {
      this.addOrRemoveItems(toAddOrRemove);
    }
  }
  
  async rollback(){
    let toRollback = $stagedItemsSelected.concat($unstagedItemsSelected).concat($untrackedItemsSelected);
    this.plug.showMsg('rollback ' + toRollback.toString());
  }
  
  async fetch(){
    this.plug.showMsg('fetch');
  }
  
  async pull(){
    this.plug.showMsg('pull');
  }
  
  async push(){
    if(await confirm('Confirm', `Do you want to push commits ?`, true)){
      try{
        const gitDir = this.getCurrentGitdir();
        const filesystem = this.getFilesystem();
        this.pushCommits(gitDir, filesystem);
      } catch(err){
        this.plug.showMsg("Push error : " + err);
      }
    }
  }
  
  async checkout(ref){
    if(await confirm('Confirm', `Checkout ${ref} ?`)){
      this.checkoutRef(ref);
    } else {
      let currentBranch = await this.getCurrentBranch();
      this.branchesSel.value = currentBranch;
    }
  }
  
  async setChangedFiles(){

    try {
      let gitDir;
      try{
        gitDir = this.getCurrentGitdir();
      } catch(err){
        gitDir = null;
      }
      
      if(gitDir){
        const fs = this.getFilesystem();
      
        this.startLoading($stagedCollapsableList);
        this.startLoading($unstagedCollapsableList);
        this.startLoading($untrackedCollapsableList);
        
        let diffs = await gitStatusMatrix(fs, gitDir);
        
        $stagedCollapsableList.$ul.replaceChildren();
        $unstagedCollapsableList.$ul.replaceChildren();
        $untrackedCollapsableList.$ul.replaceChildren();
        
        if (diffs) {
          // remove unmodified files
          diffs = diffs.filter((o) => this.getDiffStatusMess(o) !== 'unmodified');
          
          $stagedItems = diffs.filter((o) => this.isStaged(o));
          $untrackedItems = diffs.filter((o) => this.isUntracked(o));
          $unstagedItems = diffs.filter((o) => !$stagedItems.includes(o) && !$untrackedItems.includes(o));
          
          $stagedCollapsableList.$title.text = `Staged changes (${$stagedItems.length})`;
          this.fillList($stagedCollapsableList, $stagedItemsSelected, $stagedItems);

          // unstaged files
          $unstagedCollapsableList.$title.text = `Unstaged changes(${$unstagedItems.length})`;
          this.fillList($unstagedCollapsableList, $unstagedItemsSelected, $unstagedItems);

          // untracked files
          $untrackedCollapsableList.$title.text = `Untracked files(${$untrackedItems.length})`;
          this.fillList($untrackedCollapsableList, $untrackedItemsSelected, $untrackedItems);
        } else {
          $stagedCollapsableList.$ul.append(<span>No changes</span>);
          $unstagedCollapsableList.$ul.append(<span>No changes</span>);
          $untrackedCollapsableList.$ul.append(<span>No changes</span>);
        }
      }
    } catch(err) {
      $stagedCollapsableList.$ul.append(<span>Error loading changes</span>);
      $unstagedCollapsableList.$ul.append(<span>Error loading changes</span>);
      $untrackedCollapsableList.$ul.append(<span>Error loading changes</span>);
      this.plug.showMsg("setChangedFiles error : " + err);
    } finally {
      this.stopLoading($stagedCollapsableList);
      this.stopLoading($unstagedCollapsableList);
      this.stopLoading($untrackedCollapsableList);
    }
  }
  
  fillList(list, destList, items){

    let newitems = items.map((item) => {
      return {destList, _self: this, item};
    });
    
    list.$ul.content = newitems.map(this.ListItem);
  }
  
  ListItem({ destList, _self, item }) {
    
    const filepath = item[0];
    const status = _self.getDiffStatusMess(item);
    const nameClass = `gt-text ${_self.getChangeClass(item)}`;
    
    let checked = $stagedItemsSelected.includes(filepath)
    || $unstagedItemsSelected.includes(filepath)
    || $untrackedItemsSelected.includes(filepath);
    
    let $checkbox = Checkbox('', checked);
    
    var path = require('path');
    
    const filedir = path.dirname(filepath);
    const filename = path.basename(filepath);

    const $el = <div className='gt-item'></div>;
    
    const $content = <div className='gt-content'>
      <span className={nameClass}>{filename}</span>
      <span className='gt-sub-text'>{filedir}</span>
      <span className='gt-sub-text'>{status}</span>
    </div>;

    $el.appendChild($content);
    $el.appendChild($checkbox);
    
    $content.addEventListener('click', (e) => {
      _self.plug.showMsg('content');
    });
    
    $checkbox.onclick = (e) => {
      try{
        if($checkbox.checked){
          destList.push(item);
        } else {
          destList.splice(destList.indexOf(item), 1);
        }
        
        _self.updateGitCommandList();
      } catch(e){
        _self.plug.showMsg(e);
      }
    };

    return $el;
  }
  
  async updateGitCommandList(){
    if($unstagedItemsSelected.length > 0 || $untrackedItemsSelected.length > 0){
      this.gitCommand.value = 'add';
    } else {
      this.gitCommand.value = 'commit';
    }
  }
  
  // async updateSelectionActions(){
    
  //   this.plug.showMsg('showSelectionActions');
    
  //   $selectActionList.replaceChildren();
  //   // add button
  //   if($untrackedItemsSelected.length > 0
  //   || $unstagedItemsSelected.length > 0){
  //     const addAction = <option value="add">Add</option>;
  //     $selectActionList.append(addAction);
  //   }
    
  //   const rollbackAction = <option value="rollback">Rollback</option>;
  //   $selectActionList.append(rollbackAction);
  // }
  
  async addEventListener($ref, type, handler) {
    $ref.onref = ($el) => {
      $el.addEventListener(type, handler);
    };
  }
  
  async onInput(e) {
    this.plug.showMsg('input');
  }
  
  async startLoading($list) {
    $list.$title.classList.add('loading');
  }

  async stopLoading($list) {
    $list.$title.classList.remove('loading');
  }
  
  async setBranches() {
    try {
      
      let gitDir;
      try{
        gitDir = this.getCurrentGitdir();
      } catch(err){
        gitDir = null;
      }
      
      if(gitDir){
        const filesystem = this.getFilesystem();
        const branchesItem = $header.get('.branches');
        
        const currentBranch = await gitCurrentBranch(filesystem, gitDir);
        const localBranches = await gitBranches(filesystem, gitDir);
        const remoteBranches = await gitRemoteBranches(filesystem, gitDir);
        
        branchesItem.replaceChildren();
        
        if(currentBranch){
          branchesItem.append(<option value={currentBranch}>* {currentBranch}</option>);
        }
        
        if (localBranches && localBranches.length > 0) {
          localBranches.forEach((br) => {
            if(br !== currentBranch){
              let option = <option value={br}>{br}</option>;
              branchesItem.append(option);
            }
          });
        }
        
        if (remoteBranches && remoteBranches.length > 0) {
          remoteBranches.forEach((br) => {
              if(br !== 'HEAD'){
                br = 'remote/origin/' + br;
                let option = <option value={br}>{br}</option>;
                branchesItem.append(option);
              }
          });
        }
      }
    } catch(err) {
      this.plug.showMsg("setBranches error : " + err);
    }
  }
  
  async getCurrentBranch(_filesystem, _gitDir){
    try {
      const gitDir = _gitDir ? _gitDir : this.getCurrentGitdir();
      const filesystem = _filesystem ? _filesystem : this.getFilesystem();
      return await gitCurrentBranch(filesystem, gitDir);
    } catch(err){
      return null;
    }
  }
  
  async commitStagedItems(gitDir, filesystem, msg, author_name, author_email) {
    try {
      this.showLoader("Commit", "Commit files");

      await gitCommit(filesystem, gitDir, msg, author_name, author_email);

      this.hideLoader();
      this.plug.showMsg('commit created');
      this.setChangedFiles();
    } catch(err){
      this.hideLoader();
      this.plug.showMsg("Error : " + err);
    }
  }
  
  async pushCommits(gitDir, filesystem) {
    try {
      this.showLoader("Push", "Processing ...");
      const result = await gitPush(filesystem, gitDir, http, onAuth, onAuthSuccess, onAuthFailure);
      this.plug.showMsg('Commits pushed');
    } catch(err){
      this.plug.showMsg("Push commits error : " + err);
    } finally {
      this.hideLoader();
    }
  }
  
  
  async addOrRemoveItems(items) {
    try {
      this.showLoader("Add", "Adding files");
      
      let _self = this;
      
      const gitDir = this.getCurrentGitdir();
      const filesystem = this.getFilesystem();
      
      const toAdd = [];
      const toRemove = [];
      
      items.forEach((item) => {
        const filepath = item[0];
        const status = _self.getDiffStatusMess(item);
        
        if(status.startsWith('deleted')){
          toRemove.push(filepath);
        } else {
          toAdd.push(filepath);
        }
      });
      
      if(toAdd.length > 0){
        await gitAdd(filesystem, gitDir, toAdd);
      }
      
      if(toRemove.length > 0){
        for (const e of toRemove) {
          await gitRemove(filesystem, gitDir, e);
        }
      }

      $untrackedItemsSelected = [];
      $unstagedItemsSelected = [];
      
      this.hideLoader();
      this.plug.showMsg('files added');
      this.setChangedFiles();
    } catch(err){
      this.hideLoader();
      this.plug.showMsg("Error : " + err);
    }
  }
  
  async checkoutRef(ref) {
    try {
      this.showLoader("Checkout", "Checking out " + ref);
      
      const gitDir = this.getCurrentGitdir();
      const filesystem = this.getFilesystem();
      
      await gitCheckout(filesystem, gitDir, ref);
      this.hideLoader();
      this.plug.showMsg(`${ref} checked out`);
      this.setBranches();
    } catch(err){
      this.hideLoader();
      this.plug.showMsg("Error : " + err);
    }
  }
  
  async showLoader(_title, _message, _opt){
    if(this.loader){
      this.loader.destroy();
    }
    this.loader = acode.require('loader');
    // create the loader
    this.loader.create(_title, _message, _opt);
    this.loader.show();
  }
  
  async hideLoader(){
    if(this.loader){
      this.loader.destroy();
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
  
  isStaged(el){
    let status = this.getDiffStatusMess(el);
    if(status === 'added, staged'    || 
       status === 'modified, staged' || 
       status === 'deleted, staged'
      )
      return true;
    else return false;
  }
  
  isUntracked(el){
    let status = this.getDiffStatusMess(el);
    if(status === 'new, untracked')
      return true;
    else return false;
  }
  
  getDiffStatusMess(el){
    const HeadStatus = el[1];
    const WorkdirStatus = el[2];
    const StageStatus = el[3];
    if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 0) return 'new, untracked';
    if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 2) return 'added, staged';
    if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 3) return 'added, staged, with unstaged changes';
    if(HeadStatus === 1 && WorkdirStatus === 1 && StageStatus == 1) return 'unmodified';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 1) return 'modified, unstaged';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 2) return 'modified, staged';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 3) return 'modified, staged, with unstaged changes';
    if(HeadStatus === 1 && WorkdirStatus === 0 && StageStatus == 1) return 'deleted, unstaged';
    if(HeadStatus === 1 && WorkdirStatus === 0 && StageStatus == 0) return 'deleted, staged';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 0) return 'deleted, staged, with unstaged-modified changes (new file of the same name)';
    if(HeadStatus === 1 && WorkdirStatus === 1 && StageStatus == 0) return 'deleted, staged, with unstaged changes (new file of the same name)';
    
    return 'unknown status';
  }
  
  getChangeClass(el){
    const HeadStatus = el[1];
    const WorkdirStatus = el[2];
    const StageStatus = el[3];
    if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 0) return 'new';
    if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 2) return 'new';
    if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 3) return 'new';
    if(HeadStatus === 1 && WorkdirStatus === 1 && StageStatus == 1) return '';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 1) return 'modified';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 2) return 'modified';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 3) return 'modified';
    if(HeadStatus === 1 && WorkdirStatus === 0 && StageStatus == 1) return 'deleted';
    if(HeadStatus === 1 && WorkdirStatus === 0 && StageStatus == 0) return 'deleted';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 0) return 'deleted';
    if(HeadStatus === 1 && WorkdirStatus === 1 && StageStatus == 0) return 'deleted';
    
    return '';
  }
  
  getDiffShortStatusMess(el){
    const HeadStatus = el[1];
    const WorkdirStatus = el[2];
    const StageStatus = el[3];
    if(HeadStatus === 0 && WorkdirStatus === 0 && StageStatus == 0) return '';
    if(HeadStatus === 0 && WorkdirStatus === 0 && StageStatus == 3) return 'AD';
    if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 0) return '??';
    if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 2) return 'A';
    if(HeadStatus === 0 && WorkdirStatus === 2 && StageStatus == 3) return 'AM';
    if(HeadStatus === 1 && WorkdirStatus === 0 && StageStatus == 0) return 'D';
    if(HeadStatus === 1 && WorkdirStatus === 0 && StageStatus == 1) return 'D';
    if(HeadStatus === 1 && WorkdirStatus === 0 && StageStatus == 3) return 'MD';
    if(HeadStatus === 1 && WorkdirStatus === 1 && StageStatus == 0) return 'D + ??';
    if(HeadStatus === 1 && WorkdirStatus === 1 && StageStatus == 1) return '';
    if(HeadStatus === 1 && WorkdirStatus === 1 && StageStatus == 3) return 'MM';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 0) return 'D + ??';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 1) return 'M';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 2) return 'M';
    if(HeadStatus === 1 && WorkdirStatus === 2 && StageStatus == 3) return 'MM';
    
    return '??';
  }
  
  updateHeight($el) {
    this.removeHeight($stagedCollapsableList, $el !== $stagedCollapsableList);
    this.removeHeight($unstagedCollapsableList, $el !== $unstagedCollapsableList);
    this.removeHeight($untrackedCollapsableList, $el !== $untrackedCollapsableList);
  
    let height = $header.getBoundingClientRect().height;
    this.setHeight($el, height);
  }

  removeHeight($el, collapse = false) {
    if (collapse) $el.collapse?.();
    $el.style.removeProperty('max-height');
    $el.style.removeProperty('height');
  }

  setHeight($el, height) {
    const calcHeight = height ? `calc(100% - ${height}px)` : '100%';
    $el.style.maxHeight = calcHeight;
    $el.style.height = calcHeight;
  }
}