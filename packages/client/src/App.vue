<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { UltraApi } from './interfaces/wallet';
import { HeaderInfo } from './interfaces/header';
import { Account } from './interfaces/account';

import Header from './components/Header.vue';
import Loading from './components/Loading.vue';
import { ServerResponse } from './interfaces/serverResponse';

let loading = ref(false);
let isLinking = ref(false);
let isDone = ref(false);
let apiRef = ref<UltraApi>(undefined);

let headerFormat = ref<HeaderInfo>({
    title: 'Connect with Ultra Wallet',
    message: 'Connect using your Ultra.io account to link with Discord.',
});

let accountInfo = ref<Account>();

let messageToSign = ref<string | undefined>(undefined);
let originalMessage = ref<string | undefined>(undefined);
let endpointCallback = ref<string | undefined>(undefined);

function getAPI(): UltraApi {
    return window.hasOwnProperty('ultra') && typeof window['ultra'] === 'object' ? window['ultra'] : undefined;
}

async function signAndSend() {
    loading.value = true;

    headerFormat.value = {
        title: `Waiting for Message Signature`,
        message: 'Continue through Ultra Wallet',
        asError: false,
    };

    const response = await apiRef.value.signMessage(messageToSign.value).catch((err) => {
        return undefined;
    });

    if (!response || response.status === 'fail' || response.status === 'error') {
        loading.value = false;
        headerFormat.value = {
            title: `Hello, ${accountInfo.value.blockchainid}`,
            message: 'Failed to sign message successfully. Try again?',
            asError: false,
        };
        return;
    }

    // Check Post Request Callback Here
    const params = {
        key: accountInfo.value.publicKey,
        signature: response.data.signature,
        hash: messageToSign.value,
    };

    const postResponse: Response | undefined = await fetch(endpointCallback.value, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    })
        .then((res) => {
            return res;
        })
        .catch((err) => {
            console.error(err);
            return undefined;
        });

    if (typeof postResponse === 'undefined') {
        loading.value = false;
        headerFormat.value = {
            title: `Failed to Validate Signature`,
            message: '',
            asError: false,
        };
        return;
    }

    const result: ServerResponse = await postResponse.json();
    if (!result.status) {
        loading.value = false;
        headerFormat.value = {
            title: `Failed to Validate Signature`,
            message: result.message,
            asError: false,
        };
        return;
    }

    // Let them know it worked...
    headerFormat.value = {
        title: `Message Signed!`,
        message: 'Check back on Discord to see your roles updated.',
        asError: false,
    };

    isDone.value = true;
    loading.value = false;
}

async function connectWallet() {
    loading.value = true;

    const ultra = getAPI();
    if (typeof ultra === 'undefined') {
        isLinking.value = false;
        loading.value = false;
        headerFormat.value = { title: 'Error', message: 'Extension is not installed', asError: true };
        return;
    }

    const result = await ultra.connect().catch((err) => {
        return undefined;
    });

    if (typeof result === 'undefined') {
        isLinking.value = false;
        loading.value = false;
        headerFormat.value = {
            title: 'Error',
            message: 'Extension window already open. Close window and refresh this page',
            asError: true,
        };
        return;
    }

    const [accountName, permissionName] = result.data.blockchainid.split('@');
    accountInfo.value = {
        blockchainid: accountName,
        permission: permissionName,
        publicKey: result.data.publicKey,
    };

    headerFormat.value = {
        title: `Hello, ${accountName}`,
        message: 'Sign the message below to finish linking your Discord Account.',
        asError: false,
    };

    apiRef.value = ultra;
    isLinking.value = false;
    loading.value = false;
}

onMounted(() => {
    if (location.protocol !== 'https:') {
        headerFormat.value = {
            title: `HTTP(s) Only`,
            message: 'Unfortunately the wallet only works with HTTP(s). Secure the application with SSL first.',
            asError: true,
        };
        return;
    }

    loading.value = true;

    // http://localhost:3000/sign?cb=http://localhost:3000/verify&hash=67b7c08b6d577c491ac1c083a71c5171f561ec6ab419645ca0f8b47019687076&message=202685967935471617%20is%20linking%20their%20blockchain%20id%20to%20this%20service.%20By%20signing%20this%20message%20this%20confirms%20identification
    const uri = window.location.search.substring(1);
    const params = new URLSearchParams(uri);

    messageToSign.value = params.get('hash');
    originalMessage.value = params.get('message');
    endpointCallback.value = params.get('cb');

    if (!messageToSign.value || !originalMessage.value || !endpointCallback.value) {
        headerFormat.value = {
            title: `Params Missing`,
            message: 'This linking request is missing parameters, visit the Discord Server and try again.',
            asError: true,
        };

        loading.value = false;
        return;
    }

    loading.value = false;
});
</script>

<template>
    <div class="card">
        <Header :header="headerFormat" />
        <Loading v-if="loading" />
        <template v-else>
            <template v-if="!isDone && !accountInfo && !headerFormat.asError">
                <div class="button mt-4" @click="connectWallet">Connect Wallet</div>
            </template>
            <template
                v-if="
                    !isDone &&
                    accountInfo &&
                    !headerFormat.asError &&
                    messageToSign &&
                    endpointCallback &&
                    originalMessage
                "
            >
                <h4>Message</h4>
                <div class="message-to-sign">
                    {{ originalMessage }}
                </div>
                <h4>Hash</h4>
                <div class="message-to-sign mb-2">
                    {{ messageToSign }}
                </div>
                <div class="button" @click="signAndSend">Sign & Send</div>
            </template>
        </template>
    </div>
</template>

<style>
.button {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    box-sizing: border-box;
    padding: 12px;
    border-radius: 6px;
    color: white;
    font-weight: bolder;
    background: #8d71d9;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
}

.button:hover {
    background: #7560ae;
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
    background: #312d36;
    border-radius: 12px;
    min-width: 400px;
    max-width: 400px;
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

.message-to-sign {
    font-family: 'consolas' !important;
    font-size: 12px;
    border: 2px solid rgb(28, 28, 28);
    border-radius: 6px;
    padding: 10px;
    box-sizing: border-box;
    background: rgb(22, 22, 22);
    word-wrap: break-word;
    text-align: justify;
}
</style>
