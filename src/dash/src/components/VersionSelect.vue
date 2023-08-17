<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { AllSourceItem, SourceVersion } from '@/utils'

const props = defineProps<{
    source: AllSourceItem
    modelValue: SourceVersion
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: SourceVersion): void
}>()

const selecting = ref(false)
const select = ref<HTMLSelectElement | void>()

const selectedVersion = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

function startSelecting() {
    selecting.value = true
    nextTick(() => select.value!.focus())
}
</script>

<template>
    <span
        v-if="selecting"
        class="module-version-select"
    >
        <span>@</span><select
            ref="select"
            v-model="selectedVersion"
            class="exlg-select"
            @blur="selecting = false"
        >
            <option
                v-for="(version, i) of source.versions"
                :key="i"
                :value="version"
            >
                {{ version.version }}
            </option>
        </select>
    </span>
    <span
        v-else
        class="module-version"
        title="选择版本"
        @click="startSelecting"
    >
        @{{ source.selectedVersion.version }}
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
