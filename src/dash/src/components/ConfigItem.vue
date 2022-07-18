<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Schema, Storage } from '@core/types'

const props = defineProps<{
    name: string
    schema: Schema
    storage?: Storage
}>()

const type = computed(() => props.schema.type)

const value = ref(props.storage!.get(props.name))
watch(value, (newValue) => props.storage!.set(props.name, newValue))
</script>

<template>
    <input
        v-if="type === 'boolean'"
        v-model="value"
        type="checkbox"
        class="exlg-checkbox"
    />
    <input
        v-else-if="type === 'string'"
        v-model="value"
        type="text"
        class="exlg-input"
    />
    <input
        v-else-if="type === 'number'"
        v-model="value"
        type="number"
        class="exlg-input"
    />
    <select v-else-if="type === 'union'" v-model="value" class="exlg-select">
        <option v-for="(it, i) of props.schema.list" :key="i" :value="it.value">
            {{ it.meta?.description }}
        </option>
    </select>
</template>
