const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');
const net = require('net');

let nextProcess = null;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
    srv.on('error', reject);
  });
}

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  try {
    const port = await getFreePort();

    if (app.isPackaged) {
      const nextDir = path.join(process.resourcesPath, 'out', 'standalone', 'frontend');
      const serverPath = path.join(nextDir, 'server.js');

      nextProcess = spawn(process.execPath, [serverPath], {
        cwd: nextDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: port.toString(),
          ELECTRON_RUN_AS_NODE: '1'
        }
      });

      nextProcess.stdout.on('data', (data) => console.log(`Next.js: ${data}`));
      nextProcess.stderr.on('data', (data) => console.error(`Next.js Error: ${data}`));

      await waitOn({ resources: [`http://localhost:${port}`] });
      win.loadURL(`http://localhost:${port}`);
    } else {
      win.loadURL('http://localhost:3000');
      win.webContents.openDevTools();
    }
  } catch(e) {
    console.error(e);
  }
}

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if(nextProcess) nextProcess.kill();
    if(process.platform !== 'darwin'){
        app.quit();
    }
});

app.on('before-quit', () => {
  if(nextProcess) nextProcess.kill();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
});
