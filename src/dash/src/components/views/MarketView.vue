<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import compareVersions from 'compare-versions'
import type { AllSourceItem, Registry } from '@core/types'
import { useModules } from '@/stores/module'
import { useWindows } from '@/stores/window'
import { marketStorage } from '@/utils/source'
import TextCheckbox from '@comp/utils/TextCheckbox.vue'
import VersionSelect from '@comp/VersionSelect.vue'
import ModuleInstallStateMessage, { type ModuleInstallState } from '@comp/ModuleInstallStateMessage.vue'
import InstallButton from '../InstallButton.vue'

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
                class: 'update exlg-tooltip',
                tooltip: `当前版本 ${current}`,
                text: '有更新'
            }
        return { text: '已安装' }
    }
    case InstallStates.installing:
        return { text: '安装中' }
    case InstallStates.installFailed:
        return {
            class: 'error',
            text: '出错了'
        }
    case InstallStates.uninstalled:
        return {}
    }
}

const showId = ref(false)

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
        <TextCheckbox
            v-model="showId"
            text="🆔"
            title="显示 ID"
        />

        <hr class="exlg-hr">

        <ul
            v-if="source"
            class="module-list"
        >
            <li
                v-for="item of source"
                :key="item.id"
                class="module-entry"
            >
                <span>
                    {{ showId ? item.name : item.display ?? item.name }}
                    <VersionSelect
                        v-model="item.selectedVersion"
                        :source="item"
                    />
                </span>
                <div style="white-space: nowrap">
                    <ModuleInstallStateMessage :state="getInstallState(item)" />
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
    color: var(--accent-color);
}

.module-install-state {
    color: gray;
}
.module-install-state > :deep(.update) {
    color: var(--accent-color);
}
.module-install-state > :deep(.update::after) {
    color: black;
    right: calc(100% + 3px);
    width: max-content;
}

.module-install-state > :deep(.error) {
    color: var(--accent-color);
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
