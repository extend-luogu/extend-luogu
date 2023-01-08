<script setup lang="ts">
import { useAsyncState } from '@/utils'
import type { ExecuteState, Module } from '@core/types'

const executeStateIcons: Record<ExecuteState, string> = {
    done: '✨',
    threw: '💥',
    inactive: '❄️',
    mismatched: '🌙',
    storageBroken: '💥',
    notExported: '💥',
    unwrapThrew: '💥'
}

const executeStateTexts: Record<ExecuteState, string> = {
    done: '已加载',
    threw: '出错了',
    inactive: '未开启',
    mismatched: '未匹配',
    storageBroken: '数据错误',
    notExported: '无导出',
    unwrapThrew: '解包错误'
}

const props = defineProps<{
    mod?: Module
}>()

const state = props.mod?.runtime?.executeState
    ? useAsyncState(props.mod?.runtime?.executeState)
    : null
</script>

<template>
    <template v-if="state !== null">
        <span v-if="state.isLoading.value === true">🕒</span>
        <span
            v-if="state.isReady.value === true"
            class="execute-state exlg-tooltip"
            :data-exlg-tooltip="executeStateTexts[state.state.value ?? 'threw']"
        >
            {{ executeStateIcons[state.state.value ?? 'threw'] }}
        </span>
    </template>
</template>
