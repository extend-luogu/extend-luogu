<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { kModuleCtl } from '../utils/injectionSymbols'
import ConfigItem from './ConfigItem.vue'

const moduleCtl = inject(kModuleCtl)!
const { schemas } = window.exlg

const configId = ref<string | null>(null)
const configStorage = computed(() =>
    configId.value ? moduleCtl.moduleStorages[configId.value] : undefined
)

defineExpose({
    showConfig(id: string) {
        configId.value = id
    }
})
</script>

<template>
    <div class="config" v-if="configId">
        <span class="config-header">
            设置 {{ configId }}
            <span @click="configId = null" style="cursor: pointer">关闭</span>
        </span>

        <hr class="exlg-hr close-to-top" />

        <div class="config-list">
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
</style>
