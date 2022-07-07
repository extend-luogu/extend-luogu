<script setup lang="ts">
import { inject, ref } from 'vue'
import { kModuleCtl } from '../utils/injectionSymbols'

const { utils, coreVersion } = window.exlg
const moduleCtl = inject(kModuleCtl)!

const debug = ref(false)
const debugClickCount = ref(0)
function debugClick() {
    if (++debugClickCount.value === 5) {
        debug.value = true
        window.exlg.moduleCtl = moduleCtl
    }

    if (debugClickCount.value === 10) {
        utils.simpleAlert('……不要，不要再点了！QAQ', { noCancel: true })
    }
}
</script>

<template>
    <div>
        core <span class="module-version">@{{ coreVersion }}</span>
        <hr class="exlg-hr" />
        <p @click.prevent="debugClick" class="debug-button" :class="{ debug }">
            DEBUG
        </p>
    </div>
</template>

<style scoped>
.debug-button {
    user-select: none;
}

.debug-button.debug {
    color: blueviolet;
}
</style>
