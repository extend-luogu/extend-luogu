<script lang="ts">
export type ModuleInstallState = {
    text?: string
    tooltip?: string
    class?: string
}
</script>

<script setup lang="ts">
defineProps<{
    state: ModuleInstallState
}>()
</script>

<template>
    <span
        class="module-install-state"
        :class="state.class?.split(' ')"
        :data-exlg-tooltip="state.tooltip"
    >
        {{ state.text ? `[${state.text}]` : '' }}
    </span>
</template>
