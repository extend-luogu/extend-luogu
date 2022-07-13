<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    text: string
    modelValue: boolean
}>()

const emits = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const value = ref(props.modelValue)
</script>

<template>
    <span
        @click="emits('update:modelValue', (value = !value))"
        :class="{ active: value }"
        class="exlg-text-checkbox"
    >
        {{ text }}
    </span>
</template>

<style scoped>
.exlg-text-checkbox {
    cursor: pointer;
}

.active {
    color: var(--accent-color);
}
</style>
