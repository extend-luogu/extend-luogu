<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { AllSourceItem } from '../utils'

const props = defineProps<{
    source: AllSourceItem
}>()

const emits = defineEmits<{
    (e: 'change', value: string): void
}>()

const selecting = ref(false)
const select = ref<HTMLSelectElement | void>()

function change(evt: Event) {
    emits('change', (evt.target as HTMLSelectElement).value)
}

function startSelecting() {
    selecting.value = true
    // nextTick(() => select.value!.focus())
}
</script>

<template>
    <span v-if="selecting" class="module-version-select">
        <span>@</span
        ><select
            ref="select"
            class="exlg-select"
            :value="source.selectedVersion"
            @change="change"
            @blur="selecting = false"
        >
            <option v-for="(version, i) of source.versions" :key="i">
                {{ version }}
            </option>
        </select>
    </span>
    <span
        v-else
        class="module-version"
        title="选择版本"
        @click="startSelecting"
    >
        @{{ source.selectedVersion }}
    </span>
</template>

<style scoped>
.module-version-select {
    color: var(--accent-color);
}
.module-version-select > span:first-child {
    position: relative;
}
.module-version-select > .exlg-select {
    margin-left: -4px;
    border: none;
    color: var(--accent-color) !important;
}
.module-version {
    cursor: pointer;
}
</style>
