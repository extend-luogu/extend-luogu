<script setup lang="ts">
import { computed, inject, reactive, ref } from 'vue'
import type { ModulesReadonly, Schema } from '../../../core/types'
import { kModuleCtl } from '../utils/injectionSymbols'
import ConfigItem from './ConfigItem.vue'

const emits = defineEmits<{
    (e: 'uninstallModule', id: string): void
}>()

const moduleCtl = inject(kModuleCtl)!
const { utils, schemas } = window.exlg

const modules = ref<ModulesReadonly | null>()

function toggleModule(id: string) {
    moduleCtl.storage.do(id, (mod) => {
        mod.active = !mod.active
        return mod
    })
}

function updateModuleCache() {
    modules.value = moduleCtl.storage.getAll()
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

updateModuleCache()

defineExpose({
    updateModuleCache
})
</script>

<template>
    <div class="root">
        <div class="module-config" v-if="configModuleId">
            设置 {{ configModuleId }}

            <hr class="exlg-hr" />

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
            <ul class="module-list" v-if="modules">
                <li v-for="mod of modules" :key="mod.id" class="module-entry">
                    <span>
                        {{ mod.id }}
                        <span class="module-version">
                            @{{ mod.metadata.version }}
                        </span>
                    </span>
                    <span style="white-space: nowrap">
                        <span
                            v-if="schemas[mod.id]"
                            @click="configModuleId = mod.id"
                        >
                            ⚙️
                        </span>
                        <span @click="uninstall(mod.id)">🗑️</span>
                        <input
                            class="module-toggle exlg-checkbox"
                            type="checkbox"
                            :checked="mod.active"
                            @change="toggleModule(mod.id)"
                        />
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

.module-config-list:empty::before {
    content: '没有可用配置项';
}
</style>
