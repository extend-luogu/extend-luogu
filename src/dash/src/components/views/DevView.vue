<script setup lang="ts">
import { ref } from 'vue'
import { useModules } from '@/stores/module'

const { utils, coreVersion } = window.exlg
const moduleStore = useModules()

const debug = ref(false)
const debugClickCount = ref(0)
function debugClick() {
    if (++debugClickCount.value === 5) {
        debug.value = true // 开启调试模式
        window.exlg.moduleControl = moduleStore.moduleControl
    }

    if (debugClickCount.value === 10) {
        utils.simpleAlert('尝试一下《Celeste 蔚蓝》吧！一款震撼心灵的游戏', {
            noCancel: true,
            title: 'To: Madeline'
        })
    }

    if (debugClickCount.value === 15) {
        utils.simpleAlert('……不要，不要再点了！QAQ', { noCancel: true })
    }
}
</script>

<template>
    <div>
        core <span class="module-version">@{{ coreVersion }}</span>
        <hr class="exlg-hr">
        <p
            class="debug-button"
            :class="{ debug }"
            @click.prevent="debugClick"
        >
            DEBUG
        </p>
    </div>
</template>

<style scoped>
.debug-button {
    user-select: none;
}

.debug-button.debug {
    color: var(--accent-color);
}
</style>
