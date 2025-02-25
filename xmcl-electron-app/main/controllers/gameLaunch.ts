import Controller from '@/Controller'
import { BaseService, InstanceService, LaunchService } from '@xmcl/runtime'
import { ControllerPlugin } from './plugin'

/**
 * Control the behavior of window during game launch/exit, and also redirect the minecraft stdout/stderr during game
 */
export const gameLaunch: ControllerPlugin = function (this: Controller) {
  this.app.once('engine-ready', () => {
    this.app.serviceManager.get(LaunchService).on('minecraft-window-ready', () => {
      const instance = this.app.serviceManager.get(InstanceService).state.instance
      if (!instance) {
        this.app.warn('Cannot find active instance while Minecraft window ready! Perhaps something strange happened?')
        return
      }
      if (this.mainWin && this.mainWin.isVisible()) {
        this.mainWin.webContents.send('minecraft-window-ready')

        const hideLauncher = instance.hideLauncher ?? this.app.serviceManager.get(BaseService).state.globalHideLauncher
        if (hideLauncher) {
          this.mainWin.hide()
        }
      }
    }).on('minecraft-start', () => {
      const instance = this.app.serviceManager.get(InstanceService).state.instance
      if (!instance) {
        this.app.warn('Cannot find active instance while Minecraft window ready! Perhaps something strange happened?')
        return
      }
      const showLog = instance.showLog ?? this.app.serviceManager.get(BaseService).state.globalShowLog
      if (this.loggerWin === undefined && showLog) {
        this.createMonitorWindow()
      }
    }).on('minecraft-exit', (status) => {
      const instance = this.app.serviceManager.get(InstanceService).state.instance
      if (!instance) {
        this.app.warn('Cannot find active instance while Minecraft exit! Perhaps something strange happened?')
        return
      }
      const hideLauncher = instance.hideLauncher ?? this.app.serviceManager.get(BaseService).state.globalHideLauncher
      if (hideLauncher) {
        if (this.mainWin) {
          this.mainWin.show()
        }
      }
      this.app.controller.broadcast('minecraft-exit', status)
      if (this.loggerWin) {
        const launchServ = this.app.serviceManager.get(LaunchService)
        if (launchServ.state.activeCount === 0) {
          this.loggerWin.close()
          this.loggerWin = undefined
        }
      }
    })
  })
}
