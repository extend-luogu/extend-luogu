<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue'
import compareVersions from 'compare-versions'
import { ModuleMetadata, Schema } from '../../../core/types'
import { InstallState } from '../utils'
import { kModuleCtl, kShowConfig } from '../utils/injectionSymbols'

const emits = defineEmits<{
    (e: 'installModule'): void
}>()

const { Schema: Scm } = window.exlg.utils
const moduleCtl = inject(kModuleCtl)!
const showConfig = inject(kShowConfig)!

const sourceUrl =
    'https://raw.githubusercontent.com/extend-luogu/exlg-module-registry/dist/index.json'

interface SourceItem {
    id: string
    name: string
    description: string
    versions: string[]
    bin: string
}
interface NpmSourceItem extends SourceItem {
    type: 'npm'
    package: string
}
type AllSourceItem = NpmSourceItem
type Source = AllSourceItem[]
const source = ref<Source | null>(null)

const npmSources = [
    { url: 'https://unpkg.com', name: 'unpkg' },
    { url: 'https://cdn.jsdelivr.net/npm', name: 'jsdelivr' },
    { url: 'https://fastly.jsdelivr.net/npm', name: 'jsdelivr (fastly)' }
] as const

const githubSources = [
    { url: '', name: 'github raw' },
    { url: 'https://ghproxy.com/', name: 'ghproxy' }
] as const

const sourceSchema = <
    T extends readonly { readonly url: string; readonly name: string }[],
    K extends keyof T & number
>(
    sources: T
): Schema<T[K]['url']> =>
    Scm.union(
        sources.map(({ url, name }) => Scm.const(url).description(name))
    ).default(sources[0].url)

const logger = window.exlg.utils.exlgLog('market')
const storage = window.exlg.defineStorage(
    'market',
    Scm.object({
        npmSource: sourceSchema(npmSources).description('NPM 源'),
        githubSource: sourceSchema(githubSources).description('github 源')
    })
)
moduleCtl.moduleStorages.market = storage // Note: For config

async function loadSource() {
    source.value = null
    source.value = await window.exlg.utils.csGet(
        storage.get('githubSource') + sourceUrl
    ).data
    source.value!.forEach((it) => {
        it.id = `${it.type}:${it.name}`
        installStates[it.id] = moduleCtl.storage.get(it.id)
            ? InstallState.installed
            : InstallState.uninstalled
    })
}

onMounted(loadSource)

async function install(it: AllSourceItem, vid: number) {
    if (installStates[it.id] === InstallState.installing) return
    installStates[it.id] = InstallState.installing

    const version = it.versions[vid]
    const metadata: ModuleMetadata = {
        name: it.name,
        source: it.type,
        version,
        description: it.description
    }
    let script: string | void

    try {
        switch (it.type) {
            case 'npm':
                script = await window.exlg.utils.csGet(
                    `${storage.get('npmSource')}/${it.package}@${version}/${
                        it.bin
                    }`
                ).response
        }
    } catch (err) {
        installStates[it.id] = InstallState.installFailed
        logger.error(
            `Failed to download script of module %o, error: %o`,
            it,
            err
        )
        return
    }

    logger.log(
        `Downloaded module %o: metadata %o, script %s`,
        it,
        metadata,
        script
    )

    moduleCtl.installModule(metadata, script!)
    installStates[it.id] = InstallState.installed
    emits('installModule')
}

const installStates = reactive<Record<string, InstallState>>({})

defineExpose({
    installStates
})

function installStateText(it: AllSourceItem): string {
    const state = installStates[it.id]
    switch (state) {
        case InstallState.installed: {
            const current = moduleCtl.storage.get(it.id).metadata.version
            if (compareVersions(current, it.versions.at(-1)!) < 0)
                return `<span class="update exlg-tooltip" data-tooltip="当前版本 ${current}">[有更新]</span>`
            return '[已安装]'
        }
        case InstallState.installing:
            return '[安装中]'
        case InstallState.installFailed:
            return '<span class="error">[出错了]</span>'
        case InstallState.uninstalled:
            return ''
    }
}
</script>

<template>
    <div class="root">
        <span class="emoji-button" @click="showConfig('market')">⚙️</span>
        <span class="emoji-button" @click="loadSource()">🔄</span>

        <hr class="exlg-hr" />

        <ul class="module-list" v-if="source">
            <li v-for="it of source" :key="it.id" class="module-entry">
                <span>
                    {{ it.id }}
                    <span class="module-version"
                        >@{{ it.versions.at(-1) }}</span
                    >
                </span>
                <div style="white-space: nowrap">
                    <span
                        class="module-install-state"
                        v-html="installStateText(it)"
                    >
                    </span>
                    <span
                        class="module-description exlg-tooltip"
                        :data-tooltip="it.description"
                    >
                        📙
                    </span>
                    <span
                        class="emoji-button module-install"
                        :style="{
                            visibility:
                                installStates[it.id] === InstallState.installing
                                    ? 'hidden'
                                    : 'visible'
                        }"
                        @click="install(it, it.versions.length - 1)"
                    >
                        ⬇️
                    </span>
                </div>
            </li>
        </ul>
        <p v-else>Loading...</p>
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
