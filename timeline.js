var EventEmitter = require("events").EventEmitter;
class TimeLine extends EventEmitter
{
  constructor(events = []){
    super();
    this.index = 0;
    this.events = events;
  }

  add(time,func){
    this.events.push({time:time,func:func});
    this.events.sort((a,b)=>a-b);
  }

  update(time){
    while(this.index < this.events.length && time >= this.events[this.index].time){
      this.events[this.index].func(time);
      this.index += 1;
    }
    if(this.index >= this.events.length){
      this.emit('end');
    }
  }
}
module.exports = TimeLine;