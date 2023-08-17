<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import compareVersions from 'compare-versions'
import type { ModuleDependencies, ModuleMetadata } from '@core/types'
import { useModules } from '@/stores/module'
import { useWindows } from '@/stores/window'
import { type AllSourceItem, InstallState, type Source } from '@/utils'
import { marketStorage } from '@/utils/source'
import TextCheckbox from '@comp/utils/TextCheckbox.vue'
import VersionSelect from '@comp/VersionSelect.vue'
import ModuleInstallStateMessage, { type ModuleInstallState } from '@comp/ModuleInstallStateMessage.vue'
const emit = defineEmits<{
    (e: 'installModule'): void
}>()

const { utils: { exlgLog, csGet, semver }, coreVersion } = window.exlg

const logger = exlgLog('market')

const moduleStore = useModules()
const { moduleControl, installStates } = storeToRefs(moduleStore)

const windowStore = useWindows()

const source = ref<Source | null>(null)

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
        installStates.value[item.id] = moduleControl.value.modulesStorage.get(item.id)
            ? InstallState.installed
            : InstallState.uninstalled
    })
}

async function install(item: AllSourceItem) {
    if (installStates.value[item.id] === InstallState.installing) return
    installStates.value[item.id] = InstallState.installing

    const version = item.selectedVersion
    const metadata: ModuleMetadata = {
        name: item.name,
        source: item.type,
        version: version.version,
        dependencies: version.dependencies,
        description: item.description,
        display: item.display,
    }
    let script: string | void

    try {
        switch (item.type) {
        case 'npm':
            script = (
                await csGet(
                    `${marketStorage.get('npmSource')}/${item.package}@${version}/${item.bin}`
                )
            ).response
        }
    } catch (err) {
        installStates.value[item.id] = InstallState.installFailed
        logger.error(
            'Failed to download script of module %o, error: %o',
            item,
            err
        )
        return
    }

    logger.log(
        'Downloaded module %o: metadata %o, script %s',
        item,
        metadata,
        script
    )

    moduleControl.value.installModule(metadata, script!)
    installStates.value[item.id] = InstallState.installed
    emit('installModule')
}

const getInstallState = (item: AllSourceItem): ModuleInstallState => {
    const state = installStates.value[item.id]
    switch (state) {
    case InstallState.installed: {
        const current = moduleControl.value.modulesStorage.get(item.id).metadata.version
        if (compareVersions(current, item.versions.at(-1)!.version) < 0)
            return {
                class: 'update exlg-tooltip',
                tooltip: `当前版本 ${current}`,
                text: '有更新'
            }
        return { text: '已安装' }
    }
    case InstallState.installing:
        return { text: '安装中' }
    case InstallState.installFailed:
        return {
            class: 'error',
            text: '出错了'
        }
    case InstallState.uninstalled:
        return {}
    }
}

const isDependenciesOk = (item: AllSourceItem) => {
    const dep = item.selectedVersion.dependencies
    if (dep.core && ! semver.satisfies(coreVersion, dep.core)) return false
    return true
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
                    {{ showId ? item.name : item.display }}
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
                    <span
                        v-if="isDependenciesOk(item)"
                        class="emoji-button module-install"
                        title="安装"
                        :style="{
                            visibility:
                                installStates[item.id] === InstallState.installing
                                    ? 'hidden'
                                    : 'visible'
                        }"
                        @click="install(item)"
                    >
                        ⬇️
                    </span>
                    <span v-else>❌</span>
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
