<script setup lang="ts">
import { inject, ref } from 'vue'
import type { ModulesReadonly } from '../../../core'
import { kModuleCtl } from '../utils/injectionSymbols'

const emits = defineEmits<{
    (e: 'uninstallModule', id: string): void
}>()

const moduleCtl = inject(kModuleCtl)!
const { utils } = window.exlg

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

updateModuleCache()

defineExpose({
    updateModuleCache
})
</script>

<template>
    <div>
        <ul class="module-list" v-if="modules">
            <li v-for="mod of modules" :key="mod.id" class="module-entry">
                <span>
                    {{ mod.id }}
                    <span class="module-version">
                        @{{ mod.metadata.version }}
                    </span>
                </span>
                <span>
                    <span @click="uninstall(mod.id)">🗑️</span>
                    <input
                        class="module-toggle"
                        type="checkbox"
                        :checked="mod.active"
                        @change="toggleModule(mod.id)"
                    />
                </span>
            </li>
        </ul>
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
</style>
