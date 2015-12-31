import electron from 'electron'
import ChildProcess from 'child_process'

const ipc = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;



// Set up worker
const worker = ChildProcess.fork(__dirname + '/worker.js')
let renderProcess = null

const documents = new Map()

worker.on('message', (message) => {
  if (!renderProcess) {
    return
  }
  if (!message.error) {
    documents.set(message.filePath, message.words)
  }
  const {filePath, error} = message
  renderProcess.send('worker', {filePath, error})
})

ipc.on('worker', (ev, message) => {
  worker.send(message)
  renderProcess = ev.sender
})


// Set up analyzer
const analyzer = ChildProcess.fork(__dirname + '/analyzer.js')

analyzer.on('message', (message) => {
  if (!renderProcess) {
    return
  }
  renderProcess.send('analyzer', message.topics)
})

ipc.on('analyzer', (ev, message) => {
  const docs = [...documents.values()]
  analyzer.send({documents: docs, numTopics: message.numTopics})
  renderProcess = ev.sender
})


// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/../ui/index.html');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
