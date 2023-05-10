import { computed, Ref } from 'vue'
import { Frame as GameSetting } from '@xmcl/gamesetting'
import { EMPTY_VERSION, getExpectVersion, getResolvedVersion, Instance, InstanceData, InstanceIOServiceKey, InstanceOptionsServiceKey, InstanceServiceKey, InstanceVersionServiceKey, ResourceServiceKey, VersionServiceKey } from '@xmcl/runtime-api'
import { useServiceBusy, useSemaphore } from '@/composables/semaphore'
import { useService, useServiceOnly } from '@/composables/service'

export function useInstanceBase() {
  const { state } = useService(InstanceServiceKey)
  const path = computed(() => state.path)
  return { path }
}

export function useInstanceIsServer(i: Ref<Instance>) {
  return computed(() => i.value.server !== null)
}

/**
 * Use the general info of the instance
 */
export function useInstance() {
  const { state } = useService(InstanceServiceKey)

  const instance = computed(() => state.instance)
  const path = computed(() => state.path)
  return {
    path,
    instance,
    refreshing: computed(() => useSemaphore('instance').value !== 0),
  }
}

/**
 * Hook of a view of all instances & some deletion/selection functions
 */
export function useInstances() {
  const { state } = useService(InstanceServiceKey)
  return {
    instances: computed(() => state.instances),
  }
}

export function useInstanceServerEdit(server: Ref<InstanceData['server']>) {
  const result = computed({
    get: () => server.value ?? { host: '', port: undefined },
    set: (v) => { server.value = v },
  })
  return result
}

export function useInstanceVersionBase() {
  const { state } = useService(InstanceServiceKey)
  const minecraft = computed(() => state.instance.runtime.minecraft)
  const forge = computed(() => state.instance.runtime.forge)
  const fabricLoader = computed(() => state.instance.runtime.fabricLoader)
  const quiltLoader = computed(() => state.instance.runtime.quiltLoader)
  const yarn = computed(() => state.instance.runtime.yarn)
  return {
    minecraft,
    forge,
    fabricLoader,
    quiltLoader,
    yarn,
  }
}

/**
 * Use references of all the version info of this instance
 */
export function useInstanceVersion() {
  const { state: instanceVersionState } = useService(InstanceVersionServiceKey)

  const localVersion = computed(() => instanceVersionState.versionHeader || EMPTY_VERSION)
  const folder = computed(() => localVersion.value?.id || 'unknown')

  return {
    ...useInstanceVersionBase(),
    localVersion,
    folder,
  }
}
