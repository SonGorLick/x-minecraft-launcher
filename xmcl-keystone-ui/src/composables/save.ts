import { useService } from '@/composables'
import { Instance, InstanceSavesServiceKey } from '@xmcl/runtime-api'
import { Ref } from 'vue'
import { useState } from './syncableState'

export function useInstanceSaves(instance: Ref<Instance>) {
  const { watchSaves } = useService(InstanceSavesServiceKey)
  return useState(computed(() => `/instance-saves/${instance.value.path}`),
    () => watchSaves(instance.value.path))
}
