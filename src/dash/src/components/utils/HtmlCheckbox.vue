<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    modelValue: boolean
}>()

const emits = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const value = ref(props.modelValue)
</script>

<template>
    <span
        :class="{ active: value }"
        class="exlg-html-checkbox"
        @click="emits('update:modelValue', (value = !value))"
    >
        <span v-if="value">
            <slot name="active" />
        </span>
        <span v-else>
            <slot name="inactive" />
        </span>
        <slot />
    </span>
</template>

<style scoped>
.exlg-html-checkbox {
    user-select: none;
    cursor: pointer;
    color: var(--inactive-color);
    transition: color 0.3s;
}

.exlg-html-checkbox:hover {
    color: var(--secondary-color);
}

.exlg-html-checkbox.active {
    color: var(--primary-color);
}
</style>
