<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { kModuleCtl } from '../utils/injectionSymbols'
import ConfigItem from './ConfigItem.vue'

const moduleCtl = inject(kModuleCtl)!
const { utils, schemas } = window.exlg

const configId = ref<string | null>(null)
const configStorage = computed(() =>
    configId.value ? moduleCtl.moduleStorages[configId.value] : undefined
)

defineExpose({
    showConfig(id: string) {
        configId.value = id
    }
})

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
    <div class="config" v-if="configId">
        <span class="config-header">
            配置 {{ configId }}
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
                    @click="configId = null"
                >
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
.config {
    top: 0;
    right: calc(100% + 20px);
    position: absolute;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 20px;
    background: white;
    box-shadow: 0 0 1px 1px #000;
}

.config-header {
    display: flex;
    justify-content: space-between;
}

.config-list:empty::before {
    content: '没有可用配置项';
}

.config-list > * {
    margin-bottom: 10px;
}
</style>
