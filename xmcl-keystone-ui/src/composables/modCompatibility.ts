import { injection } from '@/util/inject'
import { getModsCompatiblity, resolveDepsCompatible } from '@/util/modCompatible'
import { Ref } from 'vue'
import { kModsContext, ModItem } from './mod'

export function useModCompatibility(item: Ref<ModItem>) {
  const { runtime } = injection(kModsContext)
  const compatibility = computed(() => getModsCompatiblity(item.value.dependencies, runtime.value))
  const isCompatible = computed(() => resolveDepsCompatible(compatibility.value))

  return {
    compatibility,
    isCompatible,
  }
}
