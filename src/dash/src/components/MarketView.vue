<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { ModuleMetadata } from '../../../core/module'
import { kModuleCtl } from '../utils/injectionSymbols'

const emits = defineEmits<{
    (e: 'updateModule'): void
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
    })
})

async function install(it: AllSourceItem, vid: number) {
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
    emits('updateModule')
}
</script>

<template>
    <ul class="module-list" v-if="source">
        <li v-for="it of source" :key="it.id" class="module-entry">
            <span>
                {{ it.id }}
                <span class="module-version">@{{ it.versions.at(-1) }}</span>
                <span
                    v-if="moduleCtl.storage.get(it.id)"
                    class="module-installed"
                >
                    [installed]
                </span>
            </span>
            <span>
                <span
                    class="module-description"
                    :data-description="it.description"
                >
                    📙
                </span>
                <span
                    class="module-install"
                    @click="install(it, it.versions.length - 1)"
                >
                    ⬇️
                </span>
            </span>
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

.module-installed {
    color: gray;
}

.module-description {
    position: relative;
}

.module-description:hover::after {
    content: attr(data-description);
    position: absolute;
    right: -15px;
    top: 25px;
    width: 335px;
    padding: 5px;
    border: 1px solid black;
    background: white;
}
</style>
