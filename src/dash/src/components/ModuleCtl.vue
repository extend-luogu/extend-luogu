<script setup lang="ts">
const { moduleCtl, modules } = window.exlg
const { storage } = moduleCtl!
delete window.exlg.moduleCtl

function toggleModule(id: string) {
    storage.do(id, (mod) => {
        mod.active = !mod.active
        return mod
    })
}
</script>

<template>
    <div>
        <ul class="module-list">
            <li v-for="mod of modules" :key="mod.id" class="module-entry">
                <span> {{ mod.id }}@{{ mod.metadata.version }}</span>
                <input
                    class="module-toggle"
                    type="checkbox"
                    :checked="mod.active"
                    @change="toggleModule(mod.id)"
                />
            </li>
        </ul>
    </div>
</template>

<style scoped>
.module-list {
    list-style: none;
    margin: 15px 0;
    padding: 0;
}

.module-entry {
    display: flex;
    justify-content: space-between;
}
</style>
