<script setup lang="ts">
import { computed, ref } from 'vue'
import useWindowStore from '@/stores/window'

const { modules } = window.exlg

const modId = ref<string | null>(null)

const interfaces = computed(() => modules[modId.value!].runtime.interfaces)
const modDisplay = computed(() => modules[modId.value!].metadata.display)

const windowStore = useWindowStore()

defineExpose({
    showInterface: (id: string) => {
        modId.value = id
        windowStore.focus('interface')
        console.log(windowStore.active)
    }
})

function close() {
    modId.value = null
    windowStore.blur()
}
</script>

<template>
    <div
        v-if="modId"
        class="exlg-window"
        v-show="windowStore.active === 'interface'"
    >
        <span class="exlg-window-header">
            执行 {{ modDisplay }} 的命令
            <span>
                <span class="emoji-button" title="关闭" @click="close">
                    ❎
                </span>
            </span>
        </span>

        <hr class="exlg-hr close-to-top" />

        <div v-for="({ description, fn }, name) of interfaces" :key="name">
            <button class="exlg-button" @click="fn">
                {{ description }}
            </button>
        </div>
    </div>
</template>
