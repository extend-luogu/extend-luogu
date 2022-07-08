<!-- eslint-disable vue/multi-word-component-names -->

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    promise?: Promise<any>
}>()

const state = ref<'pending' | 'fulfilled' | 'rejected'>('pending')
const result = ref()
const error = ref()

props.promise?.then(
    (r) => {
        result.value = r
        console.log(result)
        state.value = 'fulfilled'
    },
    (e) => {
        error.value = e
        state.value = 'rejected'
    }
)
</script>

<template>
    <slot v-if="state === 'pending'" name="first"></slot>
    <slot v-if="state === 'fulfilled'" name="then" :result="result"></slot>
    <slot v-if="state === 'rejected'" name="catch" :error="error"></slot>
</template>
