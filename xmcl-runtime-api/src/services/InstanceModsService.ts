import { Resource } from '../entities/resource'
import { ServiceKey, StatefulService } from './Service'

export interface InstallModsOptions {
  mods: Resource[]
  /**
   * The instance path to deploy. This will be the current path by default.
   */
  path: string
}

/**
 * The service manage all enable mods in mounted instance
 */
export class InstanceModsState {
  /**
   * The mods under instance folder
   */
  mods = [] as Resource[]
  /**
   * The mounted instance
   */
  instance = ''

  instanceModUpdates({ adds, remove }: { adds: Resource[]; remove: Resource[] }) {
    const toRemoved = new Set(remove.map(p => p.hash))
    const newMods = [...this.mods]

    for (const res of adds) {
      const existed = newMods.findIndex(m => m.hash === res.hash)
      if (existed !== -1) {
        newMods[existed] = res
        // do not remove if the mod is re-updated
        // usually this is rename case
        if (toRemoved.has(res.hash)) toRemoved.delete(res.hash)
      } else {
        newMods.push(res)
      }
    }

    if (remove.length > 0) {
      const filtered = newMods.filter(m => !toRemoved.has(m.hash))
      this.mods = filtered
    } else {
      this.mods = newMods
    }
  }

  instanceModUpdateExisted(r: Resource[]) {
    for (const res of r) {
      const existed = this.mods.findIndex(m => m.hash === res.hash)
      if (existed !== -1) {
        this.mods[existed] = { ...res, path: this.mods[existed].path }
      }
    }
  }

  instanceModRemove(mods: Resource[]) {
    const toRemoved = new Set(mods.map(p => p.hash))
    this.mods = this.mods.filter(m => !toRemoved.has(m.hash))
  }
}

/**
 * Provide the abilities to import/export mods files to instance
 */
export interface InstanceModsService {
  /**
   * Read all mods under the current instance
   */
  watch(instancePath: string): Promise<InstanceModsState>
  /**
   * Show instance /mods dictionary
   * @param instancePath The instance path
   */
  showDirectory(instancePath: string): Promise<void>

  enable(options: InstallModsOptions): Promise<void>
  /**
   * Mark a mod disabled
   */
  disable(options: InstallModsOptions): Promise<void>
  /**
   * Install certain mods to the instance.
   * @param options The install options
   */
  install(options: InstallModsOptions): Promise<void>
  /**
   * Uninstall certain mods to the instance.
   * @param options The uninstall options
   */
  uninstall(options: InstallModsOptions): Promise<void>
}

export const InstanceModsServiceKey: ServiceKey<InstanceModsService> = 'InstanceModsService'
