<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ModulesReadonly, ExecuteState } from '../../../core/types'
import { kModuleCtl } from '../utils/injectionSymbols'
import ConfigItem from './ConfigItem.vue'
import Await from './utils/Await.vue'

const emits = defineEmits<{
    (e: 'uninstallModule', id: string): void
}>()

const moduleCtl = inject(kModuleCtl)!
const { utils, schemas, modules } = window.exlg

const modulesRo = ref<ModulesReadonly | null>()

function toggleModule(id: string) {
    moduleCtl.storage.do(id, (mod) => {
        mod.active = !mod.active
        return mod
    })
}

function updateModuleCache() {
    modulesRo.value = moduleCtl.storage.getAll()
}

function uninstall(id: string) {
    utils.simpleAlert(
        `确定要删除模块 ${id}？` +
            (moduleCtl.moduleStorages[id]
                ? `<button class="exlg-button">清除存储</button>`
                : ''),
        {
            onOpen: ($con) => {
                const $clear = $con.querySelector('button')
                $clear?.addEventListener('click', () => {
                    moduleCtl.moduleStorages[id].clear()
                    $clear.innerHTML = '已清除'
                    $clear.disabled = true
                })
            },
            onAccept: () => {
                moduleCtl.storage.del(id)
                emits('uninstallModule', id)
                updateModuleCache()
            }
        }
    )
}

const configModuleId = ref<string | null>(null)
const configStorage = computed(() =>
    configModuleId.value
        ? moduleCtl.moduleStorages[configModuleId.value]
        : undefined
)

const executeStateIcons: Record<ExecuteState, string> = {
    done: '✨',
    throwed: '💥',
    inactive: '❄️',
    mismatched: '🌙',
    storageBroken: '💥',
    notExported: '💥',
    unwrapThrowed: '💥'
}

const executeStateTexts: Record<ExecuteState, string> = {
    done: '已加载',
    throwed: '出错了',
    inactive: '未开启',
    mismatched: '未匹配',
    storageBroken: '数据错误',
    notExported: '无导出',
    unwrapThrowed: '解包错误'
}

updateModuleCache()

defineExpose({
    updateModuleCache
})
</script>

<template>
    <div class="root">
        <div class="module-config" v-if="configModuleId">
            <span class="module-config-header">
                设置 {{ configModuleId }}
                <span @click="configModuleId = null" style="cursor: pointer">
                    关闭
                </span>
            </span>

            <hr class="exlg-hr close-to-top" />

            <div class="module-config-list">
                <template
                    v-for="(schema, name) of schemas[configModuleId].dict"
                    :key="name"
                >
                    <div v-if="schema?.meta?.description">
                        {{ name }}
                        <ConfigItem :schema="schema" :storage="configStorage" />
                        {{ schema.meta.description }}
                    </div>
                </template>
            </div>
        </div>
        <div>
            <ul class="module-list" v-if="modulesRo">
                <li v-for="mod of modulesRo" :key="mod.id" class="module-entry">
                    <span>
                        {{ mod.id }}
                        <span class="module-version">
                            @{{ mod.metadata.version }}
                        </span>
                    </span>
                    <span style="white-space: nowrap">
                        <span
                            v-if="schemas[mod.id]"
                            class="emoji-button"
                            @click="configModuleId = mod.id"
                        >
                            ⚙️
                        </span>
                        <span class="emoji-button" @click="uninstall(mod.id)">
                            🗑️
                        </span>
                        <input
                            class="exlg-checkbox"
                            type="checkbox"
                            :checked="mod.active"
                            @change="toggleModule(mod.id)"
                        />
                        <Await :promise="modules[mod.id].runtime.executeState">
                            <template #first>🕒</template>
                            <template #then="{ result }">
                                <!-- FIXME: <https://segmentfault.com/q/1010000042083565> -->
                                <span
                                    class="execute-state exlg-tooltip"
                                    :data-tooltip="
                                        /* @ts-expect-error */
                                        executeStateTexts[result]
                                    "
                                >
                                    {{
                                        /* @ts-expect-error */
                                        executeStateIcons[result]
                                    }}
                                </span>
                            </template>
                        </Await>
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
    color: blueviolet;
}

.module-config {
    top: 0;
    right: calc(100% + 20px);
    position: absolute;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 20px;
    background: white;
    box-shadow: 0 0 1px 1px #000;
}

.module-config-header {
    display: flex;
    justify-content: space-between;
}

.module-config-list:empty::before {
    content: '没有可用配置项';
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
