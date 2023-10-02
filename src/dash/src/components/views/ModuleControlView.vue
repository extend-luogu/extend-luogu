<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ExecuteState } from '@core/types'
import Await from '@comp/utils/Await.vue'
import { useModules } from '@/stores/module'
import { useWindows } from '@/stores/window'
import { Icon } from '@iconify/vue'
import type { IconifyIcon } from '@iconify/types'
import biCheck2Circle from '@iconify-icons/bi/check2-circle'
import biExclamationTriangle from '@iconify-icons/bi/exclamation-triangle'
import biBagX from '@iconify-icons/bi/bag-x'
import biSnow from '@iconify-icons/bi/snow'
import biSignpostSplit from '@iconify-icons/bi/signpost-split'
import biQuestionDiamond from '@iconify-icons/bi/question-diamond'
import biDatabaseExclamation from '@iconify-icons/bi/database-exclamation'
import biSendSlash from '@iconify-icons/bi/send-slash'
import biExclamationOctagon from '@iconify-icons/bi/exclamation-octagon'
import biHourglassSplit from '@iconify-icons/bi/hourglass-split'
import biDpad from '@iconify-icons/bi/dpad'
import biGear from '@iconify-icons/bi/gear'
import biTrash from '@iconify-icons/bi/trash'

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

const executeStateIcons: Record<ExecuteState, IconifyIcon> = {
    [ExecuteStates.Done]: biCheck2Circle,
    [ExecuteStates.Threw]: biExclamationTriangle,
    [ExecuteStates.MissDependency]: biBagX,
    [ExecuteStates.Inactive]: biSnow,
    [ExecuteStates.Mismatched]: biSignpostSplit,
    [ExecuteStates.StorageBroken]: biDatabaseExclamation,
    [ExecuteStates.NotExported]: biSendSlash,
    [ExecuteStates.UnwrapThrew]: biExclamationOctagon
}

const executeStateTexts: Record<ExecuteState, string> = {
    [ExecuteStates.Done]: '加载完成',
    [ExecuteStates.Threw]: '运行时发生错误',
    [ExecuteStates.MissDependency]: '缺少依赖项',
    [ExecuteStates.Inactive]: '未启用',
    [ExecuteStates.Mismatched]: '当且页面未匹配',
    [ExecuteStates.StorageBroken]: '数据发生错误',
    [ExecuteStates.NotExported]: '缺少导出项',
    [ExecuteStates.UnwrapThrew]: '解包发送错误'
}

// const showId = ref(false)
</script>

<template>
    <div class="root">
        <div>
            <!-- <div class="list-setting">
                <HtmlCheckbox
                    v-model="showId"
                    title="显示 ID"
                >
                    <template #active>
                        <Icon
                            :icon="biBracesAsterisk"
                            style="font-size: 18px;"
                        />
                        按照 ID
                    </template>
                    <template #inactive>
                        <Icon
                            :icon="biTag"
                            style="font-size: 18px;"
                        />
                        按照名称
                    </template>
                </HtmlCheckbox>
            </div> -->
            <ul class="module-list">
                <li
                    v-for="mod of localModules"
                    :key="mod.id"
                    class="module-entry"
                >
                    <span class="module-icon">
                        <Await
                            :promise="modules[mod.id]?.runtime?.executeState"
                        >
                            <template #first>
                                <Icon
                                    :icon="biHourglassSplit"
                                    style="font-size: 18px; position: relative; top: 3px; color: var(--inactive-color);"
                                />
                            </template>
                            <template #then="{ result }">
                                <span
                                    class="exlg-tooltip"
                                    :data-exlg-tooltip="executeStateTexts[result]"
                                >
                                    <Icon
                                        v-if="executeStateIcons[result] !== undefined"
                                        :icon="executeStateIcons[result]"
                                        style="font-size: 18px; position: relative; top: 3px; color: var(--inactive-color);"
                                    />
                                    <Icon
                                        v-else
                                        :icon="biQuestionDiamond"
                                        style="font-size: 18px; position: relative; top: 3px; color: var(--inactive-color);"
                                    />
                                </span>
                            </template>
                        </Await>
                    </span>
                    <span class="module-card">
                        <div>
                            <div class="module-info-primary">
                                {{ mod.metadata.display ?? "未命名模块" }}
                                <span class="module-version">
                                    @{{ mod.metadata.version }}
                                </span>
                            </div>
                            <div class="module-info-secondary">
                                <span class="module-id">
                                    {{ mod.id }}
                                </span>
                            </div>
                        </div>
                        <div class="module-options">
                            <span
                                v-if="Object.keys(modules[mod.id].runtime.interfaces).length"
                                class="icon-button"
                                title="执行命令"
                                @click="windowStore.showInterfaceWindow(mod.id)"
                            >
                                <Icon
                                    :icon="biDpad"
                                    style="position: relative; top: 2.25px; margin-right: 0.625px;"
                                />
                            </span>
                            <span
                                v-if="schemas[mod.id]"
                                class="icon-button"
                                title="配置"
                                @click="windowStore.showConfigWindow(mod.id)"
                            >
                                <Icon
                                    :icon="biGear"
                                    style="position: relative; top: 2.25px;"
                                />
                            </span>
                            <span
                                class="icon-button"
                                title="卸载"
                                @click="uninstall(mod.id)"
                            >
                                <Icon
                                    :icon="biTrash"
                                    style="position: relative; top: 3px; margin-left: -0.625px;"
                                />
                            </span>
                            <input
                                class="exlg-switch"
                                type="checkbox"
                                :checked="mod.active"
                                style="margin-left: 5px;"
                                @change="toggleModule(mod.id)"
                            >
                        </div>
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>

<style>
.list-setting {
    padding: 0 5px 2px;
}

.module-list {
    list-style: none;
    padding: 0;
}


.module-entry {
    display: flex;
    gap: 7px;
}

.module-icon {
    display: flex;
    align-items: center;
}

.module-card {
    flex-grow: 1;
    display: flex;
    align-items: center;
    background-color: var(--bg-color);
    padding: 3px 7px 2px;
    justify-content: space-between;
    transition: background-color 0.3s;
}

.module-card:hover {
    background-color: var(--bg-inactive-color);
}

.module-version {
    color: var(--primary-color);
    font-size: .9em;
}

.module-info-secondary {
    margin-top: -8px;
}

.module-id {
    color: var(--inactive-color);
    font-family: var(--font-monospace);
    font-size: .85em;
}

.module-options {
    display: flex;
    gap: 5px;
}

.emoji-button {
    user-select: none;
    cursor: pointer;
}

.icon-button {
    user-select: none;
    cursor: pointer;
    color: var(--inactive-color);
    transition: color 0.3s;
}

.icon-button:hover {
    color: var(--secondary-color);
}
</style>
