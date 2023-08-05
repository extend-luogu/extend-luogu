<!-- eslint-disable vue/multi-word-component-names -->

<script setup lang="ts" generic="T">
import { ref } from 'vue'

const props = defineProps<{
    promise?: Promise<T>
}>()

const state = ref<'pending' | 'fulfilled' | 'rejected'>('pending')
const result = ref<T>()
const error = ref()

props.promise?.then(
    (r) => {
        result.value = r
        state.value = 'fulfilled'
    },
    (e) => {
        error.value = e
        state.value = 'rejected'
    }
)
</script>

<template>
    <slot
        v-if="state === 'pending'"
        name="first"
    />
    <slot
        v-if="state === 'fulfilled'"
        name="then"
        :result="(result as T)"
    />
    <slot
        v-if="state === 'rejected'"
        name="catch"
        :error="error"
    />
</template>
