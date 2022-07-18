<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { kModuleCtl } from '@/utils/injectionSymbols'
import ConfigItem from '@comp/ConfigItem.vue'
import useWindowStore from '@/stores/window'

const moduleCtl = inject(kModuleCtl)!
const { utils, schemas, modules } = window.exlg

const configId = ref<string | null>(null)
const configStorage = computed(() =>
    configId.value ? moduleCtl.moduleStorages[configId.value] : undefined
)
const configDisplay = computed(() =>
    configId.value === 'market'
        ? '市场'
        : modules[configId.value!].metadata.display
)

const windowStore = useWindowStore()
console.log(windowStore)
Object.assign(window, { windowStore })

defineExpose({
    showConfig(id: string) {
        configId.value = id
        windowStore.focus('config')
        console.log(windowStore.active)
    }
})

function close() {
    configId.value = null
    windowStore.blur()
}

const clearTime = ref(0)

function clearConfig() {
    utils.simpleAlert('确定要清空配置？', {
        onAccept: () => {
            moduleCtl.moduleStorages[configId.value!].clear()
            clearTime.value++ // Note: 重新加载配置列表
        }
    })
}
</script>

<template>
    <div
        class="exlg-window"
        v-if="configId"
        v-show="windowStore.active === 'config'"
    >
        <span class="exlg-window-header">
            配置 {{ configDisplay }}
            <span>
                <span
                    class="emoji-button"
                    title="清空配置"
                    @click="clearConfig"
                >
                    🗑️
                </span>
                <span class="emoji-button" title="关闭" @click="close">
                    ❎
                </span>
            </span>
        </span>

        <hr class="exlg-hr close-to-top" />

        <div class="config-list" :key="clearTime">
            <template
                v-for="(schema, name) of schemas[configId].dict"
                :key="name"
            >
                <div v-if="schema?.meta?.description">
                    {{ name }}
                    <ConfigItem
                        :schema="schema"
                        :name="name"
                        :storage="configStorage"
                    />
                    {{ schema.meta.description }}
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.config-list:empty::before {
    content: '没有可用配置项';
}

.config-list > * {
    margin-bottom: 10px;
}
</style>
