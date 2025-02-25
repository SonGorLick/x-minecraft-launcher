<template>
  <v-list
    three-line
    subheader
    style="background: transparent; width: 100%"
  >
    <v-list-item>
      <v-layout
        row
        class="gap-4 max-w-full"
      >
        <v-flex d-flex>
          <v-select
            v-model="content.java"
            outlined
            class="java-select"
            :label="t('java.location')"
            :placeholder="t('java.allocatedLong')"
            :items="javaItems"
            :menu-props="{ auto: true, overflowY: true }"
            hide-details
            required
          />
        </v-flex>
        <v-flex
          d-flex
          xs2
        >
          <v-text-field
            v-model="content.minMemory"
            outlined
            hide-details
            type="number"
            :label="t('java.minMemory')"
            :placeholder="t('java.allocatedShort')"
            required
          />
        </v-flex>
        <v-flex
          d-flex
          xs2
        >
          <v-text-field
            v-model="content.maxMemory"
            outlined
            hide-details
            type="number"
            :label="t('java.maxMemory')"
            :placeholder="t('java.allocatedShort')"
            required
          />
        </v-flex>
      </v-layout>
    </v-list-item>
    <v-list-item v-if="showMinecraft">
      <v-list-item-action class="self-center">
        <img
          :src="'image://builtin/minecraft'"
          width="40"
        >
        <!-- <v-checkbox /> -->
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>
          {{
            t('minecraftVersion.name')
          }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{
            t('instance.versionHint')
          }}
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <VersionMenu
          :is-clearable="false"
          :items="minecraftItems"
          :has-snapshot="true"
          :empty-text="t('minecraftVersion.empty')"
          :snapshot.sync="showAlpha"
          :snapshot-tooltip="t('minecraftVersion.showAlpha')"
          :refreshing="refreshingMinecraft"
          @select="onSelectMinecraft"
        >
          <template #default="{ on }">
            <v-text-field
              v-model="content.runtime.minecraft"
              outlined
              append-icon="arrow_drop_down"
              persistent-hint
              hide-details
              :readonly="true"
              @click:append="on.click($event);"
              v-on="on"
            />
          </template>
        </VersionMenu>
      </v-list-item-action>
    </v-list-item>
    <v-list-item>
      <v-list-item-action class="self-center">
        <img
          :src="'image://builtin/forge'"
          width="40"
        >
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>
          {{
            t('forgeVersion.name')
          }}
        </v-list-item-title>
        <v-list-item-subtitle>
          <a
            target="browser"
            href="https://github.com/MinecraftForge/MinecraftForge"
          >https://github.com/MinecraftForge/MinecraftForge</a>
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <VersionMenu
          :is-clearable="true"
          :items="forgeItems"
          :clear-text="t('forgeVersion.disable')"
          :empty-text="t('forgeVersion.empty')"
          :has-snapshot="true"
          :snapshot.sync="canShowBuggy"
          :snapshot-tooltip="t('fabricVersion.showSnapshot')"
          :refreshing="refreshingForge"
          @select="onSelectForge"
        >
          <template #default="{ on }">
            <v-text-field
              :value="content.runtime.forge"
              outlined
              append-icon="arrow_drop_down"
              hide-details
              persistent-hint
              :readonly="true"
              @click:append="on.click($event);"
              @click="refreshForge()"
              v-on="on"
            />
          </template>
        </VersionMenu>
      </v-list-item-action>
    </v-list-item>
    <v-list-item>
      <v-list-item-action class="self-center">
        <img
          :src="'image://builtin/fabric'"
          width="40"
        >
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Fabric</v-list-item-title>
        <v-list-item-subtitle>
          <a
            target="browser"
            href="https://fabricmc.net/"
          >https://fabricmc.net/</a>
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <VersionMenu
          :is-clearable="true"
          :items="fabricItems"
          :clear-text="t('fabricVersion.disable')"
          :empty-text="t('fabricVersion.empty')"
          :has-snapshot="true"
          :snapshot.sync="showStableOnly"
          :snapshot-tooltip="t('fabricVersion.showSnapshot')"
          :refreshing="refreshingFabric"
          @select="onSelectFabric"
        >
          <template #default="{ on }">
            <v-text-field
              :value="content.runtime.fabricLoader"
              outlined
              hide-details
              append-icon="arrow_drop_down"
              persistent-hint
              :readonly="true"
              @click:append="on.click($event);"
              v-on="on"
            />
          </template>
        </VersionMenu>
      </v-list-item-action>
    </v-list-item>
    <v-list-item>
      <v-list-item-action class="self-center">
        <img
          :src="'image://builtin/quilt'"
          style="width: 40px"
        >
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Quilt</v-list-item-title>
        <v-list-item-subtitle>
          <a
            target="browser"
            href="https://quiltmc.org/"
          >https://quiltmc.org/</a>
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <VersionMenu
          :is-clearable="true"
          :items="quiltItems"
          :clear-text="t('quiltVersion.disable')"
          :empty-text="t('quiltVersion.empty')"
          :refreshing="refreshingQuilt"
          @select="onSelectQuilt"
        >
          <template #default="{ on }">
            <v-text-field
              :value="content.runtime.quiltLoader"
              outlined
              hide-details
              append-icon="arrow_drop_down"
              persistent-hint
              :readonly="true"
              @click:append="on.click($event);"
              @click="refreshQuilt()"
              v-on="on"
            />
          </template>
        </VersionMenu>
      </v-list-item-action>
    </v-list-item>
    <v-list-item>
      <v-list-item-action class="self-center">
        <img
          :src="'image://builtin/optifine'"
          width="40px"
        >
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Optifine</v-list-item-title>
        <v-list-item-subtitle>
          <a
            target="browser"
            href="https://www.optifine.net/home"
          >https://www.optifine.net/home</a>
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <VersionMenu
          :is-clearable="true"
          :items="optifineItems"
          :clear-text="t('optifineVersion.disable')"
          :empty-text="t('optifineVersion.empty')"
          :refreshing="refreshingOptifine"
          @select="onSelectOptifine"
        >
          <template #default="{ on }">
            <v-text-field
              :value="content.runtime.optifine"
              outlined
              hide-details
              append-icon="arrow_drop_down"
              persistent-hint
              :readonly="true"
              @click:append="on.click($event);"
              v-on="on"
            />
          </template>
        </VersionMenu>
      </v-list-item-action>
    </v-list-item>
    <v-list-item>
      <v-list-item-action class="self-center">
        <img
          :src="'image://builtin/craftingTable'"
          width="40px"
        >
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title>{{ t('localVersion.title', 1) }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ t('localVersion.hint') }}
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <VersionMenu
          :items="localItems"
          :empty-text="t('localVersion.empty')"
          @select="onSelectLocalVersion"
        >
          <template #default="{ on }">
            <v-text-field
              v-model="content.version"
              outlined
              hide-details
              :placeholder="t('localVersion.auto')"
              append-icon="arrow_drop_down"
              persistent-hint
              :readonly="true"
              @click:append="on.click($event);"
              v-on="on"
            />
          </template>
        </VersionMenu>
      </v-list-item-action>
    </v-list-item>
  </v-list>
</template>

<script lang=ts setup>
import { useLocalVersions } from '@/composables/version'
import { CreateOptionKey } from '../composables/instanceCreation'
import { useJava } from '../composables/java'
import { VersionMenuItem, useFabricVersionList, useForgeVersionList, useMinecraftVersionList, useOptifineVersionList, useQuiltVersionList } from '../composables/versionList'
import VersionMenu from './VersionMenu.vue'

import { injection } from '@/util/inject'

defineProps({
  valid: {
    type: Boolean,
    required: true,
  },
  showMinecraft: {
    type: Boolean,
    default: true,
  },
})

const content = injection(CreateOptionKey)
const minecraft = computed(() => content.runtime.minecraft)
const { t } = useI18n()
const { items: minecraftItems, showAlpha, refreshing: refreshingMinecraft, release } = useMinecraftVersionList(minecraft)
const { items: forgeItems, canShowBuggy, recommendedOnly, refresh: refreshForge, refreshing: refreshingForge } = useForgeVersionList(minecraft, computed(() => content.runtime.forge ?? ''))
const { items: fabricItems, showStableOnly, refreshing: refreshingFabric } = useFabricVersionList(minecraft, computed(() => content.runtime.fabricLoader ?? ''))
const { items: quiltItems, refresh: refreshQuilt, refreshing: refreshingQuilt } = useQuiltVersionList(minecraft, computed(() => content.runtime.quiltLoader ?? ''))
const { items: optifineItems, refreshing: refreshingOptifine } = useOptifineVersionList(minecraft, computed(() => content.runtime.forge ?? ''), computed(() => content.runtime.optifine ?? ''))
const { localVersions } = useLocalVersions()

recommendedOnly.value = false

watch(release, (r) => {
  if (!content.runtime.minecraft && r) {
    content.runtime.minecraft = r.id ?? ''
  }
})

const { all: javas } = useJava()
const javaItems = computed(() => javas.value.map(java => ({
  text: `Java ${java.majorVersion} (${java.version})`,
  value: java.path,
})))
const localItems = computed(() => {
  return localVersions.value.map(ver => {
    const result: VersionMenuItem = {
      name: ver.id,
      tag: ver.minecraft,
    }
    return result
  })
})

function onSelectLocalVersion(version: string) {
  if (content.runtime) {
    content.version = version
    const runtime = content.runtime
    const v = localVersions.value.find(ver => ver.id === version)!
    runtime.minecraft = v.minecraft
    runtime.forge = v.forge
    runtime.fabricLoader = v.fabric
    runtime.quiltLoader = v.quilt
    runtime.optifine = v.fabric
  }
}
function onSelectForge(version: string) {
  if (content?.runtime) {
    const runtime = content.runtime
    runtime.forge = version
    if (version) {
      runtime.fabricLoader = ''
      runtime.quiltLoader = ''
      runtime.optifine = ''
      content.version = ''
    }
  }
}
function onSelectFabric(version: string) {
  if (content?.runtime) {
    const runtime = content.runtime
    if (version) {
      runtime.forge = ''
      runtime.quiltLoader = ''
      runtime.optifine = ''
      content.version = ''
    }
    runtime.fabricLoader = version
  }
}
function onSelectQuilt(version: string) {
  if (content.runtime) {
    const runtime = content.runtime
    if (version) {
      runtime.forge = runtime.fabricLoader = ''
      runtime.quiltLoader = version
      runtime.optifine = ''
      content.version = ''
    }
  }
}
function onSelectOptifine(version: string) {
  if (content.runtime) {
    const runtime = content.runtime
    if (version) {
      runtime.quiltLoader = runtime.fabricLoader = ''
      runtime.optifine = version
      content.version = ''
    }
  }
}
function onSelectMinecraft(version: string) {
  if (content?.runtime) {
    const runtime = content.runtime
    runtime.minecraft = version
    runtime.forge = ''
    runtime.fabricLoader = ''
    content.version = ''
  }
}
</script>

<style>
.java-select .v-select__selection {
  white-space: nowrap;
  overflow-x: hidden;
  overflow-y: hidden;

  max-width: 240px;
}
</style>
