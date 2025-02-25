<template>
  <div
    class="overflow-auto lg:p-4 p-2 lg:px-8 px-4 w-full"
  >
    <div class="flex lg:flex-row md:flex-col flex-grow lg:gap-5 gap-2 h-full max-h-full overflow-auto">
      <div
        class="flex lg:flex-col lg:flex lg:gap-5 gap-2 flex-shrink lg:(w-80 max-w-80)"
      >
        <v-icon
          v-if="upstream"
          class="absolute z-9 lg:scale-400 scale-200 transform rotate-45"
        >
          attach_file
        </v-icon>
        <ErrorView
          :error="error"
          @refresh="refresh"
        />
        <CurseforgeProjectHeader
          :destination="destination"
          :from="destination"
          :project="project"
          :loading="refreshing && !project"
          @destination="destination = $event"
        />
        <CurseforgeProjectRecentFiles
          v-if="project"
          :project="project"
          :from="destination"
          :type="type"
          :upstream="upstream && upstream.upstream && upstream.upstream.type === 'curseforge-modpack' ? upstream.upstream : undefined"
        />
      </div>

      <div class="overflow-auto h-full flex-grow lg:gap-5 gap-2 flex flex-col">
        <CurseforgeUpstreamCard
          v-if="project && upstream && upstream.upstream && upstream.upstream.type === 'curseforge-modpack'"
          :mod-id="modId"
          :upstream="upstream.upstream"
          :game-version="upstream.minecraft"
          :files="project.latestFilesIndexes"
        />
        <v-card
          outlined
          class="flex flex-col overflow-auto flex-grow relative"
        >
          <v-tabs
            v-model="tab"
            slider-color="yellow"
            class="flex-grow-0"
          >
            <v-tab :key="0">
              {{ t("curseforge.project.description") }}
            </v-tab>
            <v-tab :key="1">
              {{ t("curseforge.project.files") }}
            </v-tab>
            <v-tab
              v-if="project && project.screenshots.length > 0"
              :key="2"
            >
              {{ t("curseforge.project.images") }}
            </v-tab>
          </v-tabs>
          <v-tabs-items
            v-model="tab"
            class="h-full"
          >
            <v-tab-item
              :key="0"
              class="h-full max-h-full overflow-auto"
            >
              <CurseforgeProjectDescription
                :project="modId"
              />
            </v-tab-item>
            <v-tab-item
              :key="1"
              class="h-full max-h-full overflow-auto"
            >
              <CurseforgeProjectFiles
                class="overflow-auto"
                :project="modId"
                :type="type"
                :from="destination"
                :game-versions="gameVersions"
                :mod-loaders="modLoaders"
                :upstream="upstream && upstream.upstream && upstream.upstream.type === 'curseforge-modpack' ? upstream.upstream : undefined"
              />
            </v-tab-item>
            <v-tab-item
              v-if="project && project.screenshots.length > 0"
              :key="2"
              class="h-full max-h-full overflow-auto"
            >
              <CurseforgeProjectImages
                v-if="project"
                :screenshots="project.screenshots"
                @image="imageDialog.show"
              />
            </v-tab-item>
          </v-tabs-items>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script lang=ts setup>
import ErrorView from '@/components/ErrorView.vue'
import { useService } from '@/composables'
import { kLatestCurseforgeResource, useLatestCurseforgeResource } from '@/composables/curseforgeResource'
import { kImageDialog } from '@/composables/imageDialog'
import { kUpstream } from '@/composables/instanceUpdate'
import { usePresence } from '@/composables/presence'
import { injection } from '@/util/inject'
import { File } from '@xmcl/curseforge'
import { InstanceServiceKey, ProjectType } from '@xmcl/runtime-api'
import { kCurseforgeFiles, useCurseforgeProject } from '../composables/curseforge'
import { kCurseforgeInstall, useCurseforgeInstall } from '../composables/curseforgeInstall'
import CurseforgeProjectDescription from './CurseforgeProjectDescription.vue'
import CurseforgeProjectFiles from './CurseforgeProjectFiles.vue'
import CurseforgeProjectHeader from './CurseforgeProjectHeader.vue'
import CurseforgeProjectImages from './CurseforgeProjectImages.vue'
import CurseforgeProjectRecentFiles from './CurseforgeProjectRecentFiles.vue'
import CurseforgeUpstreamCard from './CurseforgeUpstreamCard.vue'

const props = withDefaults(defineProps<{
  type: ProjectType
  id: string
  from: string
}>(), {
  type: 'mc-mods',
  id: '',
  from: '',
})

const upstream = inject(kUpstream, undefined)

// Curseforge Project
const modId = computed(() => Number.parseInt(props.id, 10))
const { project, refreshing, error, refresh } = useCurseforgeProject(modId)

// Curseforge files
const files = ref([] as File[])
provide(kCurseforgeFiles, files)

const allFiles = computed(() => {
  if (project.value) {
    return [...files.value.map(v => ({ id: v.id, modId: modId.value })), ...project.value.latestFilesIndexes.map(v => ({ id: v.fileId, modId: modId.value }))]
  }
  return files.value.map(v => ({ id: v.id, modId: modId.value }))
})

// The instance source
const { state: instanceState } = useService(InstanceServiceKey)
const destination = ref(props.from || instanceState.path)

// I18n
const { t } = useI18n()

if (upstream) {
  // Provide install function with upstream (home page)
  const latestFileIndex = computed(() => project.value?.latestFilesIndexes.find(f => f.gameVersion === upstream.value.minecraft))
  const current = useLatestCurseforgeResource(modId, latestFileIndex)
  provide(kLatestCurseforgeResource, current)
  provide(kCurseforgeInstall, useCurseforgeInstall(modId, allFiles, destination, computed(() => props.type), current.resource))
} else {
  // Common Curseforge install function
  provide(kCurseforgeInstall, useCurseforgeInstall(modId, allFiles, destination, computed(() => props.type), computed(() => undefined)))
}

const gameVersions = computed(() => {
  const index = project.value?.latestFilesIndexes
  if (!index) return []
  return index.map(i => i.gameVersion)
})
const modLoaders = computed(() => {
  const all = [
    'Any',
    'Forge',
    'Cauldron',
    'LiteLoader',
    'Fabric',
    'Quilt',
  ]
  const index = project.value?.latestFilesIndexes
  if (!index) return []
  const loaders = new Set(index.filter(i => i.modLoader).map(i => i.modLoader))
  return all.filter((a, i) => loaders.has(i))
})

// Image dialog
const imageDialog = injection(kImageDialog)

// Tab
const tab = ref(0)

if (!upstream) {
  usePresence(computed(() => t('presence.curseforgeProject', { name: project.value?.name || props.id })))
}
</script>

<style>
.v-image__image {
  background-repeat: no-repeat;
  background-position: center center;
}

.headline {
  text-align: center;
}
</style>
