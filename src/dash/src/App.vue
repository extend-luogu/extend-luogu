<script setup lang="ts">
import { provide, reactive, ref } from 'vue'
import { kModuleCtl } from './utils/injectionSymbols'
import ModuleCtlView from './components/ModuleCtlView.vue'
import MarketView from './components/MarketView.vue'
import { ModuleCtl } from '../../core/module'

const { moduleCtl } = window.exlg
provide(kModuleCtl, moduleCtl)
delete window.exlg.moduleCtl

const currentTab = ref('module')
const tabs = reactive<
    Record<
        string,
        {
            display: string
            note?: boolean
        }
    >
>({
    module: { display: '模块' },
    market: { display: '市场' }
})

const show = ref(false)

const moduleCtlView = ref<InstanceType<typeof ModuleCtlView>>()

function switchTab(id: string) {
    currentTab.value = id
    const tab = tabs[id]
    if (tab.note) tab.note = false
}

function updateModule() {
    moduleCtlView.value!.updateModuleCache()
    if (currentTab.value !== 'module') tabs.module.note = true
}
</script>

<template>
    <button class="exlg-button" @click="show = !show">exlg ng</button>
    <div class="exlg-root" v-show="show">
        <div class="tabs">
            <div
                v-for="(tab, id) of tabs"
                :key="id"
                class="tab-head"
                :class="{ active: currentTab === id }"
                @click="switchTab(id)"
            >
                {{ tab.display }}
                <span v-if="tab.note" class="tab-note"></span>
            </div>
        </div>

        <ModuleCtlView v-show="currentTab === 'module'" ref="moduleCtlView" />
        <MarketView
            v-show="currentTab === 'market'"
            @update-module="updateModule"
        />
    </div>
</template>

<style scoped>
.exlg-root {
    position: fixed;
    z-index: 70000;
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
    z-index: 70000;
    right: 20px;
    top: 60px;
    border-radius: 0;
    border: 1px solid black;
    background: white;
    padding: 3px 15px 5px 15px;
    transition: color 0.5s, border-color 0.5s;
}

.exlg-button:hover {
    border-color: blueviolet;
    color: blueviolet;
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

.tab-note {
    position: absolute;
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: red;
}
</style>
