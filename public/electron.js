// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const { filesFromPath } = require('files-from-path')
const { NFTStorage } = require('nft.storage')

const endpoint = 'https://api.nft.storage'
const token = process.env.TOKEN

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'NFT UP',
    width: 880,
    height: 420,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '..', 'build', 'index.html')}`)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  ipcMain.on('uploadFiles', async (event, paths) => {
    try {
      mainWindow.setProgressBar(2)
      mainWindow.webContents.send('uploadProgress', { statusText: 'Reading files...' })
      let totalBytes = 0
      const files = []
      try {
        for (const path of paths) {
          for await (const file of filesFromPath(path)) {
            files.push(file)
            totalBytes += file.size
            mainWindow.webContents.send('uploadProgress', {
              totalBytes,
              totalFiles: files.length
            })
          }
        }
      } catch (err) {
        console.error(err)
        mainWindow.webContents.send('uploadProgress', { error: `reading files: ${err.message}` })
        return
      }

      mainWindow.webContents.send('uploadProgress', { statusText: 'Packing files...' })
      let cid, car
      try {
        ;({ cid, car } = files.length === 1 && paths[0].endsWith(files[0].name)
          ? await NFTStorage.encodeBlob(files[0])
          : await NFTStorage.encodeDirectory(files))
      } catch (err) {
        console.error(err)
        mainWindow.webContents.send('uploadProgress', { error: `packing files: ${err.message}` })
        return
      }

      mainWindow.webContents.send('uploadProgress', { statusText: 'Storing files...', storedBytes: 0.01 })
      try {
        let storedBytes = 0
        await NFTStorage.storeCar({ endpoint, token }, car, {
          onStoredChunk (size) {
            storedBytes += size
            mainWindow.webContents.send('uploadProgress', { storedBytes })
            mainWindow.setProgressBar(storedBytes / totalBytes)
          }
        })
      } catch (err) {
        console.error(err)
        mainWindow.webContents.send('uploadProgress', { error: `storing files: ${err.message}` })
        return
      } finally {
        if (car && car.blockstore && car.blockstore.close) {
          car.blockstore.close()
        }
      }

      mainWindow.webContents.send('uploadProgress', { cid: cid.toString(), storedBytes: totalBytes, statusText: 'Done!' })
    } finally {
      mainWindow.setProgressBar(-1)
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  // if (process.platform !== 'darwin') app.quit()
  app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
