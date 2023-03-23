<script setup lang="ts">
import { ref } from 'vue';
import { UltraApi } from './interfaces/wallet';
let loading = ref(false);
let isLinking = ref(false);
let errorMessage = ref('');
let account = ref<string | undefined>(undefined);
let permission = ref('active');
let messageToSign = ref('kljfdskljfklsdjklfsdjkljfklsdjfklsdfsdfsdfds');

// import HelloWorld from './components/HelloWorld.vue'
function getAPI(): UltraApi {
    return window.hasOwnProperty('ultra') && typeof window['ultra'] === 'object' ? window['ultra'] : undefined;
}

async function connectWallet() {
    loading.value = true;

    const ultra = getAPI();
    if (typeof ultra === 'undefined') {
        isLinking.value = false;
        loading.value = false;
        errorMessage.value = 'Extension is not installed.';
        return;
    }

    const result = await ultra.connect().catch((err) => {
        return err;
    });

    if (result.status !== 'success') {
        isLinking.value = false;
        loading.value = false;
        errorMessage.value = 'Extension window is already open. Close it, and try refreshing this page.';
        return;
    }

    const [accountName, permissionName] = result.data.blockchainid.split('@');
    account.value = accountName;
    permission.value = permissionName;

    isLinking.value = false;
    loading.value = false;
}
</script>

<template>
    <div class="card">
        <div class="stack">
            <div class="split">
                <div class="logo no-select">
                    <img src="/ultra.svg" />
                </div>
                <div class="logo-spacer no-select">X</div>
                <div class="logo no-select">
                    <img src="/discord.svg" />
                </div>
            </div>
        </div>
        <h3 class="pt-2 no-select">Ultra x Discord Link Request</h3>
        <p class="no-select">A message will need to be signed by your Ultra Blockchain account.</p>
        <!-- Show Loading -->
        <template v-if="loading">
            <div class="pt-2" v-if="loading">
                <div class="lds-roller">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </template>
        <!-- Show Everything Else -->
        <template v-else-if="!loading && errorMessage">
            <h3 class="pt-2">Error</h3>
            <p>{{ errorMessage }}</p>
        </template>
        <template v-else>
            <template v-if="!account">
                <div class="button mt-4" @click="connectWallet">Connect Wallet</div>
            </template>
            <template v-else>
                <h5>You are signed in as, {{ account }}@{{ permission }}</h5>
                <div class="message-to-sign">
                    {{ messageToSign }}
                </div>
            </template>
        </template>
    </div>
</template>

<style scoped>
.button {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    box-sizing: border-box;
    padding: 12px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
}

.button:hover {
    background: rgba(255, 255, 255, 0.2);
}

.button:active {
    transform: scale(0.98);
}

.split {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
}

.stack {
    display: flex;
    flex-direction: column;
}

.no-select {
    user-select: none;
}

.logo-spacer {
    display: flex;
    font-size: 18px;
    flex-direction: column;
    align-self: center;
    padding-right: 24px;
    padding-left: 24px;
}

.pr-1 {
    padding-right: 12px;
}

.pl-1 {
    padding-left: 12px;
}

.pt-2 {
    padding-top: 24px;
}

.pb-2 {
    padding-bottom: 24px;
}

.mt-2 {
    margin-top: 24px;
}

.mb-2 {
    margin-bottom: 24px;
}

.card {
    padding: 32px;
    box-sizing: border-box;
    background: rgb(22, 22, 22);
    border-radius: 12px;
    max-width: 350px;
}

.logo {
    min-height: 5em;
    max-height: 5em;
    opacity: 0.35;
}

.logo img {
    min-height: 5em;
    max-height: 5em;
}

.message {
    font-family: 'consolas';
    font-size: 12px;
    border: 2px solid rgb(22, 22, 22);
    border-radius: 6px;
    padding: 5px;
    box-sizing: border-box;
}
</style>
