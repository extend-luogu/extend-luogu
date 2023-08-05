<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import ConfigItem from '@comp/ConfigItem.vue'
import { useModules } from '@/stores/module'
import { useWindows } from '@/stores/window'
import { marketStorage } from '@/utils/source'

const { utils, schemas, modules } = window.exlg
const moduleStore = useModules()
const windowStore = useWindows()
const { activeWindowId: configId, activeWindowType } = storeToRefs(windowStore)

const configStorage = computed(() =>
    configId.value === 'market'
        ? marketStorage
        : moduleStore.moduleControl.moduleStorages[configId.value!])
const configDisplay = computed(() =>
    configId.value === 'market'
        ? '市场'
        : modules[configId.value!].metadata.display
)

const clearTime = ref(0)

function clearConfig() {
    utils.simpleAlert('确定要清空配置？', {
        onAccept: () => {
            moduleStore.moduleControl.moduleStorages[configId.value!].clear()
            clearTime.value++ // Note: 重新加载配置列表
        }
    })
}
</script>

<template>
    <div
        v-if="activeWindowType === 'config' && configId"
        class="exlg-window"
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
                <span
                    class="emoji-button"
                    title="关闭"
                    @click="windowStore.closeWindow"
                >
                    ❎
                </span>
            </span>
        </span>

        <hr class="exlg-hr close-to-top">

        <div
            :key="clearTime"
            class="config-list"
        >
            <template
                v-for="(schema, name) of schemas[configId].dict"
                :key="name"
            >
                <div
                    v-if="schema?.meta?.description"
                    class="config-item"
                >
                    <ConfigItem
                        :schema="schema"
                        :name="name"
                        :storage="configStorage"
                    />
                    <span
                        :data-exlg-tooltip="name"
                        class="config-description"
                    >{{ schema.meta.description }}</span>
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

.config-item {
    display: flex;
}

.config-description {
    margin-left: 10px;
}

input {
    width: 100%;
}
</style>
