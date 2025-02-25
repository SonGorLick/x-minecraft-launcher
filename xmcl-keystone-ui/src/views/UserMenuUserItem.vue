<template>
  <v-list-item
    v-if="user"
    :link="link"
  >
    <v-list-item-avatar>
      <v-img
        v-if="user.avatar"
        :src="user.avatar"
      />
      <PlayerAvatar
        v-else
        :src="user.profiles[user.selectedProfile]?.textures.SKIN.url"
        :dimension="48"
      />
    </v-list-item-avatar>
    <v-list-item-content>
      <v-list-item-title>
        {{ user.username }}
      </v-list-item-title>
      <v-list-item-subtitle>
        <v-icon
          small
          color="blue"
        >
          verified
        </v-icon>
        <span>
          {{ user.authService.toUpperCase() }}
          ({{ t('user.authService') }})
        </span>
      </v-list-item-subtitle>
      <v-list-item-subtitle>
        <v-icon
          small
          :color="expired ? 'red': 'primary'"
        >
          {{ expired ? 'cancel': 'check_circle' }}
        </v-icon>
        <span
          v-if="user.authService !== 'offline'"
          :style="{ color: getColorCode(expired ? 'red': 'primary') }"
        >
          {{ expired ? t('user.tokenExpired'): t('user.tokenValidUntil') }}
          {{ new Date(user.expiredAt).toLocaleString() }}
        </span>
        <template v-else>
          <span
            :style="{ color: getColorCode(expired ? 'red': 'primary') }"
          >
            {{ expired ? t('user.tokenExpired'): t('user.tokenValidUntil') }}
          </span>
          <v-icon
            small
            :color="expired ? 'red': 'primary'"
          >
            all_inclusive
          </v-icon>
        </template>
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action v-if="controls">
      <v-btn
        text
        :loading="refreshing && !hoverRefresh"
        @mouseenter="hoverRefresh = true"
        @mouseleave="hoverRefresh = false"
        @click="refreshing ? emit('abort-refresh') : emit('refresh')"
      >
        <template v-if="hoverRefresh && refreshing">
          <v-icon
            color="red"
            class="xl:(ml-[4px] mr-[8px]) m-0"
          >
            close
          </v-icon>
        </template>
        <template v-else>
          <v-icon
            class="xl:(ml-[4px] mr-[8px]) m-0"
          >
            refresh
          </v-icon>
          <span class="xl:inline hidden">
            {{ t('user.refreshAccount') }}
          </span>
        </template>
      </v-btn>
    </v-list-item-action>
    <v-list-item-action v-if="controls">
      <v-btn
        text
        color="red"
        :disabled="refreshing"
        @click="emit('remove')"
      >
        <v-icon
          left
          class="lg:(ml-[4px] mr-[8px]) m-0"
        >
          delete
        </v-icon>
        <span class="lg:inline hidden">
          {{ t('userAccount.removeTitle') }}
        </span>
      </v-btn>
    </v-list-item-action>
  </v-list-item>
</template>
<script lang="ts" setup>
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import { useUserExpired } from '@/composables/user'
import { useVuetifyColor } from '@/composables/vuetify'
import { UserProfile } from '@xmcl/runtime-api'

const props = defineProps<{
  user: UserProfile
  link?: boolean
  controls?: boolean
  refreshing?: boolean
}>()

const hoverRefresh = ref(false)
const emit = defineEmits(['remove', 'refresh', 'abort-refresh'])
const { t } = useI18n()
const { getColorCode } = useVuetifyColor()
const expired = useUserExpired(computed(() => props.user))
</script>
