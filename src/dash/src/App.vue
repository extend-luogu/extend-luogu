<script setup lang="ts">
import { ref } from 'vue'
import ModuleCtl from './components/ModuleCtl.vue'

const currentTab = ref('module')
const tabs = [
    { id: 'module', display: '模块' },
    { id: 'market', display: '市场' }
]

const show = ref(false)
</script>

<template>
    <button class="exlg-button" @click="show = !show">exlg</button>
    <div class="exlg-root" v-show="show">
        <div class="tabs">
            <div
                v-for="tab of tabs"
                :key="tab.id"
                class="tab-head"
                :class="{ active: currentTab === tab.id }"
                @click="currentTab = tab.id"
            >
                {{ tab.display }}
            </div>
        </div>
        <ModuleCtl v-show="currentTab === 'module'" />
    </div>
</template>

<style scoped>
.exlg-root {
    position: fixed;
    right: 0;
    top: 100px;
    box-sizing: border-box;
    height: calc(100% - 200px);
    padding: 20px;
    background: white;
    box-shadow: 0 0 1px 1px black;
    width: 30%;
}

.exlg-button {
    position: fixed;
    right: 20px;
    top: 60px;
}

.tabs {
    border-bottom: 1px solid;
    padding: 0px 5px;
}

.tab-head {
    display: inline-block;
    padding: 0 5px;
    margin: 0 3px;
}

.tab-head.active {
    border-width: 1px 1px 0px 1px;
    border-style: solid;
}
</style>
