<script setup lang="ts">
import { ref } from 'vue'
import { AllSourceItem } from '../utils'

const props = defineProps<{
    source: AllSourceItem
}>()

const emits = defineEmits<{
    (e: 'change', value: string): void
}>()

const selecting = ref(false)

function change(evt: Event) {
    emits('change', (evt.target as HTMLSelectElement).value)
}
</script>

<template>
    <select
        v-if="selecting"
        class="exlg-select"
        :value="source.selectedVersion"
        @change="change"
        @blur="selecting = false"
    >
        <option v-for="(version, i) of source.versions" :key="i">
            {{ version }}
        </option>
    </select>
    <span
        v-else
        class="module-version"
        title="选择版本"
        @click="selecting = true"
    >
        @{{ source.selectedVersion }}
    </span>
</template>

<style scoped>
.module-version {
    cursor: pointer;
}
</style>
