<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue'
import compareVersions from 'compare-versions'
import { ModuleMetadata } from '../../../core/module'
import { InstallState } from '../utils'
import { kModuleCtl } from '../utils/injectionSymbols'

const emits = defineEmits<{
    (e: 'installModule'): void
}>()

const moduleCtl = inject(kModuleCtl)!
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

const logger = window.exlg.utils.exlgLog('market')

onMounted(async () => {
    source.value = await window.exlg.utils.csGet(sourceUrl).data
    source.value!.forEach((it) => {
        it.id = `${it.type}:${it.name}`
        installStates[it.id] = moduleCtl.storage.get(it.id)
            ? InstallState.installed
            : InstallState.uninstalled
    })
})

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
                    `https://unpkg.com/${it.package}@${version}/${it.bin}`
                ).response
        }
    } catch (err) {
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
        case InstallState.installed:
            if (
                compareVersions(
                    moduleCtl.storage.get(it.id).metadata.version,
                    it.versions.at(-1)!
                ) < 0
            )
                return '<span class="update">[有更新]</span>'
            return '[已安装]'
        case InstallState.installing:
            return '[安装中]'
        case InstallState.uninstalled:
            return ''
    }
}
</script>

<template>
    <ul class="module-list" v-if="source">
        <li v-for="it of source" :key="it.id" class="module-entry">
            <span>
                {{ it.id }}
                <span class="module-version">@{{ it.versions.at(-1) }}</span>
            </span>
            <div style="white-space: nowrap">
                <span
                    class="module-install-state"
                    v-html="installStateText(it)"
                >
                </span>
                <span
                    class="module-description"
                    :data-description="it.description"
                >
                    📙
                </span>
                <span
                    class="module-install"
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
</template>

<style scoped>
.module-install {
    transition: color 0.5s;
}

.module-install:hover {
    cursor: pointer;
    color: blueviolet;
}

.module-install-state {
    color: gray;
}

.module-install-state > :deep(.update) {
    color: blueviolet;
}

.module-description {
    position: relative;
}

.module-description:hover::after {
    content: attr(data-description);
    position: absolute;
    z-index: 70001;
    right: 25px;
    top: 25px;
    width: 400px;
    padding: 5px;
    border: 1px solid black;
    background: white;
}
</style>
