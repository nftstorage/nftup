require('dotenv').config()
const { notarize } = require('electron-notarize')

exports.default = async function notarizing (context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return

  if (!process.env.APPLEID || !process.env.APPLEIDPASS) {
    return console.warn('skipping notarization: missing APPLEID and APPLEIDPASS environment variables')
  }

  const appName = context.packager.appInfo.productFilename

  return await notarize({
    tool: 'notarytool',
    appBundleId: 'storage.nft.nftup',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    teamId: process.env.TEAMID
  })
}
