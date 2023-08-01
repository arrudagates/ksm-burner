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
                    <Button style="border-color: white;" onClick={() => burn()}>BURN 🔥</Button>
                </Show>
                <Show when={!isBurning()} fallback={
                    <p>Burning...</p>
                }>
                    <Show when={burned()}>
                        <p>You burned {(burned() as { amount: string }).amount} KSM!</p>

                        <a class={styles.subscan} target="_blank" href={`https://kusama.subscan.io/extrinsic/${(burned() as { blockUrlPart: string }).blockUrlPart}`}>View on Subscan</a>

                        <a class={styles.tweet}
                           href={encodeURI(`https://twitter.com/intent/tweet?text=I just burned ${(burned() as { amount: string }).amount} KSM using ${URL}! 🔥\n\nhttps://kusama.subscan.io/extrinsic/${(burned() as { blockUrlPart: string }).blockUrlPart}`)}
                        >
                            Tweet
                            <svg viewBox="0 -2 20 20" height="30">
                                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                    <g id="Dribbble-Light-Preview" transform="translate(-60.000000, -7521.000000)" fill="white">
                                        <g id="icons" transform="translate(56.000000, 160.000000)">
                                            <path d="M10.29,7377 C17.837,7377 21.965,7370.84365 21.965,7365.50546 C21.965,7365.33021 21.965,7365.15595 21.953,7364.98267 C22.756,7364.41163 23.449,7363.70276 24,7362.8915 C23.252,7363.21837 22.457,7363.433 21.644,7363.52751 C22.5,7363.02244 23.141,7362.2289 23.448,7361.2926 C22.642,7361.76321 21.761,7362.095 20.842,7362.27321 C19.288,7360.64674 16.689,7360.56798 15.036,7362.09796 C13.971,7363.08447 13.518,7364.55538 13.849,7365.95835 C10.55,7365.79492 7.476,7364.261 5.392,7361.73762 C4.303,7363.58363 4.86,7365.94457 6.663,7367.12996 C6.01,7367.11125 5.371,7366.93797 4.8,7366.62489 L4.8,7366.67608 C4.801,7368.5989 6.178,7370.2549 8.092,7370.63591 C7.488,7370.79836 6.854,7370.82199 6.24,7370.70483 C6.777,7372.35099 8.318,7373.47829 10.073,7373.51078 C8.62,7374.63513 6.825,7375.24554 4.977,7375.24358 C4.651,7375.24259 4.325,7375.22388 4,7375.18549 C5.877,7376.37088 8.06,7377 10.29,7376.99705">

                                            </path>
                                        </g>
                                    </g>
                                </g>
                            </svg>
                        </a>
                    </Show>
                </Show>
            </div>
        </div>
    );
};

export default App;
