<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useModules } from '@/stores/module'
import type { AllSourceItem, ModuleMetadata } from '@core/types'
import { marketStorage } from '@/utils/source'
import { Icon } from '@iconify/vue'
import biCloudDownload from '@iconify-icons/bi/cloud-download'
import biXLg from '@iconify-icons/bi/x-lg'

const props = defineProps<{
    sourceItem: AllSourceItem
}>()

const emit = defineEmits<{
    (e: 'installModule'): void
}>()

const { utils: { exlgLog, csGet } } = window.exlg
const logger = exlgLog('market')

const moduleStore = useModules()
const { moduleControl, installStates } = storeToRefs(moduleStore)
const { checkDependencies, installModule, InstallStates } = moduleControl.value

async function install(item: AllSourceItem) {
    if (installStates.value[item.id] === InstallStates.installing) return
    installStates.value[item.id] = InstallStates.installing

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
                    `${marketStorage.get('npmSource')}/${item.package}@${metadata.version}/${item.bin}`
                )
            ).response
        }
    } catch (err) {
        installStates.value[item.id] = InstallStates.installFailed
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

    installModule(metadata, script!)
    installStates.value[item.id] = InstallStates.installed
    emit('installModule')
}

const depCheckResult = computed(() => checkDependencies(props.sourceItem.selectedVersion.dependencies))
</script>

<template>
    <span
        v-if="depCheckResult[0]"
        class="icon-button module-install"
        title="安装"
        :style="{
            visibility:
                installStates[sourceItem.id] === InstallStates.installing
                    ? 'hidden'
                    : 'visible'
        }"
        @click="install(sourceItem)"
    >
        <Icon
            :icon="biCloudDownload"
            style="position: relative; top: 2.25px;"
        />
    </span>
    <span
        v-else
        class="exlg-tooltip"
        :data-exlg-tooltip="`缺少依赖项：${depCheckResult[1].join(', ')}`"
    >
        <Icon
            :icon="biXLg"
            style="position: relative; top: 2.25px; color: rgb(225 29 72);"
        />
    </span>
</template>
