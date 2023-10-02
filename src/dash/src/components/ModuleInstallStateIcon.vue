<script lang="ts">
import { Icon } from '@iconify/vue'
import { type IconifyIcon } from '@iconify/types'

export type ModuleInstallState = {
    text?: string
    icon?: IconifyIcon
}
</script>

<script setup lang="ts">
defineProps<{
    state: ModuleInstallState
}>()
</script>

<template>
    <span
        :class="{
            'exlg-tooltip': state.icon !== undefined
        }"
        :data-exlg-tooltip="state.text"
    >
        <Icon
            v-if="state.icon !== undefined"
            :icon="state.icon"
            style="font-size: 18px; position: relative; top: 3px; color: var(--inactive-color);"
        />
        <span
            v-else
            style="display: inline-block; width: 18px;"
        />
    </span>
</template>
