import { useService, useServiceBusy, useServiceOnly } from '@/composables'
import { MinecraftVersion } from '@xmcl/installer'
import { InstallServiceKey, VersionServiceKey } from '@xmcl/runtime-api'
import useSWRV from 'swrv'
import { computed, reactive, Ref, toRefs } from 'vue'
import { kSWRVConfig } from './swrvConfig'

export function useVersions() {
  return useServiceOnly(VersionServiceKey, 'deleteVersion', 'refreshVersion', 'refreshVersions', 'showVersionDirectory', 'showVersionsDirectory')
}

export function useInstallService() {
  return useService(InstallServiceKey)
}

export function useVersionService() {
  return useService(VersionServiceKey)
}

export function useLocalVersions() {
  const { state } = useVersionService()
  const localVersions = computed(() => state.local)

  return {
    localVersions,
  }
}

export function useMinecraftVersions() {
  const { state } = useVersionService()
  const { getMinecraftVersionList } = useService(InstallServiceKey)
  const _refreshing = useServiceBusy(InstallServiceKey, 'getMinecraftVersionList')

  const { data, isValidating, mutate, error } = useSWRV('/minecraft-versions',
    () => getMinecraftVersionList(),
    inject(kSWRVConfig))

  const refreshing = computed(() => isValidating.value || _refreshing.value)

  const versions = computed(() => !data.value ? [] : data.value.versions)
  const release = computed(() => !data.value ? undefined : data.value.versions.find(v => v.id === data.value!.latest.release))
  const snapshot = computed(() => !data.value ? undefined : data.value.versions.find(v => v.id === data.value!.latest.snapshot))

  const installed = computed(() => {
    const localVersions: { [k: string]: string } = {}
    for (const ver of state.local) {
      if (!ver.forge && !ver.fabric && !ver.quilt && !ver.optifine) {
        localVersions[ver.minecraft] = ver.id
      }
    }
    return localVersions
  })

  return {
    error,
    installed,
    versions,
    refreshing,
    release,
    snapshot,
  }
}

export function useMinecraftVersionFilter(filterText: Ref<string>) {
  const data = reactive({
    acceptingRange: '',
    showAlpha: false,
  })

  function filter(v: MinecraftVersion) {
    if (!data.showAlpha && v.type !== 'release') return false
    // if (!isCompatible(data.acceptingRange, v.id)) return false;
    return v.id.indexOf(filterText.value) !== -1
  }

  return {
    ...toRefs(data),
    filter,
  }
}

export function useFabricVersions(minecraftVersion: Ref<string>) {
  const { getFabricVersionList } = useService(InstallServiceKey)
  const _refreshing = useServiceBusy(InstallServiceKey, 'getFabricVersionList')
  const { state } = useVersionService()

  const { data: allVersions, isValidating, mutate, error } = useSWRV(`/fabric-versions/${minecraftVersion.value}`,
    () => getFabricVersionList(),
    inject(kSWRVConfig))

  const versions = computed(() => {
    const all = allVersions.value
    if (!all) return []
    if (!all.yarns.some(v => v.gameVersion === minecraftVersion.value)) return []
    return all.loaders
  })
  const refreshing = computed(() => isValidating.value || _refreshing.value)

  const installed = computed(() => {
    const locals: { [k: string]: string } = {}
    for (const ver of state.local.filter(v => v.minecraft === minecraftVersion.value)) {
      if (ver.fabric) locals[ver.fabric] = ver.id
    }
    return locals
  })
  const getStatus = (version: string) => {
    return installed.value[`${minecraftVersion.value}-${version}`] ? 'local' : 'remote'
  }

  return {
    error,
    versions,
    installed,
    refreshing,
    getStatus,
  }
}

export function useQuiltVersions(minecraftVersion: Ref<string>) {
  const { getQuiltVersionList } = useService(InstallServiceKey)
  const _refreshing = useServiceBusy(InstallServiceKey, 'getQuiltVersionList')
  const { state } = useVersionService()

  const { data: versions, isValidating, mutate, error } = useSWRV(`/quilt-versions/${minecraftVersion.value}`,
    () => minecraftVersion.value ? getQuiltVersionList({ minecraftVersion: minecraftVersion.value }).then(v => v.map(markRaw)) : [],
    inject(kSWRVConfig))

  const refreshing = computed(() => isValidating.value || _refreshing.value)

  const installed = computed(() => {
    const locals: { [k: string]: string } = {}
    for (const ver of state.local.filter(v => v.minecraft === minecraftVersion.value)) {
      if (ver.quilt) locals[ver.quilt] = ver.id
    }
    return locals
  })

  return {
    error,
    installed,
    versions,
    refresh: mutate,
    refreshing,
  }
}

export function useForgeVersions(minecraftVersion: Ref<string>) {
  const { getForgeVersionList } = useInstallService()
  const { state } = useVersionService()
  const _refreshing = useServiceBusy(InstallServiceKey, 'getForgeVersionList')

  const { data: versions, isValidating, mutate, error } = useSWRV(`/forge-versions/${minecraftVersion.value}`,
    async () => {
      const version = minecraftVersion.value
      const result = await version ? getForgeVersionList({ minecraftVersion: version }).then(v => v.map(markRaw)) : []
      if (version !== minecraftVersion.value) {
        return []
      }
      return result
    },
    inject(kSWRVConfig))

  const refreshing = computed(() => isValidating.value || _refreshing.value)

  const recommended = computed(() => {
    const vers = versions.value
    if (!vers) return undefined
    return vers.find(v => v.type === 'recommended')
  })
  const latest = computed(() => {
    const vers = versions.value
    if (!vers) return undefined
    return vers.find(v => v.type === 'latest')
  })
  const installed = computed(() => {
    const localForgeVersion: { [k: string]: string } = {}
    for (const ver of state.local.filter(v => v.minecraft === minecraftVersion.value)) {
      const version = ver.forge
      localForgeVersion[version] = ver.id
      if (version) {
        const parsedVersion = version.split('-')
        if (parsedVersion.length === 3) {
          localForgeVersion[parsedVersion[1]] = ver.id
        } else if (parsedVersion.length === 2) {
          localForgeVersion[parsedVersion[1]] = ver.id
        } else if (parsedVersion.length === 1) {
          localForgeVersion[parsedVersion[0]] = ver.id
        } else {
          console.error(`Cannot resolve forge version ${ver.id}`)
        }
      }
    }
    return localForgeVersion
  })

  return {
    error,
    installed,
    versions,
    refresh: mutate,
    refreshing,
    recommended,
    latest,
  }
}

// export function useLiteloaderVersions(minecraftVersion: Ref<string>) {
//   const { getLiteloaderVersionList } = useInstallService()

//   const versions = ref([] as LiteloaderVersions)
//   const refreshing = useServiceBusy(InstallServiceKey, 'getLiteloaderVersionList')
//   onMounted(() => {
//     watch(minecraftVersion, () => {
//       if (!versions.value) {
//         getLiteloaderVersionList()
//       }
//     })
//   })

//   async function refresh() {
//     await getLiteloaderVersionList()
//   }

//   return {
//     versions,
//     refresh,
//     refreshing,
//   }
// }

export function useOptifineVersions(minecraftVersion: Ref<string>, forgeVersion: Ref<string>) {
  const { getOptifineVersionList } = useInstallService()
  const { state } = useVersionService()
  const _refreshing = useServiceBusy(InstallServiceKey, 'getOptifineVersionList')

  const { data: allVersions, isValidating, mutate, error } = useSWRV('/optifine-versions',
    () => minecraftVersion.value ? getOptifineVersionList().then(v => v.map(markRaw)) : [],
    inject(kSWRVConfig))

  const refreshing = computed(() => isValidating.value || _refreshing.value)

  const versions = computed(() => allVersions.value?.filter(v => v.mcversion === minecraftVersion.value) ?? [])

  const installed = computed(() => {
    const localVersions: { [k: string]: string } = {}
    for (const ver of state.local.filter(v => v.minecraft === minecraftVersion.value && (forgeVersion.value ? forgeVersion.value === v.forge : true))) {
      if (ver.optifine) {
        localVersions[ver.optifine] = ver.id
      }
    }
    return localVersions
  })

  return {
    error,
    installed,
    versions,
    refreshing,
  }
}
