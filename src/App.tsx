import { type Component, Show, createSignal, onMount, createEffect } from 'solid-js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { encodeAddress } from '@polkadot/util-crypto';
import { BigNumber } from 'bignumber.js';
import type { Account, BaseWallet } from '@polkadot-onboard/core';
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets';
import { Input, Button } from '@hope-ui/solid'

import logo from './logo.svg';
import styles from './App.module.css';
import Header from './Header';

// moduleId "ksm/burn"
const BURN_ACCOUNT = "5EYCAe5hjM7JDBy6dM6fYa51rUYQSQVyaqh9DaMwgkUDcUTk";
const URL = "https://ksm-burner.vercel.app/";

const App: Component = () => {
    const [api, setApi] = createSignal<ApiPromise>();
    const [selectedAccount, setSelectedAccount] = createSignal<{ account: Account, wallet: BaseWallet }>();
    const [availableAccounts, setAvailableAccounts] = createSignal<{ account: Account, wallet: BaseWallet }[]>([]);
    const [amount, setAmount] = createSignal<string>("0");
    const [burned, setBurned] = createSignal<{ amount: string; blockUrlPart: string }>();
    const [isBurning, setIsBurning] = createSignal<boolean>(false);
    const [totalBurned, setTotalBurned] = createSignal<string>("0");
    const [userBalance, setUserBalance] = createSignal<string>("0");

    const injectedWallets = new InjectedWalletProvider({}, "BURN KSM");
    const wallets = injectedWallets.getWallets();

    onMount(async () => {
        const chain = await ApiPromise.create({ provider: new WsProvider(
            "wss://kusama-rpc.polkadot.io"
            // "wss://rococo-asset-hub-rpc.polkadot.io"
        ) });

        setApi(chain);

        await chain.query.system.account(BURN_ACCOUNT, ({ data: balance }: { data: { free: string } }) => {
            const b = new BigNumber(balance.free).div(new BigNumber("1000000000000")).toString();
            setTotalBurned(b);
        });
    });

    createEffect(() => {
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

    createEffect(() => {
        const chain = api();
        const usr = selectedAccount()?.account.address;

        if (!chain || !usr) return;


        chain.query.system.account(usr, ({ data: balance }: { data: { free: string } }) => {
            const b = new BigNumber(balance.free).div(new BigNumber("1000000000000")).toString();
            setUserBalance(b);
        });
    })

    const burn = async () => {
        const chain = api();
        const address = selectedAccount()?.account.address;
        const signer = selectedAccount()?.wallet.signer;

        if (!chain || !address || !signer) return;

        setIsBurning(true);

        await chain.tx.balances.transfer(
            BURN_ACCOUNT,
            new BigNumber(amount()).times(new BigNumber("1000000000000")).toString()
        )
                   .signAndSend(address, { signer }, ({ status, txIndex }) => {
                       if (status.isInBlock) {
                           chain.rpc.chain.getHeader(status.asInBlock).then((header) => {
                               setBurned({ amount: amount().toString(), blockUrlPart: `${header.number}-${txIndex}` });
                               setIsBurning(false);
                           });
                       }
                   });
    };

    return (
        <div class={styles.App}>
            <div class={styles.container}>
                <h1>Burn Your KSM! 🔥🐦‍⬛</h1>

                <div class={styles.Title}>Total Burned: {totalBurned()} KSM</div>

                <Header
                    accounts={availableAccounts}
                    selected={selectedAccount}
                    setSelected={setSelectedAccount}
                />

                <Show when={selectedAccount()}>
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <p>Your free balance: {userBalance()} KSM</p>
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
                    </div>
                </Show>
                <Show when={!isBurning()} fallback={
                    <p>Burning...</p>
                }>
                    <Show when={burned()}>
                        <p>You burned {(burned() as { amount: string }).amount} KSM!</p>

                        <a target="_blank" href={`https://kusama.subscan.io/${(burned() as { blockUrlPart: string }).blockUrlPart}`}>View on Subscan</a>

                        <a class="twitter-share-button"
                           href={encodeURI(`https://twitter.com/intent/tweet?text=I burned ${(burned() as { amount: string }).amount} KSM using ${URL}! 🔥\n\nhttps://kusama.subscan.io/extrinsic/${(burned() as { blockUrlPart: string }).blockUrlPart}`)}
                           data-size="large">
                            Tweet</a>
                    </Show>
                </Show>
            </div>
        </div>
    );
};

export default App;
