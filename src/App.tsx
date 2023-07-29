import { type Component, Show, createSignal, onMount, createEffect } from 'solid-js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BigNumber } from 'bignumber.js';
import type { Account, BaseWallet } from '@polkadot-onboard/core';
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets';
import { Input, Button } from '@hope-ui/solid'

import logo from './logo.svg';
import styles from './App.module.css';
import Header from './Header';

const URL = "https://ksm-burner.vercel.app/";

const App: Component = () => {
    const [api, setApi] = createSignal<ApiPromise>();
    const [selectedAccount, setSelectedAccount] = createSignal<{ account: Account, wallet: BaseWallet }>();
    const [availableAccounts, setAvailableAccounts] = createSignal<{ account: Account, wallet: BaseWallet }[]>([]);
    const [amount, setAmount] = createSignal<string>("0");
    const [burned, setBurned] = createSignal<string>();

    const injectedWallets = new InjectedWalletProvider({}, "BURN KSM");
    const wallets = injectedWallets.getWallets();

    onMount(async () => {
        const api = await ApiPromise.create({ provider: new WsProvider("wss://kusama-rpc.polkadot.io") });

        setApi(api);
    });

    createEffect(() => {
        const chain = api();

        const runAsync = async () => {
            const accs  = (await Promise.all(wallets.map(async (w) => {
                await w.connect();

                return (await w.getAccounts()).map((acc) => {
                    return { account: acc, wallet: w }
                }
                )
            }
            ))).flat();

            setAvailableAccounts(accs);
        }

        runAsync();
    });

    const burn = async () => {
        const chain = api();
        const address = selectedAccount()?.account.address;
        const signer = selectedAccount()?.wallet.signer;

        if (!chain || !address || !signer) return;

        await chain.tx.balances.transfer(
            // moduleId "ksm/burn"
            "5EYCAe5hjM7JDBy6dM6fYa51rUYQSQVyaqh9DaMwgkUDcUTk",
            new BigNumber(amount()).times(new BigNumber("1000000000000")).toString()
        )
                   .signAndSend(address, { signer });

        setBurned(amount().toString());
    };

    return (
        <div class={styles.App}>
            <div class={styles.Container}>

                <Header
                    accounts={availableAccounts}
                    selected={selectedAccount}
                    setSelected={setSelectedAccount}
                />

                <Show when={selectedAccount()}>
                    <Input
                        placeholder='Amount'
                        value={amount().toString()}
                        onInput={e => {
                            const aa = e.currentTarget.value;
                            const a = parseFloat(aa);
                            if (typeof a === 'number') {
                                setAmount(aa);
                            }
                        }}
                    />
                    <Button onClick={() => burn()}>BURN 🔥</Button>
                </Show>
                <Show when={burned()}>
                    <p>You burned {burned()} KSM!</p>

                    <a class="twitter-share-button"
                       href={encodeURI(`https://twitter.com/intent/tweet?text=I burned ${burned() || "0"} KSM using ${URL}! 🔥`)}
                       data-size="large">
                        Tweet</a>
                </Show>
            </div>
        </div>
    );
};

export default App;
