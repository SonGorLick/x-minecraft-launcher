import { InstanceResourcePacksService as IInstanceResourcePacksService, InstanceResourcePacksServiceKey, isResourcePackResource, packFormatVersionRange, ResourceDomain } from '@xmcl/runtime-api'
import { existsSync } from 'fs'
import { ensureDir } from 'fs-extra/esm'
import { lstat, readdir, readlink, rename, rm, unlink } from 'fs/promises'
import { join } from 'path'
import LauncherApp from '../app/LauncherApp'
import { LauncherAppKey } from '../app/utils'
import { isSystemError } from '../util/error'
import { createSymbolicLink, ENOENT_ERROR, linkWithTimeoutOrCopy } from '../util/fs'
import { Inject } from '../util/objectRegistry'
import { DiagnoseService } from './DiagnoseService'
import { InstanceOptionsService } from './InstanceOptionsService'
import { InstanceService } from './InstanceService'
import { ResourceService } from './ResourceService'
import { AbstractService, ExposeServiceKey, Singleton } from './Service'

/**
 * Provide the abilities to import resource pack and resource packs files to instance
 */
@ExposeServiceKey(InstanceResourcePacksServiceKey)
export class InstanceResourcePackService extends AbstractService implements IInstanceResourcePacksService {
  private active: string | undefined
  private linked = false

  constructor(@Inject(LauncherAppKey) app: LauncherApp,
    @Inject(ResourceService) private resourceService: ResourceService,
    @Inject(InstanceService) private instanceService: InstanceService,
    @Inject(InstanceOptionsService) private gameSettingService: InstanceOptionsService,
    @Inject(DiagnoseService) private diagnoseService: DiagnoseService,
  ) {
    super(app)
    this.storeManager.subscribe('instanceGameSettingsLoad', async (payload) => {
      if (payload.resourcePacks && this.active && !this.instanceService.isUnderManaged(this.active)) {
        for (const pack of payload.resourcePacks.filter(v => v !== 'vanilla')) {
          const fileName = pack.startsWith('file/') ? pack.substring('file/'.length) : pack
          const existedResource = await this.resourceService.getResourceUnder({ domain: ResourceDomain.ResourcePacks, fileName })
          const localFilePath = join(this.active, fileName)
          if (!existsSync(localFilePath)) {
            if (existedResource) {
              linkWithTimeoutOrCopy(existedResource.path, localFilePath)
            }
          }
        }
      }
    }).subscribe('instanceSelect', (instancePath) => {
      this.link(instancePath).catch((e) => {
        // TODO: decorate error
        const err = new Error(`Fail to link instance ${instancePath} resource pack!`, { cause: e })
        this.error(err)
        this.emit('error', err)
      })
    }).subscribe('instanceGameSettingsLoad', async (payload) => {
      if ('resourcePacks' in payload) {
        await this.diagnoseResourcePacks()
      }
    })

    this.resourceService.registerInstaller(ResourceDomain.ResourcePacks, async (resource, path) => {
      gameSettingService.editGameSetting({

      })
    })

    // this.storeManager.subscribe('resource', (r) => {
    //   if (!this.active) return
    //   const existed = this.activeResourcePacks.find(p => p.hash === r.hash)
    //   if (!existed) {
    //     linkWithTimeoutOrCopy(r.path, join(this.active, basename(r.path)))
    //   }
    // })
    // this.storeManager.subscribe('resources', (rs) => {
    //   if (!this.active) return
    //   for (const r of rs) {
    //     const existed = this.activeResourcePacks.find(p => p.hash === r.hash)
    //     if (!existed) {
    //       linkWithTimeoutOrCopy(r.path, join(this.active, basename(r.path)))
    //     } else {
    //       if (basename(existed.path, r.ext) !== r.fileName) {
    //         rename(existed.path, join(dirname(existed.path), r.fileName + r.ext))
    //       }
    //     }
    //   }
    // })
    // this.storeManager.subscribe('resourcesRemove', (rs) => {
    //   if (!this.active) return
    //   for (const r of rs) {
    //     const existed = this.activeResourcePacks.find(p => p.hash === r.hash)
    //     if (existed) {
    //       unlink(existed.path)
    //     }
    //   }
    // })
  }

  // private watcher: FSWatcher | undefined
  // private activeResourcePacks: AnyPersistedResource[] = []

  @Singleton()
  async diagnoseResourcePacks() {
    // this.up('diagnose')
    // try {
    //   const report: Partial<IssueReport> = {}
    //   this.log('Diagnose resource packs')
    //   const { runtime: version } = this.instanceService.state.instance
    //   const resourcePacks = this.gameSettingService.state.options.resourcePacks
    //   const resources = resourcePacks.map((name) => this.resourceService.state.resourcepacks.find((pack) => `file/${pack.name}${pack.ext}` === name))

    //   const mcversion = version.minecraft
    //   const resolvedMcVersion = parseVersion(mcversion)

    //   const tree: Pick<IssueReport, 'incompatibleResourcePack'> = {
    //     incompatibleResourcePack: [],
    //   }

    //   const packFormatMapping = this.packVersionToVersionRange
    //   for (const pack of resources) {
    //     if (!pack) continue
    //     const metadata = pack.metadata as PackMeta.Pack
    //     if (metadata.pack_format in packFormatMapping) {
    //       const acceptVersion = packFormatMapping[metadata.pack_format]
    //       const range = VersionRange.createFromVersionSpec(acceptVersion)
    //       if (range && !range.containsVersion(resolvedMcVersion)) {
    //         tree.incompatibleResourcePack.push({ name: pack.name, accepted: acceptVersion, actual: mcversion })
    //       }
    //     }
    //   }

    //   Object.assign(report, tree)
    //   this.diagnoseService.report(report)
    // } finally {
    //   this.down('diagnose')
    // }
  }

  // async dispose(): Promise<void> {
  //   this.watcher?.close()
  //   this.active = undefined
  //   this.activeResourcePacks = []
  // }

  // private async watchUnmanagedInstance(path: string) {
  //   this.watcher = watch(path, (event, name) => {
  //     if (name.startsWith('.')) return
  //     const filePath = name
  //     if (event === 'update') {
  //       this.resourceService.resolveResource({ path: filePath, type: 'resourcepack' }).then(([resource, icon]) => {
  //         if (isResourcePackResource(resource)) {
  //           this.log(`Instance resourcepack add ${filePath}`)
  //         } else {
  //           this.warn(`Non resourcepack resource added in /resourcepacks directory! ${filePath}`)
  //         }
  //         if (resource.fileType === 'directory') {
  //           // ignore directory
  //           return
  //         }
  //         if (!isPersistedResource(resource)) {
  //           if (resource.fileType !== 'directory' && resource.type === ResourceType.Unknown) {
  //             this.log(`Skip to import unknown directory to /resourcepacks! ${filePath}`)
  //             return
  //           }
  //           this.resourceService.importParsedResource({ path: filePath }, resource, icon).then((res) => {
  //             this.activeResourcePacks.push({ ...res, path: resource.path })
  //           }, (e) => {
  //             this.activeResourcePacks.push(resource)
  //             this.warn(`Fail to persist resource in /resourcepacks directory! ${filePath}`)
  //             this.warn(e)
  //           })
  //           this.log(`Found new resource in /resourcepacks directory! ${filePath}`)
  //         } else {
  //           this.activeResourcePacks.push(resource)
  //         }
  //       })
  //     } else {
  //       const target = this.activeResourcePacks.find(r => r.path === filePath)
  //       if (target) {
  //         this.log(`Instance resourcepack remove ${filePath}`)
  //         const i = this.activeResourcePacks.findIndex(r => r.hash === target.hash)
  //         this.activeResourcePacks.splice(i, 1)
  //       } else {
  //         this.warn(`Cannot remove the resourcepack ${filePath} as it's not found in memory cache!`)
  //       }
  //     }
  //   })
  // }

  async ensureResourcePacks() {
    if (!this.active) return
    if (this.linked) return
    const promises: Promise<void>[] = []
    for (let fileName of this.gameSettingService.state.options.resourcePacks) {
      if (fileName === 'vanilla') {
        continue
      }
      fileName = fileName.startsWith('file/') ? fileName.slice(5) : fileName
      const src = this.getPath(ResourceDomain.ResourcePacks, fileName)
      const dest = join(this.active, ResourceDomain.ResourcePacks, fileName)
      if (!existsSync(dest)) {
        promises.push(linkWithTimeoutOrCopy(src, dest).catch((e) => this.error(e)))
      }
    }
    await Promise.all(promises)
  }

  @Singleton(p => p)
  async link(instancePath: string = this.instanceService.state.path): Promise<void> {
    await this.resourceService.whenReady(ResourceDomain.ResourcePacks)
    const destPath = join(instancePath, 'resourcepacks')
    const srcPath = this.getPath('resourcepacks')
    const stat = await lstat(destPath).catch((e) => {
      if (isSystemError(e) && e.code === ENOENT_ERROR) {
        return
      }
      throw e
    })
    this.active = destPath
    await this.resourceService.whenReady(ResourceDomain.ResourcePacks)
    await this.dispose()
    const scan = async () => {
      const files = await readdir(destPath)

      this.log(`Import resourcepacks directories while linking: ${instancePath}`)
      await Promise.all(files.map(f => join(destPath, f)).map(async (filePath) => {
        const [resource] = await this.resourceService.importResources([{ path: filePath, domain: ResourceDomain.ResourcePacks }])
        if (isResourcePackResource(resource)) {
          this.log(`Add resource pack ${filePath}`)
        } else {
          this.warn(`Non resource pack resource added in /resourcepacks directory! ${filePath}`)
        }
      }))
    }
    this.log(`Linking the resourcepacks at domain to ${instancePath}`)
    if (stat) {
      if (stat.isSymbolicLink()) {
        if (await readlink(destPath) === srcPath) {
          this.log(`Skip linking the resourcepacks at domain as it already linked: ${instancePath}`)
          this.linked = true
          return
        } else {
          this.log(`Relink the resourcepacks domain: ${instancePath}`)
          await unlink(destPath)
        }
      } else {
        // Keep the dictionary and transport all files into it
        if (stat.isDirectory()) {
          // Import all directory content
          await scan()
          this.linked = false
        } else {
          await rename(destPath, `${destPath}_backup`)
        }
      }
    } else if (!this.instanceService.isUnderManaged(instancePath)) {
      // do not link if this is not an managed instance
      await ensureDir(destPath)
      this.linked = false
      return
    }

    try {
      await createSymbolicLink(srcPath, destPath, this)
      this.linked = true
    } catch (e) {
      this.error(e as Error)
      this.linked = false
    }
  }

  async showDirectory(): Promise<void> {
    await this.app.shell.openDirectory(join(this.instanceService.state.path, 'resourcepacks'))
  }
}
