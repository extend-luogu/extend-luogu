<script setup lang="ts">
import { ref, watch } from 'vue'
import { Schema, Storage } from '../../../core/types'

const props = defineProps<{
    schema: Schema
    storage?: Storage
}>()

const value = ref(props.storage!.get(props.schema.name))
watch(value, (newValue) => props.storage!.set(props.schema.name, newValue))

const inputAttr = () => {
    switch (props.schema.type) {
        case 'boolean':
            return {
                type: 'checkbox',
                className: 'exlg-checkbox'
            }
        case 'string':
            return {
                type: 'text',
                className: 'exlg-input'
            }
        case 'number':
            return {
                type: 'number',
                className: 'exlg-input'
            }
        default:
            return null
    }
}
</script>

<template>
    <input v-bind="inputAttr()" v-model="value" />
</template>
