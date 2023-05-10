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
