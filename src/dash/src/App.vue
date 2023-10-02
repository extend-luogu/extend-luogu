<script setup lang="ts">
import { reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import ModuleControlView from '@comp/views/ModuleControlView.vue'
import MarketView from '@comp/views/MarketView.vue'
import DevView from '@comp/views/DevView.vue'
import ConfigView from '@comp/views/ConfigView.vue'
import InterfaceView from '@comp/views/InterfaceView.vue'
import { useModules } from '@/stores/module'

const { moduleControl } = window.exlg
delete window.exlg.moduleControl
const { InstallStates } = moduleControl!

const moduleStore = useModules()
moduleStore.moduleControl = moduleControl!
const { installStates } = storeToRefs(useModules())

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


function switchTab(id: string) {
    currentTab.value = id
    const tab = tabs[id]
    if (tab.note) tab.note = false
}

function updateModule() {
    moduleStore.loadLocalModules()
    if (currentTab.value !== 'module') tabs.module.note = true
}

function uninstallModule(id: string) {
    installStates.value[id] = InstallStates.uninstalled
}
</script>

<template>
    <button
        class="exlg-button"
        @click="show = !show"
    >
        exlg celeste
    </button>

    <div
        v-show="show"
        class="exlg-root"
    >
        <ConfigView />
        <InterfaceView />

        <div class="tabs">
            <div
                v-for="(tab, id) of tabs"
                :key="id"
                class="tab-head"
                :class="{ active: currentTab === id }"
                @click="switchTab(id)"
            >
                {{ tab.display }}
                <span
                    v-if="tab.note"
                    class="tab-note"
                />
            </div>
        </div>

        <ModuleControlView
            v-show="currentTab === 'module'"
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

/* #exlg-dash * {
    font-size: inherit;
    font-family: inherit;
} */
</style>

<style scoped>
.exlg-root {
    box-sizing: border-box;
    position: fixed;
    top: 130px;
    right: 0;
    z-index: 70000;
    border: 1px solid var(--inactive-color);
    border-right: none;
    width: 30%;
    min-width: 350px;
    height: calc(100% - 200px);
    background: var(--bg-color);
    padding: 20px;
    transition: border-color 0.3s;
}

.exlg-root:hover {
    border-color: var(--secondary-color);
}

.exlg-button {
    position: fixed;
    top: 82px;
    right: -32px;
    z-index: 70000;
    padding: 5px 42px 6px 12px;
    --transition: right ease-in-out 0.3s;
}

.exlg-button:hover {
    right: -2px;
}

.tabs {
    margin-bottom: 15px;
}

.tab-head {
    display: inline-block;
    border-bottom: 1px solid var(--secondary-color);
    background-color: var(--bg-color);
    cursor: pointer;
    padding: 2px 12px 0;
    color: var(--secondary-color);
    transition: border-color 0.3s, background-color 0.3s, color 0.3s;
}

.tab-head:hover {
    background-color: var(--secondary-color);
    color: var(--bg-color);
}

.tab-head.active {
    border-bottom-color: var(--primary-color);
    background-color: var(--primary-color);
    cursor: default;
    color: var(--bg-color);
}

.tab-note {
    position: absolute;
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--primary-color);
}
</style>
