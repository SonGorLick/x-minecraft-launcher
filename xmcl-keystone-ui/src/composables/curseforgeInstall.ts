import { clientCurseforgeV1 } from '@/util/clients'
import { File, FileIndex } from '@xmcl/curseforge'
import { CurseForgeServiceKey, ProjectType, Resource, ResourceServiceKey, getCurseforgeFileUri } from '@xmcl/runtime-api'
import { InjectionKey, Ref } from 'vue'
import { useCurseforgeProject } from './curseforge'
import { useDialog } from './dialog'
import { kInstallList } from './installList'
import { AddInstanceDialogKey } from './instanceAdd'
import { InstanceInstallDialog } from './instanceUpdate'
import { useNotifier } from './notifier'
import { useResourceUrisDiscovery } from './resources'
import { useService } from './service'

export const kCurseforgeInstall: InjectionKey<ReturnType<typeof useCurseforgeInstall>> = Symbol('CurseforgeInstall')

export function useCurseforgeInstall(modId: Ref<number>, files: Ref<Pick<File, 'modId' | 'id'>[]>, from: Ref<string | undefined>, type: Ref<ProjectType>, currentFileResource: Ref<Resource | undefined>) {
  const installList = inject(kInstallList, undefined)
  const { install: installResource } = useService(ResourceServiceKey)
  const { t } = useI18n()
  const { notify } = useNotifier()
  const { installFile } = useService(CurseForgeServiceKey)

  const { show: showAddInstanceDialog } = useDialog(AddInstanceDialogKey)
  const { show: showInstanceUpdateDialog } = useDialog(InstanceInstallDialog)
  const { resources } = useResourceUrisDiscovery(computed(() => files.value.map(getCurseforgeFileUri)))
  const isDownloaded = (file: Pick<File, 'modId' | 'id'>) => {
    return !!resources.value[getCurseforgeFileUri(file)]
  }
  const { project } = useCurseforgeProject(modId)
  async function install(input: File | FileIndex) {
    const file = 'modId' in input ? input : await clientCurseforgeV1.getModFile(modId.value, input.fileId)
    const resource = resources.value[getCurseforgeFileUri(file)]
    if (resource) {
      if (currentFileResource.value) {
        showInstanceUpdateDialog({
          type: 'curseforge',
          currentResource: currentFileResource.value,
          resource,
        })
      } else if (type.value === 'modpacks') {
        showAddInstanceDialog(resource.path)
      } else if (from.value) {
        installResource({ instancePath: from.value, resource }).then(() => {
          notify({ title: t('installResource.success', { file: resource.fileName }), level: 'success', full: true })
        }, (e) => {
          notify({
            title: t('installResource.fail', { file: resource.fileName }),
            level: 'error',
            body: e.toString(),
            full: true,
          })
        })
      }
    } else {
      if (project.value && type.value === 'mc-mods' && installList) {
        installList.add(file, {
          uri: file.modId.toString(),
          name: project.value.name,
          icon: project.value.logo.url,
        })
      } else {
        await installFile({ file, type: type.value })
      }
    }
  }
  return {
    install,
    resources,
    isDownloaded,
  }
}
