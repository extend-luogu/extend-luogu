<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { ExecuteState } from '@core/types'
import Await from '@comp/utils/Await.vue'
import TextCheckbox from '@comp/utils/TextCheckbox.vue'
import { useModules } from '@/stores/module'
import { useWindows } from '@/stores/window'

const emit = defineEmits<{
    (e: 'uninstallModule', id: string): void
}>()

const { utils, schemas, modules } = window.exlg

const moduleStore = useModules()
const { moduleControl, localModules } = storeToRefs(moduleStore)
const { ExecuteStates, modulesStorage } = moduleControl.value
moduleStore.loadLocalModules()

const windowStore = useWindows()

function toggleModule(id: string) {
    modulesStorage.do(id, (mod) => {
        mod.active = !mod.active
        return mod
    })
}

function uninstall(id: string) {
    utils.simpleAlert(`确定要删除模块 ${id}？`, {
        onAccept: () => {
            modulesStorage.del(id)
            emit('uninstallModule', id)
            moduleStore.loadLocalModules()
        }
    })
}

const executeStateIcons: Record<ExecuteState, string> = {
    [ExecuteStates.Done]: '✨',
    [ExecuteStates.Threw]: '💥',
    [ExecuteStates.MissDependeny]: '💥',
    [ExecuteStates.Inactive]: '❄️',
    [ExecuteStates.Mismatched]: '🌙',
    [ExecuteStates.StorageBroken]: '💥',
    [ExecuteStates.NotExported]: '💥',
    [ExecuteStates.UnwrapThrew]: '💥'
}

const executeStateTexts: Record<ExecuteState, string> = {
    [ExecuteStates.Done]: '已加载',
    [ExecuteStates.Threw]: '出错了',
    [ExecuteStates.MissDependeny]: '依赖缺失',
    [ExecuteStates.Inactive]: '未开启',
    [ExecuteStates.Mismatched]: '未匹配',
    [ExecuteStates.StorageBroken]: '数据错误',
    [ExecuteStates.NotExported]: '无导出',
    [ExecuteStates.UnwrapThrew]: '解包错误'
}

const showId = ref(false)
</script>

<template>
    <div class="root">
        <div>
            <TextCheckbox
                v-model="showId"
                text="🆔"
                title="显示 ID"
            />
            <ul class="module-list">
                <li
                    v-for="mod of localModules"
                    :key="mod.id"
                    class="module-entry"
                >
                    <span>
                        <Await
                            :promise="modules[mod.id]?.runtime?.executeState"
                        >
                            <template #first>🕒</template>
                            <template #then="{ result }">
                                <span
                                    class="execute-state exlg-tooltip"
                                    :data-exlg-tooltip="executeStateTexts[result]"
                                >
                                    {{ executeStateIcons[result] }}
                                </span>
                            </template>
                        </Await>
                        {{ showId ? mod.id : mod.metadata.display ?? mod.id }}
                        <span class="module-version">
                            @{{ mod.metadata.version }}
                        </span>
                    </span>
                    <span style="white-space: nowrap">
                        <span
                            v-if="Object.keys(modules[mod.id].runtime.interfaces).length"
                            class="emoji-button"
                            title="执行命令"
                            @click="windowStore.showInterfaceWindow(mod.id)"
                        >
                            💈
                        </span>
                        <span
                            v-if="schemas[mod.id]"
                            class="emoji-button"
                            title="配置"
                            @click="windowStore.showConfigWindow(mod.id)"
                        >
                            ⚙️
                        </span>
                        <span
                            class="emoji-button"
                            title="卸载"
                            @click="uninstall(mod.id)"
                        >
                            🗑️
                        </span>
                        <input
                            class="exlg-checkbox"
                            type="checkbox"
                            :checked="mod.active"
                            @change="toggleModule(mod.id)"
                        >
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>

<style>
.module-list {
    list-style: none;
    padding: 0;
}

.module-entry {
    display: flex;
    justify-content: space-between;
}

.module-version {
    color: var(--accent-color);
}

.emoji-button {
    user-select: none;
    cursor: pointer;
}

.execute-state {
    user-select: none;
}
.execute-state:after {
    right: 100%;
    width: max-content;
}
</style>
