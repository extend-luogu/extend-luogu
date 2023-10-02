<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import compareVersions from 'compare-versions'
import type { AllSourceItem, Registry } from '@core/types'
import { useModules } from '@/stores/module'
import { useWindows } from '@/stores/window'
import { marketStorage } from '@/utils/source'
import VersionSelect from '@comp/VersionSelect.vue'
import InstallButton from '../InstallButton.vue'
import ModuleInstallStateIcon, { type ModuleInstallState } from '../ModuleInstallStateIcon.vue'
import { Icon } from '@iconify/vue'
import biCapslock from '@iconify-icons/bi/capslock'
import biCheck2Circle from '@iconify-icons/bi/check2-circle'
import biHourglassSplit from '@iconify-icons/bi/hourglass-split'
import biExclamationTriangle from '@iconify-icons/bi/exclamation-triangle'

const emit = defineEmits<{
    (e: 'installModule'): void
}>()

const { utils: { csGet } } = window.exlg

const moduleStore = useModules()
const { moduleControl, installStates } = storeToRefs(moduleStore)
const { InstallStates, modulesStorage } = moduleControl.value

const windowStore = useWindows()

const source = ref<Registry | null>(null)

async function loadSource() {
    source.value = null

    source.value = (
        await csGet(marketStorage.get('registrySource'))
    ).json

    if (source.value === null) {
        return
    }

    source.value.forEach((item) => {
        item.id = item.name
        item.selectedVersion = item.versions.at(-1)! // Note: latest version
        installStates.value[item.id] = modulesStorage.get(item.id)
            ? InstallStates.installed
            : InstallStates.uninstalled
    })
}

const getInstallState = (item: AllSourceItem): ModuleInstallState => {
    const state = installStates.value[item.id]
    switch (state) {
    case InstallStates.installed: {
        const current = modulesStorage.get(item.id).metadata.version
        if (compareVersions(current, item.versions.at(-1)!.version) < 0)
            return {
                text: `有新版本：当前版本 ${current}`,
                icon: biCapslock
            }
        return {
            text: '已安装',
            icon: biCheck2Circle
        }
    }
    case InstallStates.installing:
        return {
            text: '正在安装',
            icon: biHourglassSplit
        }
    case InstallStates.installFailed:
        return {
            text: '发生错误',
            icon: biExclamationTriangle
        }
    case InstallStates.uninstalled:
        return {}
    }
}

// const showId = ref(false)

loadSource()
</script>

<template>
    <div class="root">
        <span
            class="emoji-button"
            title="配置"
            @click="windowStore.showConfigWindow('market')"
        >
            ⚙️
        </span>
        <span
            class="emoji-button"
            title="重新加载"
            @click="loadSource"
        >
            🔄
        </span>

        <ul
            v-if="source"
            class="module-list"
        >
            <li
                v-for="item of source"
                :key="item.id"
                class="module-entry"
            >
                <span class="module-icon">
                    <ModuleInstallStateIcon :state="getInstallState(item)" />
                </span>
                <span class="module-card">
                    <div>
                        <div class="module-info-primary">
                            {{ item.display ?? "未命名模块" }}
                            <VersionSelect
                                v-model="item.selectedVersion"
                                :source="item"
                            />
                        </div>
                        <div class="module-info-secondary">
                            <span class="module-id">
                                {{ item.name }}
                            </span>
                        </div>
                    </div>
                    <div class="module-options">
                        <span
                            class="module-description exlg-tooltip"
                            :data-exlg-tooltip="item.description"
                        >
                            📙
                        </span>
                        <InstallButton
                            :source-item="item"
                            @install-module="emit('installModule')"
                        />
                    </div>
                </span>
            </li>
        </ul>
        <p v-else>
            加载中……
        </p>
    </div>
</template>

<style scoped>
.module-install {
    transition: color 0.5s;
}
.module-install:hover {
    color: var(--primary-color);
}

.module-description {
    position: relative;
}

.module-description::after {
    right: 25px;
    top: 25px;
    width: 400px;
    padding: 5px;
}
</style>
