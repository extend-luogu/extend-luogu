<script setup lang="ts">
import { provide, reactive, ref } from 'vue'
import ModuleCtlView from './components/ModuleCtlView.vue'
import MarketView from './components/MarketView.vue'
import DevView from './components/DevView.vue'
import ConfigView from './components/ConfigView.vue'
import { InstallState } from './utils'
import { kModuleCtl, kShowConfig } from './utils/injectionSymbols'

const { moduleCtl } = window.exlg
delete window.exlg.moduleCtl
provide(kModuleCtl, moduleCtl)

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
    market: { display: '市场' },
    dev: { display: '开发选项' }
})

const show = ref(false)

const moduleCtlView = ref<InstanceType<typeof ModuleCtlView>>()
const marketView = ref<InstanceType<typeof MarketView>>()

const configView = ref<InstanceType<typeof ConfigView>>()
provide(kShowConfig, (configId: string) => {
    configView.value!.showConfig(configId)
})

function switchTab(id: string) {
    currentTab.value = id
    const tab = tabs[id]
    if (tab.note) tab.note = false
}

function updateModule() {
    moduleCtlView.value!.updateModuleCache()
    if (currentTab.value !== 'module') tabs.module.note = true
}

function uninstallModule(id: string) {
    marketView.value!.installStates[id] = InstallState.uninstalled
}
</script>

<template>
    <button class="exlg-button" @click="show = !show">exlg celeste</button>

    <div class="exlg-root" v-show="show">
        <ConfigView ref="configView" />

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

        <ModuleCtlView
            v-show="currentTab === 'module'"
            ref="moduleCtlView"
            @uninstall-module="uninstallModule"
        />
        <MarketView
            v-show="currentTab === 'market'"
            ref="marketView"
            @install-module="updateModule"
        />
        <DevView v-show="currentTab === 'dev'" />
    </div>
</template>

<style>
#exlg-dash {
    line-height: 1.6;
    font-weight: 400;
    color: #333;
    font-size: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'San Francisco',
        'Helvetica Neue', 'Noto Sans CJK SC', 'Noto Sans CJK', 'Source Han Sans',
        'PingFang SC', 'Microsoft YaHei', sans-serif;
}

#exlg-dash * {
    font-size: inherit;
    font-family: inherit;
}
</style>

<style scoped>
.exlg-root {
    position: fixed;
    z-index: 70000;
    right: 0;
    top: 100px;
    box-sizing: border-box;
    width: 30%;
    min-width: 350px;
    height: calc(100% - 200px);
    padding: 20px;
    background: white;
    box-shadow: 0 0 1px 1px black;
}

.exlg-button {
    position: fixed;
    z-index: 70000;
    right: 20px;
    top: 60px;
    transition: color 0.5s, border-color 0.5s;
}

.exlg-button:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
}

.tabs {
    border-bottom: 1px solid;
    padding: 0px 5px;
    margin-bottom: 15px;
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
    background-color: var(--accent-color);
}
</style>
