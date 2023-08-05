<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useWindows } from '@/stores/window'

const { modules } = window.exlg

const windowStore = useWindows()
const { activeWindowId: modId, activeWindowType  } = storeToRefs(windowStore)

const interfaces = computed(() => modules[modId.value!].runtime.interfaces)
const modDisplay = computed(() => modules[modId.value!].metadata.display)
</script>

<template>
    <div
        v-if="activeWindowType === 'interface'"
        class="exlg-window"
    >
        <span class="exlg-window-header">
            执行 {{ modDisplay }} 的命令
            <span>
                <span
                    class="emoji-button"
                    title="关闭"
                    @click="windowStore.closeWindow()"
                >
                    ❎
                </span>
            </span>
        </span>

        <hr class="exlg-hr close-to-top">

        <div
            v-for="({ description, fn }, name) of interfaces"
            :key="name"
        >
            <button
                class="exlg-button"
                @click="fn"
            >
                {{ description }}
            </button>
        </div>
    </div>
</template>
