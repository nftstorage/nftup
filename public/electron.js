const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const { filesFromPath } = require('files-from-path')
const { NFTStorage } = require('nft.storage')
const Store = require('electron-store')
const fs = require('fs');
const stream = require('node:stream');

//S3 Imports
const {
  S3Client
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const s3config = {
  credentials: {},
  endpoint: `https://s3.fbase.dev`,
  region: "us-east-1",
  forcePathStyle: true,
};

function createWindow () {
  const store = new Store({ schema: { apiToken: { type: 'string' } } })

  const template = [
    { role: 'appMenu' },
    { role: 'fileMenu' },
    { role: 'editMenu' },
    ...isDev ? [{ role: 'viewMenu' }] : [],
    {
      label: 'Tools',
      submenu: [{
        id: 'clear-api-token',
        label: 'Clear API Token',
        click: () => store.set('apiSecret', ''),
        enabled: true
      }]
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal('https:/filebase.com')
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

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

  mainWindow.loadURL(isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '..', 'build', 'index.html')}`)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // mainWindow.webContents.openDevTools()

  ipcMain.handle('setApiCredentials', (_, {
    key,
    secret,
    bucket
  }) => {
    store.set('apiKey', key)
    store.set('apiSecret', secret)
    store.set('apiBucket', bucket)
  })
  ipcMain.handle('setApiToken', (_, token) => store.set('apiSecret', token))
  ipcMain.handle('hasApiToken', () => Boolean(store.get('apiSecret')))

  const sendUploadProgress = p => mainWindow.webContents.send('uploadProgress', p)

  ipcMain.on('uploadFiles', async (event, paths) => {
    /** @type {string} */
    s3config.credentials.secretAccessKey = store.get('apiSecret')
    if (!s3config.credentials.secretAccessKey) {
      return sendUploadProgress({ error: 'missing secret' })
    }

    s3config.credentials.accessKeyId = store.get('apiKey')
    if (!s3config.credentials.accessKeyId) {
      return sendUploadProgress({ error: 'missing key' })
    }

    const bucketForUpload = store.get('apiBucket');
    if (!bucketForUpload) {
      return sendUploadProgress({ error: 'missing bucket' })
    }

    try {
      mainWindow.setProgressBar(2)
      sendUploadProgress({ statusText: 'Reading files...' })
      let totalBytes = 0
      const files = []
      let objectName;
      try {
        let pathPrefix
        // if a single directory, yield files without the directory name in them
        if (paths.length === 1 && (await fs.promises.stat(paths[0])).isDirectory) {
          pathPrefix = paths[0]
        }

        // set directory name as object name
        const filePath = paths[0];
        let pathToImport;
        if (!objectName) {
          pathToImport = path.dirname(filePath);
          objectName = path.basename(pathToImport);
          pathPrefix = pathToImport;
        }

        for await (const file of filesFromPath(pathToImport, { pathPrefix })) {
          files.push(file)
          totalBytes += file.size
          sendUploadProgress({ totalBytes, totalFiles: files.length })
        }
      } catch (err) {
        console.error(err)
        return sendUploadProgress({ error: `reading files: ${err.message}` })
      }

      sendUploadProgress({ statusText: 'Packing files...' })
      let cid, car, out
      try {
        ;({ cid, car, out } = files.length === 1 && paths[0].endsWith(files[0].name)
          ? await NFTStorage.encodeBlob(files[0])
          : await NFTStorage.encodeDirectory(files))
      } catch (err) {
        console.error(err)
        return sendUploadProgress({ error: `packing files: ${err.message}` })
      }

      try {
        let storedChunks = 0
        let storedBytes = 0.01
        sendUploadProgress({ statusText: 'Storing files...', storedChunks, storedBytes })
        try {
          sendUploadProgress({ bucket: bucketForUpload, objectName: objectName })
          const readableStream = stream.Readable.from(out)
          const parallelUploads3 = new Upload({
            client: new S3Client(s3config),
            params: {
              Bucket: bucketForUpload,
              Key: objectName,
              Body: readableStream,
              Metadata: {
                import: 'car',
                'expected-cid': cid.toString()
              },
            },
            leavePartsOnError: false, // optional manually handle dropped parts
          });

          parallelUploads3.on("httpUploadProgress", (progress) => {
            storedChunks++;
            storedBytes = progress.loaded;
            sendUploadProgress({ storedBytes, storedChunks })
            mainWindow.setProgressBar(storedBytes / totalBytes)
          });

          await parallelUploads3.done();
        } catch (err) {
          console.error(err);
          return sendUploadProgress({ error: `storing files: ${err.message}` })
        }
      } catch (err) {
        console.error(err)
        return sendUploadProgress({ error: `storing files: ${err.message}` })
      } finally {
        if (car && car.blockstore && car.blockstore.close) {
          car.blockstore.close()
        }
      }

      sendUploadProgress({ cid: cid.toString(), storedBytes: totalBytes, statusText: 'Done!' })
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
