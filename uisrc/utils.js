const ipc = global['require']('electron').ipcRenderer
import {Subject} from 'rx'

function preventDragDropFileOpening() {
  document.addEventListener('dragover', function(event) {
    event.preventDefault();
    return false;
  },false);

  document.addEventListener('drop', function(event) {
    event.preventDefault();
    return false;
  },false);
}

function makeIPCDriver(channel) {
  return (message$) => {
    message$.subscribe((message) => {
      ipc.send(channel, message)
    })
    const subject = new Subject()
    ipc.on(channel, (ev, message) => {
      subject.onNext(message)
    })
    return subject
  }
}

export {preventDragDropFileOpening, makeIPCDriver}

