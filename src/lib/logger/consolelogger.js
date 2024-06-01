import AsyncLock from 'async-lock';

export class ConsoleLogger {

  constructor(_plug) {
    this.plug = _plug;
    this.lock = new AsyncLock({
      maxPending: Infinity
    });
  }

  async info(msg) {
    this.msg(new Date(Date.now()).toISOString() + " | INFO | " + msg);
  }

  async debug(msg) {
    this.msg(new Date(Date.now()).toISOString() + " | DEBUG | " + msg);
  }

  async warn(msg) {
    this.msg(new Date(Date.now()).toISOString() + "  | WARN | " + msg);
  }

  async error(msg) {
    this.msg(new Date(Date.now()).toISOString() + "  | ERROR | " + msg);
  }

  async msg(msg) {
    let _self = this;
    this.lock.acquire('log', function() {
      _self.plug.showLog(msg);
    }, function(err, ret) {});
  }

  async msgformat(msg) {
    let _self = this;
    this.lock.acquire('log', function() {
      _self.plug.showLogFormat(msg);
    }, function(err, ret) {});
  }
}