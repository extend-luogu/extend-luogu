<script setup lang="ts">
import { inject, ref } from 'vue'
import type { Modules } from '../../../core'
import { kModuleCtl } from '../utils/injectionSymbols'

const moduleCtl = inject(kModuleCtl)!

const modules = ref<Modules | null>()

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
    moduleCtl.storage.del(id)
    updateModuleCache()
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
    margin: 15px 0;
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
